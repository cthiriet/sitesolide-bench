"""Turns the raw data of every run into the published tables.

For each run: the memory in use (MemTotal - MemAvailable) as the median of
each rest window, the cost of each block of copies, the latency of every
class during the last traffic window, the deploy times and the disk added.

Usage: python3 analyze.py <run folder>... > summary.md
"""

import csv
import gzip
import json
import statistics
import sys
from pathlib import Path

MIB = 1024


def phases(run: Path) -> list[tuple[str, int, int]]:
    with open(run / "phases.csv") as f:
        return [(r["phase"], int(r["apps"]), int(r["epoch"])) for r in csv.DictReader(f)]


def samples(run: Path) -> list[dict[str, float]]:
    with open(run / "memory.csv") as f:
        return [{k: float(v) for k, v in r.items()} for r in csv.DictReader(f)]


def rest_windows(run: Path) -> dict[int, tuple[int, int]]:
    starts, windows = {}, {}
    for name, apps, epoch in phases(run):
        if name == "rest-start":
            starts[apps] = epoch
        elif name == "rest-end":
            windows[apps] = (starts[apps], epoch)
    return windows


def memory_at_rest(run: Path) -> dict[int, dict[str, float]]:
    """The median, in MiB, of each rest window's samples."""
    rows = samples(run)
    out = {}
    for apps, (start, end) in rest_windows(run).items():
        window = [r for r in rows if start <= r["epoch"] <= end]
        used = [(r["mem_total_kb"] - r["mem_available_kb"]) / MIB for r in window]
        fixed = [
            (r["anon_kb"] + r["shmem_kb"] + r["kernel_stack_kb"] + r["page_tables_kb"] + r["sunreclaim_kb"]) / MIB
            for r in window
        ]
        out[apps] = {"used": statistics.median(used), "non_reclaimable": statistics.median(fixed), "samples": len(window)}
    return out


def latency(run: Path, apps: int) -> dict[str, dict[str, float]]:
    """p50 and p95 of http_req_duration per class, and the failure rate."""
    path = run / f"k6-{apps}.csv.gz"
    if not path.exists():
        return {}
    durations: dict[str, list[float]] = {}
    failed: dict[str, list[float]] = {}
    with gzip.open(path, "rt") as f:
        for r in csv.DictReader(f):
            cls = r.get("scenario", "").split("_")[0]
            if not cls:
                continue
            if r["metric_name"] == "http_req_duration":
                durations.setdefault(cls, []).append(float(r["metric_value"]))
            elif r["metric_name"] == "http_req_failed":
                failed.setdefault(cls, []).append(float(r["metric_value"]))
    out = {}
    for cls, values in durations.items():
        q = statistics.quantiles(values, n=100) if len(values) > 1 else [values[0]] * 99
        out[cls] = {
            "requests": len(values),
            "p50_ms": q[49],
            "p95_ms": q[94],
            "failed": sum(failed.get(cls, [])) / max(len(failed.get(cls, [])), 1),
        }
    return out


def deploys(run: Path) -> dict[str, list[float]]:
    out: dict[str, list[float]] = {}
    for line in (run / "deploy.txt").read_text().split("\n"):
        if line.strip():
            slug, seconds = line.split()
            out.setdefault(slug.rsplit("-", 1)[0], []).append(float(seconds))
    return out


APP_PREFIXES = ("docs-", "wiki-", "crm-")
PLATFORM = {"caddy", "bun", "dockerd", "containerd", "docker-proxy"}


def category(comm: str, cgroup: str) -> str:
    """Where a process belongs: the apps themselves, what runs them, the
    platform in front, or the rest of the system."""
    unit = cgroup.rsplit("/", 1)[-1]
    if unit.startswith(APP_PREFIXES) or "docker-" in cgroup or comm == "firecracker":
        return "apps"
    if comm.startswith("containerd-shim"):
        return "per-app runtime"
    if comm in PLATFORM or unit.startswith(("caddy", "bench-caddy", "dashboard", "portal", "sitesolide-", "docker", "containerd")):
        return "platform"
    return "system"


def pss_breakdown(run: Path, apps: int) -> dict[str, float]:
    path = run / f"pss-{apps}.csv"
    out: dict[str, float] = {}
    if not path.exists():
        return out
    with open(path) as f:
        for r in csv.DictReader(f):
            key = category(r["comm"], r["cgroup"])
            out[key] = out.get(key, 0) + int(r["pss_kb"]) / MIB
    return out


def analyze(run: Path) -> dict:
    setup = run.parent.name
    memory = memory_at_rest(run)
    counts = sorted(memory)
    blocks = {}
    order = ["docs", "wiki", "crm"]
    for i, (before, after) in enumerate(zip(counts, counts[1:])):
        blocks[order[i]] = (memory[after]["used"] - memory[before]["used"]) / (after - before)
    last = counts[-1]
    disk = {int(p.stem.split("-")[1]): int(p.read_text()) for p in run.glob("disk-*.txt")}
    return {
        "setup": setup,
        "run": run.name,
        "memory_at_rest_mib": memory,
        "fixed_cost_mib": memory[0]["used"],
        "cost_per_app_mib": (memory[last]["used"] - memory[0]["used"]) / last,
        "cost_per_dynamic_app_mib": (memory[last]["used"] - memory[counts[1]]["used"]) / (last - counts[1]),
        "cost_per_app_by_class_mib": blocks,
        "non_reclaimable_per_app_mib": (memory[last]["non_reclaimable"] - memory[0]["non_reclaimable"]) / last,
        "non_reclaimable_by_class_mib": {
            order[i]: (memory[after]["non_reclaimable"] - memory[before]["non_reclaimable"]) / (after - before)
            for i, (before, after) in enumerate(zip(counts, counts[1:]))
        },
        "latency_at_full_load": latency(run, last),
        "deploy_seconds_median": {k: statistics.median(v) for k, v in deploys(run).items()},
        "disk_added_mib": (disk.get(last, 0) - disk.get(0, 0)) / MIB / MIB,
        "apps": last,
        "pss_mib": {n: pss_breakdown(run, n) for n in counts},
    }


def main() -> None:
    results = [analyze(Path(p).resolve()) for p in sys.argv[1:]]
    Path("/root/bench/results/summary.json").write_text(json.dumps(results, indent=2))
    print("| Setup | Apps | Fixed cost | Per app | Per app, no static | docs | wiki | crm | Disk added |")
    print("|---|---|---|---|---|---|---|---|---|")
    for r in results:
        b = r["cost_per_app_by_class_mib"]
        print(
            f"| {r['setup']} | {r['apps']} | {r['fixed_cost_mib']:.0f} MiB | {r['cost_per_app_mib']:.1f} MiB"
            f" | {r['cost_per_dynamic_app_mib']:.1f} MiB | {b.get('docs', 0):.1f} | {b.get('wiki', 0):.1f}"
            f" | {b.get('crm', 0):.1f} | {r['disk_added_mib']:.0f} MiB |"
        )
    print()
    print("Non-reclaimable memory (anon + shmem + kernel stacks + page tables + unreclaimable slab), per app:")
    print()
    print("| Setup | Per app | docs | wiki | crm |")
    print("|---|---|---|---|---|")
    for r in results:
        b = r["non_reclaimable_by_class_mib"]
        print(f"| {r['setup']} | {r['non_reclaimable_per_app_mib']:.1f} MiB | {b.get('docs', 0):.1f} | {b.get('wiki', 0):.1f} | {b.get('crm', 0):.1f} |")
    print()
    print("| Setup | Class | Requests | p50 | p95 | Failed | Deploy (median) |")
    print("|---|---|---|---|---|---|---|")
    for r in results:
        for cls, l in sorted(r["latency_at_full_load"].items()):
            d = r["deploy_seconds_median"].get(cls, 0)
            print(f"| {r['setup']} | {cls} | {l['requests']} | {l['p50_ms']:.1f} ms | {l['p95_ms']:.1f} ms | {l['failed']:.2%} | {d:.1f} s |")
    print()
    print("| Setup | Apps | apps | per-app runtime | platform | system |")
    print("|---|---|---|---|---|---|")
    for r in results:
        for n, b in r["pss_mib"].items():
            print(f"| {r['setup']} | {n} | {b.get('apps', 0):.0f} | {b.get('per-app runtime', 0):.0f} | {b.get('platform', 0):.0f} | {b.get('system', 0):.0f} |")


if __name__ == "__main__":
    main()

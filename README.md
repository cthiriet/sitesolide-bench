# sitesolide-bench

The same 30 apps deployed three ways on one bare-metal server, as sandboxed
systemd services, as Docker containers and as Firecracker micro-VMs, and the
memory each way costs under realistic traffic.

The write-up: [30 apps on one server: systemd, Docker and Firecracker,
measured](https://sitesolide.fr/blog/30-apps-on-one-server.html).

## The numbers

Memory per app with 30 apps deployed, `(memory with 30 apps - memory with
none) / 30`:

| Setup | Per app | Without the static sites | Machine with 30 apps |
|---|---|---|---|
| systemd services, deployed by [sitesolide](https://github.com/cthiriet/sitesolide) 0.13.0 | 100 MiB | 143 MiB | 4.2 GiB |
| Docker 29.9.2 with Compose | 130 MiB | 183 MiB | 4.8 GiB |
| Kata Containers 4.3.1 with Firecracker 1.17.0 | 583 MiB | 768 MiB | 18.0 GiB |

Every table, latency and disk included, is in
[results/summary.md](results/summary.md), and in
[results/summary.json](results/summary.json).

## What is here

| Path | What it holds |
|---|---|
| [PROTOCOL.md](PROTOCOL.md) | the method, written before the first measurement |
| `apps/` | the three apps, each written by a coding agent, with its seed data and its k6 scenario in `k6/` |
| `setups/` | how each setup deploys and removes a copy: sitesolide manifests, Compose files, the Kata, containerd and Caddy configuration |
| `harness/` | the run: `switch.sh` leaves one setup enabled and reboots, `run.sh` deploys, sends the traffic and samples memory, `teardown.sh` removes the copies, `analyze.py` writes the summary |
| `results/<setup>/<run>/` | the raw data of each run: memory every 5 seconds, the PSS of every process, k6's results, deploy times, disk |
| `logs/` | the output of every deploy and removal |

`results/rehearsal-sitesolide-*` is a dry run with one copy of each app and
20-second windows, made to check the harness. No number comes from it.

The apps were served under a zone of their own during the runs; it reads
`bench.example.com` here.

## Running it

The scripts ran as root from `/root/bench` on one Debian 13 server, and are
published as they ran rather than as a turnkey tool. A run, for each setup:

```sh
export BENCH_ZONE=bench.example.com   # a zone whose names point at the server
harness/switch.sh docker              # one setup enabled, then a reboot
harness/run.sh docker                 # about 40 minutes
harness/teardown.sh docker
```

then, once the three have run:

```sh
python3 harness/analyze.py results/sitesolide/* results/docker/* results/microvm/* > results/summary.md
```

One run per setup is not a study. Run it on your own hardware, tune Docker
your way, and send your numbers.

## License

MIT, see [LICENSE](LICENSE).

# 30 apps, three ways to host them

How much memory does each app cost a machine, hosted with sitesolide, with
Docker Compose, or in micro-VMs?

This method is committed before the first measurement. The results are published
with their raw data, whatever they say.

## Setups

All three are installed on the same server, on Debian 13, with the same Caddy in
front of every app. While one setup is measured, the other two have every
service stopped, and the machine reboots between setups.

| Setup | How the apps run |
|---|---|
| **sitesolide** | The latest release, installed with `sitesolide setup --minimal`, apps deployed with `sitesolide deploy`. Each app is a systemd unit under its own user, sandboxed by sitesolide. A static site is served by Caddy, with no process. |
| **Docker** | Docker Engine with its defaults. One Compose project per app, the app in one container and its database in another, built from official images. A static site is an nginx container. |
| **Micro-VMs** | The same Compose files and images, run by Kata Containers with Firecracker, through containerd and its devmapper storage, which Firecracker needs: every container in its own micro-VM. |

## Apps

Three apps, 10 copies of each: 30 apps. Each copy has its own name, its own
database and realistic seeded data. An agent writes each app and a usage
scenario for it.

| App | What it is | Stack |
|---|---|---|
| `docs` | an internal documentation site, about 300 pages | Astro, static |
| `wiki` | team pages with editing, history and search | Next.js + SQLite |
| `crm` | contacts, companies, activity timeline, search | Django + PostgreSQL |

## A run

1. **Fresh boot, nothing deployed.** Measure memory for 3 minutes: the setup's
   own cost.
2. **For each app, in the order `docs`, `wiki`, `crm`:**
   1. Deploy its 10 copies.
   2. Run 3 minutes of traffic on every app deployed so far: k6 on the same
      server, about one request per second per app, following the app's
      scenario.
   3. Let it rest for 3 minutes, measuring memory.

One run per setup, about 40 minutes each: about 2 hours of measurement. The
apps, images and scripts are built and tested on the same server beforehand.

## Measures

- **Memory in use.** `MemTotal - MemAvailable`, the median over the rest
  window.
- **Cost per app.** The memory added by each block of 10 apps, divided by 10;
  and for all 30 apps, `(memory with 30 apps - memory with none) / 30`.
- **Where the memory goes.** The memory of every process (its PSS) at the end
  of each rest window.
- **Latency.** p50 and p95 per app, during the traffic.
- **The rest.** Disk used, and the time to deploy the 30 apps.

## Fairness

- **The same settings everywhere.** Every setup runs the same memory caps,
  worker counts, heap sizes and runtime versions.
- **Nobody backs anything up.** Backups are off in every setup.
- **sitesolide pays for its own services.** Its dashboard, portal, analytics
  and monitor stay on, and count against it.
- **The static sites are also set aside.** Without a process on sitesolide,
  they are its easiest win, so the cost per app is also given without `docs`.

## Not measured

- **Isolation strength.** How well each setup contains a hostile app is
  described from how it works, not measured.
- **More than 30 apps.**
- **Scale to zero, workers and scheduled jobs.**

## Machine

One Scaleway Elastic Metal EM-I120E-NVMe in Warsaw: an AMD EPYC 8024P with 8
cores and 16 threads, 64 GB of RAM, NVMe storage, billed by the hour. Micro-VMs
need KVM, which a bare-metal server has natively.

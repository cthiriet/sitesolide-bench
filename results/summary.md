| Setup | Apps | Fixed cost | Per app | Per app, no static | docs | wiki | crm | Disk added |
|---|---|---|---|---|---|---|---|---|
| sitesolide | 30 | 1316 MiB | 99.9 MiB | 142.5 MiB | 14.7 | 100.6 | 184.4 | 6723 MiB |
| docker | 30 | 1021 MiB | 130.0 MiB | 183.4 MiB | 23.1 | 149.4 | 217.5 | 3985 MiB |
| microvm | 30 | 968 MiB | 582.6 MiB | 768.2 MiB | 211.5 | 708.0 | 828.4 | 6206 MiB |

Non-reclaimable memory (anon + shmem + kernel stacks + page tables + unreclaimable slab), per app:

| Setup | Per app | docs | wiki | crm |
|---|---|---|---|---|
| sitesolide | 105.5 MiB | 2.5 | 131.9 | 182.0 |
| docker | 124.0 MiB | 19.3 | 143.9 | 208.7 |
| microvm | 573.9 MiB | 207.0 | 694.1 | 820.6 |

| Setup | Class | Requests | p50 | p95 | Failed | Deploy (median) |
|---|---|---|---|---|---|---|
| sitesolide | crm | 1219 | 12.4 ms | 301.8 ms | 0.00% | 17.9 s |
| sitesolide | docs | 2882 | 1.3 ms | 6.8 ms | 0.00% | 2.2 s |
| sitesolide | wiki | 1241 | 11.4 ms | 68.6 ms | 0.00% | 15.2 s |
| docker | crm | 1181 | 14.2 ms | 302.9 ms | 0.00% | 1.2 s |
| docker | docs | 2891 | 2.5 ms | 8.1 ms | 0.00% | 0.5 s |
| docker | wiki | 1208 | 11.6 ms | 69.1 ms | 0.00% | 1.2 s |
| microvm | crm | 1201 | 16.5 ms | 307.6 ms | 0.00% | 3.3 s |
| microvm | docs | 2954 | 2.6 ms | 7.9 ms | 0.00% | 1.4 s |
| microvm | wiki | 1247 | 13.1 ms | 68.7 ms | 0.00% | 2.4 s |

| Setup | Apps | apps | per-app runtime | platform | system |
|---|---|---|---|---|---|
| sitesolide | 0 | 0 | 0 | 115 | 116 |
| sitesolide | 10 | 0 | 0 | 132 | 119 |
| sitesolide | 20 | 1318 | 0 | 133 | 123 |
| sitesolide | 30 | 3121 | 0 | 137 | 119 |
| docker | 0 | 0 | 0 | 209 | 129 |
| docker | 10 | 35 | 88 | 282 | 132 |
| docker | 20 | 1340 | 155 | 352 | 135 |
| docker | 30 | 3148 | 294 | 415 | 136 |
| microvm | 0 | 0 | 0 | 106 | 131 |
| microvm | 10 | 1764 | 155 | 125 | 267 |
| microvm | 20 | 8381 | 276 | 135 | 383 |
| microvm | 30 | 16006 | 536 | 135 | 606 |

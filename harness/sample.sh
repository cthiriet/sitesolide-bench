#!/bin/bash
# Samples the machine every 5 seconds until killed: memory in use, its
# non-reclaimable part, memory pressure and CPU time. One CSV line per sample.
# Usage: sample.sh <output.csv>
set -euo pipefail
out=$1
echo "epoch,mem_total_kb,mem_available_kb,anon_kb,shmem_kb,kernel_stack_kb,page_tables_kb,sunreclaim_kb,cached_kb,psi_mem_some_avg10,cpu_total_jiffies,cpu_idle_jiffies" > "$out"
while true; do
  m=$(awk '/^(MemTotal|MemAvailable|AnonPages|Shmem|KernelStack|PageTables|SUnreclaim|Cached):/ {v[$1]=$2}
    END {printf "%s,%s,%s,%s,%s,%s,%s,%s", v["MemTotal:"], v["MemAvailable:"], v["AnonPages:"], v["Shmem:"], v["KernelStack:"], v["PageTables:"], v["SUnreclaim:"], v["Cached:"]}' /proc/meminfo)
  psi=$(awk '/^some/ {split($2, a, "="); print a[2]}' /proc/pressure/memory)
  cpu=$(awk '/^cpu / {t=0; for (i=2; i<=NF; i++) t+=$i; print t "," ($5+$6)}' /proc/stat)
  echo "$(date +%s),$m,$psi,$cpu" >> "$out"
  sleep 5
done

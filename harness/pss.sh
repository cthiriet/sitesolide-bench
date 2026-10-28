#!/bin/bash
# Snapshots the proportional memory (PSS) of every process with its control
# group, so the write-up can say where the memory goes. PSS splits a shared
# page between the processes that map it, so the column sums to the memory
# the processes really take.
# Usage: pss.sh <output.csv>
set -uo pipefail
out=$1
echo "pid,comm,cgroup,pss_kb,rss_kb" > "$out"
for d in /proc/[0-9]*; do
  pid=${d#/proc/}
  pss=$(awk '/^Pss:/ {print $2}' "$d/smaps_rollup" 2>/dev/null) || continue
  rss=$(awk '/^Rss:/ {print $2}' "$d/smaps_rollup" 2>/dev/null) || continue
  [ -n "$pss" ] || continue
  comm=$(tr -d ',' < "$d/comm" 2>/dev/null)
  cg=$(cut -d: -f3 "$d/cgroup" 2>/dev/null | head -1)
  echo "$pid,$comm,$cg,$pss,$rss" >> "$out"
done

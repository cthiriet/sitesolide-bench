#!/bin/bash
# One measured run of a setup, from a fresh boot with only its services
# enabled (switch.sh): the setup's own cost with no app at all, then for each
# app its copies deployed, a traffic window on every app deployed so far, and
# a rest window with no traffic. Memory is sampled all along; the memory of
# every process is snapshotted at the end of each rest window.
# Usage: run.sh sitesolide|docker|microvm   (COPIES=10 WINDOW=180 by default)
set -euo pipefail
setup=$1
copies=${COPIES:-10}
window=${WINDOW:-180}
zone=${BENCH_ZONE:?set BENCH_ZONE to the zone the apps are served on}
root=/root/bench
[ "$(cat "$root/.setup" 2>/dev/null)" = "$setup" ] || { echo "run switch.sh $setup first" >&2; exit 2; }
out=$root/results/$setup/$(date -u +%Y%m%d-%H%M%S)
mkdir -p "$out"
cd "$root"

phase() { echo "$1,$2,$(date +%s)" >> "$out/phases.csv"; }
echo "phase,apps,epoch" > "$out/phases.csv"
{
  echo "setup: $setup, copies: $copies, window: ${window}s"
  echo "kernel: $(uname -r)"
  lscpu | grep "Model name"
  free -b | sed -n 2p
  echo "uptime: $(cut -d' ' -f1 /proc/uptime) s"
  systemctl list-units --type=service --state=running --no-legend | awk '{print $1}' | tr '\n' ' '
  echo
} > "$out/machine.txt"

harness/sample.sh "$out/memory.csv" &
sampler=$!
trap 'kill $sampler 2>/dev/null' EXIT

# Rest after the boot: two minutes of uptime and a quiet processor, five
# minutes at most.
for _ in $(seq 1 60); do
  up=$(cut -d. -f1 /proc/uptime)
  load=$(cut -d' ' -f1 /proc/loadavg)
  if [ "$up" -ge 120 ] && awk -v l="$load" 'BEGIN { exit !(l < 0.5) }'; then break; fi
  sleep 5
done

health() {
  local slug=$1 code
  for _ in $(seq 1 360); do
    code=$(curl -s -o /dev/null -w '%{http_code}' -k --max-time 5 --resolve "$slug.$zone:443:127.0.0.1" "https://$slug.$zone/health" || true)
    [ "$code" = 200 ] && return 0
    sleep 0.5
  done
  echo "$slug: /health answers $code after 3 minutes" >&2
  return 1
}

n=0
phase rest-start 0
sleep "$window"
phase rest-end 0
harness/pss.sh "$out/pss-0.csv"
df -B1 --output=used / | tail -1 > "$out/disk-0.txt"

apps=()
for cls in docs wiki crm; do
  phase deploy-start "$n"
  for i in $(seq 1 "$copies"); do
    if [ "$setup" = sitesolide ]; then
      setups/sitesolide/deploy.sh "$cls" "$i" >> "$out/deploy.txt"
    else
      setups/docker/deploy.sh "$setup" "$cls" "$i" >> "$out/deploy.txt"
    fi
    n=$((n + 1))
    apps+=("{\"slug\": \"$(printf '%s-%02d' "$cls" "$i")\", \"cls\": \"$cls\"}")
  done
  phase deploy-end "$n"
  for i in $(seq 1 "$copies"); do health "$(printf '%s-%02d' "$cls" "$i")"; done
  phase ready "$n"
  (IFS=,; echo "[${apps[*]}]") > "$out/apps-$n.json"
  phase traffic-start "$n"
  k6 run -q -e APPS_FILE="$out/apps-$n.json" -e ZONE="$zone" -e DURATION="${window}s" \
    --summary-export "$out/k6-$n.json" --out csv="$out/k6-$n.csv.gz" harness/traffic.js > "$out/k6-$n.log" 2>&1 || true
  phase traffic-end "$n"
  phase rest-start "$n"
  sleep "$window"
  phase rest-end "$n"
  harness/pss.sh "$out/pss-$n.csv"
done
df -B1 --output=used / | tail -1 > "$out/disk-$n.txt"
echo "$out"

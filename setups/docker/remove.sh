#!/bin/bash
# Removes a copy deployed by deploy.sh: its containers or VMs, its volumes,
# its Caddy block.
# Usage: remove.sh docker|microvm <slug>
set -euo pipefail
setup=$1
slug=$2
here=$(dirname "$(realpath "$0")")
cls=${slug%-*}
case $setup in
  docker) export RUNTIME=runc; compose=(docker compose) ;;
  microvm) export RUNTIME=io.containerd.kata.v2; compose=(nerdctl --snapshotter devmapper compose); here=/root/bench/setups/microvm ;;
esac
export SLUG=$slug PORT=0 ZONE=${BENCH_ZONE:?set BENCH_ZONE to the zone the apps are served on}
"${compose[@]}" -p "$slug" -f "$here/$cls.yml" down -v > "/root/bench/logs/remove-$setup-$slug.log" 2>&1
rm -f "/etc/bench-caddy/sites/$slug.caddy"
systemctl reload bench-caddy 2>/dev/null || true

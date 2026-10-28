#!/bin/bash
# Leaves only one setup's services enabled, then reboots, so that each setup
# is measured from a fresh boot with nothing of the other two running.
# Usage: switch.sh sitesolide|docker|microvm
set -euo pipefail
sitesolide=(caddy.service dashboard.service portal.service sitesolide-api.service sitesolide-steward.service
  sitesolide-portal-relay.socket sitesolide-collector.timer sitesolide-monitor.timer)
docker=(docker.socket docker.service)
containerd=(containerd.service)
bench_caddy=(bench-caddy.service)

case "${1:-}" in
  sitesolide) on=("${sitesolide[@]}"); off=("${docker[@]}" "${containerd[@]}" "${bench_caddy[@]}") ;;
  docker) on=("${docker[@]}" "${containerd[@]}" "${bench_caddy[@]}"); off=("${sitesolide[@]}") ;;
  microvm) on=("${containerd[@]}" "${bench_caddy[@]}"); off=("${sitesolide[@]}" "${docker[@]}") ;;
  *) echo "usage: switch.sh sitesolide|docker|microvm" >&2; exit 2 ;;
esac

systemctl disable -q "${off[@]}"
systemctl enable -q "${on[@]}"
echo "$1" > /root/bench/.setup
echo "enabled: ${on[*]}"
echo "rebooting"
systemctl reboot

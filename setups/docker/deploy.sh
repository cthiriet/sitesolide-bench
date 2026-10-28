#!/bin/bash
# Deploys copy <n> of an app as its own Compose project, under Docker (runc)
# or as micro-VMs (nerdctl, Kata Containers with Firecracker), then puts its
# block in the benchmark's Caddy and waits for its root to answer 200. Prints
# the seconds from the first command to that 200.
# Usage: deploy.sh docker|microvm docs|wiki|crm <n>
set -euo pipefail
setup=$1
cls=$2
n=$3
slug=$(printf '%s-%02d' "$cls" "$n")
here=$(dirname "$(realpath "$0")")
zone=${BENCH_ZONE:?set BENCH_ZONE to the zone the apps are served on}
case $cls in
  docs) port=$((4000 + n)) ;;
  wiki) port=$((4020 + n)) ;;
  crm) port=$((4040 + n)) ;;
  *) echo "usage: deploy.sh docker|microvm docs|wiki|crm <n>" >&2; exit 2 ;;
esac
case $setup in
  docker) export RUNTIME=runc; compose=(docker compose) ;;
  microvm) export RUNTIME=io.containerd.kata.v2; compose=(nerdctl --snapshotter devmapper compose); here=/root/bench/setups/microvm ;;
  *) echo "usage: deploy.sh docker|microvm docs|wiki|crm <n>" >&2; exit 2 ;;
esac
export SLUG=$slug PORT=$port ZONE=$zone

start=$(date +%s.%N)
"${compose[@]}" -p "$slug" -f "$here/$cls.yml" up -d > "/root/bench/logs/deploy-$setup-$slug.log" 2>&1
cat > "/etc/bench-caddy/sites/$slug.caddy" <<BLOCK
$slug.$zone {
	tls internal
	header X-Robots-Tag "noindex, nofollow"
	request_header -X-Sitesolide*
	request_header -X_sitesolide*
	import commun
	reverse_proxy 127.0.0.1:$port {
		header_up X-Forwarded-For {client_ip}
	}
}
BLOCK
systemctl reload bench-caddy
for _ in $(seq 1 120); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -k --max-time 5 --resolve "$slug.$zone:443:127.0.0.1" "https://$slug.$zone/" || true)
  [ "$code" = 200 ] && break
  sleep 0.5
done
end=$(date +%s.%N)
[ "$code" = 200 ] || { echo "$slug: / answers $code after 60 s" >&2; exit 1; }
echo "$slug $(echo "$end - $start" | bc)"

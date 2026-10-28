#!/bin/bash
# Removes every copy a run deployed, so that the next setup starts empty.
# Usage: teardown.sh sitesolide|docker|microvm   (COPIES=10 by default)
set -uo pipefail
setup=$1
copies=${COPIES:-10}
cd /root/bench
for cls in docs wiki crm; do
  for i in $(seq 1 "$copies"); do
    slug=$(printf '%s-%02d' "$cls" "$i")
    if [ "$setup" = sitesolide ]; then
      [ -d "/home/deploy/bench-deploy/$slug" ] && setups/sitesolide/remove.sh "$slug"
    else
      setups/docker/remove.sh "$setup" "$slug"
    fi
  done
done
echo "removed"

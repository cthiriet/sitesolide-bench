#!/bin/bash
# Removes a copy deployed by deploy.sh: its unit, its Caddy block, its data.
# Usage: remove.sh <slug>
set -euo pipefail
slug=$1
dir=/home/deploy/bench-deploy/$slug
cd "$dir"
sudo -u deploy -H env SITESOLIDE_CONFIG_DIR=/home/deploy/.config/sitesolide-bench sitesolide remove --confirm "$slug" > "/root/bench/logs/remove-$slug.log" 2>&1
rm -rf "$dir"

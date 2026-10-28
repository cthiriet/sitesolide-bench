#!/bin/bash
# Deploys copy <n> of an app with sitesolide, from the deploy account, the way
# a user of the product deploys: a project folder with its sitesolide.json,
# then `sitesolide deploy`. The apps are built once beforehand (build.sh), and
# every copy ships the same artifacts.
# Usage: deploy.sh docs|wiki|crm <n>
set -euo pipefail
cls=$1
n=$2
slug=$(printf '%s-%02d' "$cls" "$n")
src=/root/bench/apps/$cls
dir=/home/deploy/bench-deploy/$slug
here=$(dirname "$(realpath "$0")")

rm -rf "$dir"
mkdir -p "$dir"
case $cls in
  docs)
    rsync -a "$src/dist/" "$dir/dist/"
    printf '{\n  "slug": "%s",\n  "publicDir": "dist"\n}\n' "$slug" > "$dir/sitesolide.json"
    ;;
  wiki)
    port=$((3059 + n))
    rsync -a --exclude /node_modules --exclude /.next/cache --exclude /data "$src/" "$dir/"
    printf '{\n  "slug": "%s",\n  "start": "/bin/sh /srv/sites/%s/app/run.sh",\n  "port": %d,\n  "memory": "512M"\n}\n' \
      "$slug" "$slug" "$port" > "$dir/sitesolide.json"
    ;;
  crm)
    web=$((3039 + n))
    db=$((3049 + n))
    rsync -a --exclude /.venv --exclude /staticfiles --exclude __pycache__ "$src/" "$dir/"
    cp "$here/postgres.sh" "$here/postgres-backup.sh" "$dir/"
    sed -e "s/SLUG/$slug/g" -e "s/WEB_PORT/$web/" -e "s/DB_PORT/$db/g" "$here/crm.json" > "$dir/sitesolide.json"
    ;;
  *) echo "usage: deploy.sh docs|wiki|crm <n>" >&2; exit 2 ;;
esac
chown -R deploy:deploy /home/deploy/bench-deploy

as_deploy() { (cd "$dir" && sudo -u deploy -H env SITESOLIDE_CONFIG_DIR=/home/deploy/.config/sitesolide-bench "$@"); }
start=$(date +%s.%N)
if [ "$cls" = crm ]; then
  as_deploy sitesolide secrets generate POSTGRES_PASSWORD > /dev/null
fi
as_deploy sitesolide deploy > "/root/bench/logs/deploy-$slug.log" 2>&1
end=$(date +%s.%N)
echo "$slug $(echo "$end - $start" | bc)"

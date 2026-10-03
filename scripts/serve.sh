#!/bin/sh
# ビルドしたサイトを http://127.0.0.1:<port>/ で配信し、応答するまで待つ。
# 見た目の比較(visual.yml)とアクセシビリティの検査(a11y.yml)で、Playwright に開かせるのに使う:
#   scripts/serve.sh dist 4321
#   BASE_URL=http://127.0.0.1:4321 bunx playwright test tests/a11y.spec.ts
# サーバーは裏で動かしたままにする(CI ではジョブの終わりに消える。手元では表示される PID で止める)
set -eu
dir=$1
port=$2
(cd "$dir" && exec python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1) &
echo "serving $dir at http://127.0.0.1:$port/ (pid $!)"
until curl -s -o /dev/null "http://127.0.0.1:$port/"; do sleep 1; done

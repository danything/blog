# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2-slim@sha256:cb3bbbb08e13a4a2ff400f24c7a2a1d5efa83f6ef8544d52d95a519631e2fc61 AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun i --frozen-lockfile

COPY . .
# GitHub カードの情報をビルド時に api.github.com から取る。CI からは回数制限を緩めるために
# トークンを secret で渡す(イメージには残らない)。無くてもビルドはできる
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN bun run build

FROM caddy:2-alpine@sha256:881bbc60f9986d5ab8e7cfd6cf7e4ef3c9c0439fef2429d035d065577882f028
# root で動かさない。ファイルは root のもののまま(読むだけ)。
# - 公式イメージの caddy には 80 番で待つための cap_net_bind_service がファイルに付いていて、
#   capabilities をすべて落とす (k8s の drop: [ALL] と allowPrivilegeEscalation: false) と
#   exec が operation not permitted で失敗する。8080 で待つので外す
# - Caddy が書くのは XDG_DATA_HOME (/data) の instance.uuid などだけ。k8s ではここに emptyDir を
#   付けてルートを読み取り専用にする
# setcap で caddy (約 50MB) が丸ごと新しいレイヤーになるので、毎回変わる dist より前に置いて
# キャッシュを効かせる (ベースイメージが変わらない限り、デプロイで取り直すのは dist のレイヤーだけ)
RUN setcap -r /usr/bin/caddy && chown 65532:65532 /data /config
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /usr/src/app/dist /srv
USER 65532:65532
EXPOSE 8080
# 死活の確認は k8s のプローブ (deploy/deployment.yaml) でする

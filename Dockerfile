# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e
FROM oven/bun:1.4.3-slim@sha256:14a223fa35747ec728bce300ef85888bc5f7958164d15bbba6a54b22b52a3288 AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun i --frozen-lockfile

COPY . .
# GitHub カードの情報をビルド時に api.github.com から取る。CI からは回数制限を緩めるために
# トークンを secret で渡す(イメージには残らない)。無くてもビルドはできる
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN bun run build

# 公式イメージの caddy には 80 番で待つための cap_net_bind_service がファイルに付いていて、
# capabilities をすべて落とす (k8s の drop: [ALL] と allowPrivilegeEscalation: false) と
# exec が operation not permitted で失敗する。8080 で待つのでここで外し、本体だけを取り出す。
# (公式イメージの上で setcap すると約 50MB の本体がもう 1 層増えてイメージが倍近くになるため)
FROM caddy:2-alpine@sha256:24ec7b05bc532c7bb57f727030c5056e257ff7138b4b50460306819ff79362bd AS caddy
RUN setcap -r /usr/bin/caddy

# 配信用は素の Alpine に Caddy 本体と MIME の定義だけを置く(preStop の sleep は busybox のもの)。
# root で動かさない。ファイルは root のもののまま(読むだけ)。Caddy が書くのは XDG_DATA_HOME (/data) の
# instance.uuid などだけで、k8s ではここに emptyDir を付けてルートを読み取り専用にする
FROM alpine:3.24@sha256:71e9b7bae160ba167fa17414401b94cbcdaf3c32feeab9298bd794a2a0614c35
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=caddy /etc/mime.types /etc/mime.types
ENV XDG_CONFIG_HOME=/config XDG_DATA_HOME=/data
RUN mkdir -p /config /data && chown 65532:65532 /config /data
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /usr/src/app/dist /srv
WORKDIR /srv
USER 65532:65532
EXPOSE 8080
# 死活の確認は k8s のプローブ (deploy/deployment.yaml) でする
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

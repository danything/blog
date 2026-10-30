# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e
FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS builder
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
FROM caddy:2-alpine@sha256:e70b164da81ef698b3ad19af799ea6086ce6d9e48ed4079eb9fe26f6fbf14ee5 AS caddy
# 配信用のイメージにはシェルが無いので、Caddy が使うディレクトリもここで作っておく
RUN setcap -r /usr/bin/caddy && mkdir -p /xdg/config /xdg/data

# 配信用はシェルもパッケージマネージャも無い distroless に、Caddy 本体 (静的リンク) と MIME の定義だけを置く。
# nonroot の版は uid 65532 で動く。ファイルは root のもののまま(読むだけ)。Caddy が書くのは XDG_DATA_HOME (/data) の
# instance.uuid などだけで、k8s ではここに emptyDir を付けてルートを読み取り専用にする
FROM gcr.io/distroless/static-debian13:nonroot@sha256:18f4cc26c9ffa7f20a359298be7deadac5c607c8e03a02b8119f1a5fc2f82c99
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=caddy /etc/mime.types /etc/mime.types
ENV XDG_CONFIG_HOME=/config XDG_DATA_HOME=/data
COPY --from=caddy --chown=65532:65532 /xdg/ /
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /usr/src/app/dist /srv
WORKDIR /srv
USER 65532:65532
EXPOSE 8080
# 死活の確認は k8s のプローブ (deploy/deployment.yaml) でする
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

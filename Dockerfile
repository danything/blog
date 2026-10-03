# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2-slim AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun i --frozen-lockfile

COPY . .
# GitHub カードの情報をビルド時に api.github.com から取る。CI からは回数制限を緩めるために
# トークンを secret で渡す(イメージには残らない)。無くてもビルドはできる
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN bun run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /usr/src/app/dist /srv
EXPOSE 80

HEALTHCHECK CMD wget -q --spider http://localhost/ || exit 1

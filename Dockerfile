FROM oven/bun:1.4.2-slim AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun i --frozen-lockfile

COPY . .
RUN bun run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /usr/src/app/dist /srv
EXPOSE 80

HEALTHCHECK CMD wget -q --spider http://localhost/ || exit 1

FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}
RUN NODE_OPTIONS="--max-old-space-size=2560" bun --bun run build

FROM oven/bun:1 AS production
WORKDIR /app

COPY --from=build /app/.output /app
COPY --from=build /app/public /app/public

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "--bun", "run", "/app/server/index.mjs" ]

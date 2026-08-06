FROM oven/bun:1 as base

ARG PORT=3000
ENV NODE_ENV=production

WORKDIR /src

# Build
FROM base as build

COPY --link package.json bun.lock ./
RUN bun install

COPY --link . .

RUN bun run build

# Run
FROM base

RUN bun add -g serve

COPY --from=build /src/.output ./.output

EXPOSE $PORT
CMD [ "node", ".output/server/index.mjs" ]

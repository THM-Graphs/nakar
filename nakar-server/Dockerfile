FROM node:22 AS builder
WORKDIR /app

COPY nakar-server/package.json nakar-server/package-lock.json ./
RUN npm install

COPY nakar-server/config ./config
COPY nakar-server/database ./database
COPY nakar-server/public ./public
COPY nakar-server/src ./src
COPY nakar-server/test ./test
COPY nakar-server/types ./types
COPY nakar-server/babel.config.js ./
COPY nakar-server/eslint.config.mjs ./
COPY nakar-server/tsconfig.configs.json ./
COPY nakar-server/tsconfig.json ./
COPY nakar-server/openapi.yaml ./

RUN npm run build:gen && npm run build

FROM node:22
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./
COPY nakar-server/public ./public
COPY nakar-server/favicon.ico nakar-server/package.json nakar-server/package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 80

HEALTHCHECK \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD curl -f http://localhost/_health || exit 1

CMD ["npm", "start"]

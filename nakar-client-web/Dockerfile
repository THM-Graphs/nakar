FROM node:24 AS builder
WORKDIR /app

COPY packages ./packages
RUN cd packages/api-client && npm ci && npm run build:ts

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY public ./public
RUN echo "VERSION=$(npm run version --silent)" > ./public/.env
COPY src ./src
COPY index.html ./
COPY tsconfig.app.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
RUN npm run build

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY docker/100-create-env-file.sh /docker-entrypoint.d
COPY docker/default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x /docker-entrypoint.d/100-create-env-file.sh

HEALTHCHECK \
    --interval=10m \
    --timeout=5s \
    --start-period=60s \
    --start-interval=5s \
    CMD wget -O - -S http://127.0.0.1:80/

EXPOSE 80

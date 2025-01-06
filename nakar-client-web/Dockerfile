FROM node:22 AS builder
WORKDIR /app/nakar-server
COPY ../nakar-server/openapi.yaml ./

WORKDIR /app/nakar-client-web
COPY nakar-client-web/public ./public
COPY nakar-client-web/src ./src
COPY nakar-client-web/index.html ./
COPY nakar-client-web/package.json ./
COPY nakar-client-web/package-lock.json ./
COPY nakar-client-web/tsconfig.app.json ./
COPY nakar-client-web/tsconfig.json ./
COPY nakar-client-web/tsconfig.node.json ./
COPY nakar-client-web/vite.config.ts ./
RUN echo "VERSION=$(npm run version --silent)" > ./public/.env
RUN npm install && npm run build:gen && npm run build

FROM nginx:1.27

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/nakar-client-web/dist ./
COPY nakar-client-web/docker/100-create-env-file.sh /docker-entrypoint.d
COPY nakar-client-web/docker/default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x /docker-entrypoint.d/100-create-env-file.sh

EXPOSE 80

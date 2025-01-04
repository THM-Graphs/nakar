FROM node:22 AS builder
WORKDIR /app

COPY public ./public
COPY src ./src

COPY index.html ./
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.app.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY openapi-gen.yaml ./

RUN npm install && npm run build:gen && npm run build

FROM nginx:1.27

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./
COPY ./docker/100-create-env-file.sh /docker-entrypoint.d
COPY ./docker/default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x /docker-entrypoint.d/100-create-env-file.sh

EXPOSE 80

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

RUN npm install && npm run build

FROM nginx:1.27

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./

EXPOSE 80

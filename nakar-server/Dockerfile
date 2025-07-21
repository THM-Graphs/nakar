FROM node:22 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY config ./config
COPY database ./database
COPY public/robots.txt ./public/robots.txt
COPY src ./src
COPY src-gen ./src-gen
COPY types ./types
COPY babel.config.js ./
COPY tsconfig.json ./

RUN npm run build

FROM node:22
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./
COPY public/robots.txt ./public/robots.txt
COPY favicon.ico package.json package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 80
EXPOSE 81

HEALTHCHECK \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD curl -f http://localhost/_health || exit 1

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]

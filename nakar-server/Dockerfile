FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY config ./config
COPY database ./database
COPY src ./src
COPY types ./types
COPY babel.config.js ./
COPY tsconfig.json ./

RUN NODE_ENV=production npm run build

FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public/robots.txt ./public/robots.txt
COPY favicon.ico ./
# Unpack dist folder so strapi will find src dir to run
COPY --from=builder /app/dist ./

EXPOSE 80
EXPOSE 81

HEALTHCHECK \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD wget -O - -S http://127.0.0.1:80/_health

ENV NODE_ENV=production

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]

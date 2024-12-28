FROM node:22 AS builder
WORKDIR /app

COPY config ./config
COPY database ./database
COPY public ./public
COPY src ./src
COPY test ./test
COPY types ./types
COPY babel.config.js ./
COPY eslint.config.mjs ./
COPY favicon.png ./
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.configs.json ./
COPY tsconfig.json ./

RUN npm install && npm run build


FROM node:22
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./
COPY package.json package-lock.json ./
RUN npm ci --production
EXPOSE 1337

CMD ["npm", "start"]

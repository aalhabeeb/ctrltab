# ctrlTAB API — multi-stage build.
#
# De builder-stage heeft python3/make/g++ aan boord. Voor better-sqlite3 en bcrypt
# bestaan prebuilt binaries voor de gangbare Node-ABI's; bestaat die voor de
# gekozen Node-versie niet, dan compileert het hier gewoon. Dat is precies wat er
# misging in de oude Kubernetes-uitrol: die draaide `npm install` bij elke
# pod-start in een kale node-image zonder compiler, en klapte zodra de node-major
# omhoog ging (Renovate-PR #287, ~21 uur downtime).
#
# De runtime-stage blijft kaal: alleen node_modules en de applicatiecode.

FROM node:24-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Rookproef tijdens de build. npm kan install-scripts overslaan (npm 12 doet dat
# standaard) en dan ontbreekt de .node-binary zonder dat npm zelf faalt. Liever
# hier stuk dan pas bij de eerste request in productie.
RUN node -e "const D=require('better-sqlite3'); const db=new D(':memory:'); db.exec('create table t(a)'); db.prepare('insert into t values (?)').run(1); require('bcrypt'); console.log('native modules OK op ' + process.version);"

FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    DB_PATH=/app/data/ctrltab.db

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json server.js ./
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.js"]

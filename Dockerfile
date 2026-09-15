# ctrlTAB — één image met API én frontend.
#
# Upstream splitste dit in twee containers: Node voor de API en nginx voor de
# statische frontend plus een /api/-proxy. Dat betekende twee images, twee
# Deployments en een ConfigMap met een aangepaste nginx-config. Express serveert
# de frontend nu zelf (zie het Frontend-blok in api/server.js), dus dat is er
# allemaal niet meer.
#
# De builder-stage heeft python3/make/g++ aan boord. Voor better-sqlite3 en bcrypt
# bestaan prebuilt binaries voor de gangbare Node-ABI's; bestaat die voor de
# gekozen Node-versie niet, dan compileert het hier gewoon. Dat is precies wat er
# misging in de oude Kubernetes-uitrol: die draaide `npm install` bij elke
# pod-start in een kale node-image zonder compiler, en klapte zodra de node-major
# omhoog ging (Renovate-PR #287, ~21 uur downtime).

FROM node:24-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

# Rookproef tijdens de build. npm kan install-scripts overslaan (npm 12 doet dat
# standaard) en dan ontbreekt de .node-binary zonder dat npm zelf faalt. Liever
# hier stuk dan pas bij de eerste request in productie.
RUN node -e "const D=require('better-sqlite3'); const db=new D(':memory:'); db.exec('create table t(a)'); db.prepare('insert into t values (?)').run(1); require('bcrypt'); console.log('native modules OK op ' + process.version);"

FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    DB_PATH=/app/data/ctrltab.db \
    PUBLIC_DIR=/app/public

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY api/package.json api/package-lock.json api/server.js ./
COPY web/html/ ./public/
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.js"]

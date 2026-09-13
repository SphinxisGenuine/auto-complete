FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# stage 2
# ---- Stage 2: run ----
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional
COPY --from=builder /app/dist ./dist
COPY src/db/migration ./dist/db/migration
COPY data ./data
CMD ["node", "dist/index.js"]


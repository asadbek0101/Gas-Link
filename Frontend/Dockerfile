# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Fresh install without lock file — ensures correct Linux binaries
RUN npm install --no-package-lock

# Copy source
COPY . .

# Build
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

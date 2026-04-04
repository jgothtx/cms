# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
ENV NODE_ENV=development
RUN npm config set strict-ssl false && npm config set registry http://registry.npmjs.org/
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN ./node_modules/.bin/vite build

# --- Stage 2: Build backend ---
FROM node:20-alpine AS backend-build
RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
ENV NODE_ENV=development
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false && npm config set registry http://registry.npmjs.org/
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN ./node_modules/.bin/tsc

# --- Stage 3: Production image ---
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false && npm config set registry http://registry.npmjs.org/

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev && apk del python3 make g++

# Copy compiled backend
COPY --from=backend-build /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN mkdir -p backend/uploads data

# Clear TLS override for runtime
ENV NODE_TLS_REJECT_UNAUTHORIZED=
ENV DB_PATH=/app/data/contracts.db
ENV FRONTEND_DIST=/app/frontend/dist
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]

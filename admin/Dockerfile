# Multi-stage build for React Admin
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install
COPY package*.json ./
# Use npm install to avoid failing when package-lock.json is absent
RUN npm install --no-audit --no-fund --prefer-offline --silent

# Copy source and build
COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Use custom nginx config (adds SPA fallback) and copy build output
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

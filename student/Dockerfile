# Multi-stage build for React production deployment
# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install to tolerate missing lockfile)
RUN npm install --no-audit --no-fund --prefer-offline --silent

# Copy source code
COPY . .

# Build arguments for environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ARG PUBLIC_URL
ENV PUBLIC_URL=${PUBLIC_URL}

# Build the React app for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Use custom nginx config (adds SPA fallback) and copy build output
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

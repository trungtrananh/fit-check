# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set default PORT for Cloud Run
ENV PORT=8080

# Start the server
CMD ["node", "server/index.js"]


FROM node:18-alpine

# Install WebP tools for optimal performance
RUN apk add --no-cache libwebp-tools

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Create data directory for volume mounting
RUN mkdir -p /data

# Default to processing /data directory
WORKDIR /data

# Run the CLI tool by default
ENTRYPOINT ["node", "/app/dist/cli.js"]
CMD ["--src", "/data"]
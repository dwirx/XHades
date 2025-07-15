FROM node:current-alpine3.22

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-workspace.yaml ./

# Copy client and server directories
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN pnpm install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build client
RUN pnpm --filter client build

# Expose port
EXPOSE 3003

# Start the application
CMD ["pnpm", "start"]

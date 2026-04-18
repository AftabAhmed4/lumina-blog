# Use a modern Node image that supports experimental TypeScript stripping
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the Vite application
RUN npm run build

# --- Runtime Stage ---
FROM node:22-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the server entry point and other required local files
COPY server.ts ./
COPY firebase-applet-config.json ./
# Note: uploads folder will be transient in Cloud Run
RUN mkdir -p uploads

# Cloud Run injects the PORT environment variable; our server.ts is already updated to use it.
# We expose port 8080 as a convention for Cloud Run, though the app listens on process.env.PORT.
EXPOSE 8080

# Use node with experimental type stripping to run server.ts directly
CMD ["node", "--experimental-strip-types", "server.ts"]

FROM node:20-alpine

# Install FFmpeg and other dependencies
RUN apk add --no-cache ffmpeg openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy worker source code
COPY index.js ./

# Run worker
CMD ["node", "index.js"]
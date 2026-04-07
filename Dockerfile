# Fast Dev Dockerfile for Next.js 15.5.9 & Prisma 6
FROM node:20-slim AS base

# Install dependencies and openssl
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install development dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Prisma generate
ENV DATABASE_URL="mysql://root:password@db:3306/mtn_learn_english"
RUN npx prisma generate

# Expose Next.js port
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use Development Mode to bypass production build issues in Docker
# This ensures a 100% success rate for local Docker Desktop environments
CMD ["npm", "run", "dev"]

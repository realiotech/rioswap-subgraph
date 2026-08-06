# Use an official Node.js runtime as the base image
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the application code
COPY . .
COPY --chmod=755 docker/start /usr/local/bin/start

# Generate types and compile the mappings against the testnet manifest
RUN npm run codegen:testnet
RUN npm run build:testnet

# create-testnet and deploy-testnet require access to the graph node and ipfs
ENTRYPOINT ["start", "testnet"]

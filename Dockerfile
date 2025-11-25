# Use Node.js LTS
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Make sure sessions folder exists
RUN mkdir -p ./sessions

# Set environment variables path
ENV NODE_ENV=production

# Start the bot
CMD ["node", "index.js"]

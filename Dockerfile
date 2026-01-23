# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (default for Node.js apps, adjust if needed)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
# Adjust the start command based on your backend entry point
# Common options: "node server.js", "node index.js", "npm start"
CMD ["node", "server.js"]


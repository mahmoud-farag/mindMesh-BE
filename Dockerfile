FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy the shared directory because package.json depends on it (file:shared/...)
COPY shared ./shared

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Start the application
CMD ["npm", "start"]

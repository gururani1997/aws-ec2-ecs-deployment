# Using official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
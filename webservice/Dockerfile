FROM node AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5500
CMD ["node", "server.js"]
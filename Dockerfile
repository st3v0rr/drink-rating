FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/server.js ./
COPY backend/uploads ./uploads
COPY frontend/build ./public
COPY backend/bin ./bin

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]

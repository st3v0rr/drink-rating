FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/server.js ./
COPY frontend/build ./public

RUN npm install
RUN mkdir uploads

EXPOSE 3000

CMD ["npm", "start"]

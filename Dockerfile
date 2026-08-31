FROM node:18-alpine

WORKDIR /app

COPY . .

EXPOSE 8090

ENV PORT=8090

CMD ["node", "server.js"]

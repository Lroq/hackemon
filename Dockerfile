FROM node:18-alpine

ENV PORT=3000

WORKDIR /app

RUN apk update && apk add --no-cache git

RUN git clone https://github.com/Lroq/Hackengine.git hackengine

WORKDIR /app/hackengine
RUN npm install --production

WORKDIR /app
COPY . .
RUN npm install --production

EXPOSE 3000

CMD sh -c "node server/server.js & npm start"

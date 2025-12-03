FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY . .

EXPOSE 3000

CMD ["npm", "install", "--production"]

CMD ["node", "server.js"]

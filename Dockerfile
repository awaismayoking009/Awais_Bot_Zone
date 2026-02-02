FROM node:lts-buster

RUN apt-get update && \
  apt-get install -y \
  ffmpeg \
  imagemagick \
  webp && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .
RUN npm install
COPY . .
EXPOSE 8000
CMD ["node", "index.js"]

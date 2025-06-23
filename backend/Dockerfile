# --- dev stage ---
FROM node:18-alpine AS dev
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- prod stage ---
FROM node:18-alpine AS prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"] 
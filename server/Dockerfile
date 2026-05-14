FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --silent

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm start"]

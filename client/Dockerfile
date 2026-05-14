# Этап 1: сборка клиента
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --silent

# Копируем исходный код и собираем проект
COPY . .
RUN npm run build

# Этап 2: сервер для статики
FROM nginx:alpine

# Копируем собранные файлы из этапа builder
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем кастомный конфиг nginx (опционально)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

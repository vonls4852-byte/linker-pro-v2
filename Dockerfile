FROM node:20-slim AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Запускаем приложение
CMD ["npm", "start"]
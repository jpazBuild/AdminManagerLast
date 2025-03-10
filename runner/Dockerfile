# 📌 Usa Webtop como base con Ubuntu XFCE
FROM lscr.io/linuxserver/webtop:ubuntu-xfce

# 🏢 Establecer directorio de trabajo
WORKDIR /app

# 🌍 Instalar Node.js, Playwright y dependencias necesarias
RUN apt-get update && \
    apt-get install -y curl wget gpg ca-certificates software-properties-common && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn && \
    apt-get install -y git xvfb dbus-x11 && \
    rm -rf /var/lib/apt/lists/*

# 🎭 Instalar Playwright con todos los navegadores
RUN npm install -g playwright && \
    npx playwright install --with-deps

# 📦 Copiar los archivos del proyecto y sus dependencias
COPY package*.json ./
RUN npm install

# 📂 Copiar el código fuente
COPY . .

# 🚀 Construcción del proyecto
RUN npm run build

# 📡 Exponer puertos para API y Webtop
EXPOSE 3000 4000

# 🖥️ Iniciar Webtop y la API
CMD ["sh", "-c", "npm run dev & /init"]
# ==========================================
# Étape 1 : Construction (Build) avec Node.js
# ==========================================
FROM node:20-alpine as build-stage

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement les fichiers de dépendances en premier 
# (C'est une astuce DevOps pour utiliser le cache de Docker et accélérer les builds)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste du code source
COPY . .

# Compiler l'application (Vite va générer un dossier 'dist' contenant le site statique)
RUN npm run build

# ==========================================
# Étape 2 : Serveur de production avec Nginx
# ==========================================
FROM nginx:alpine as production-stage

# Récupérer UNIQUEMENT le code compilé de l'étape 1 (le dossier 'dist')
# et le placer dans le dossier public de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exposer le port 80 pour le trafic web
EXPOSE 80

# Lancer Nginx en premier plan
CMD ["nginx", "-g", "daemon off;"]
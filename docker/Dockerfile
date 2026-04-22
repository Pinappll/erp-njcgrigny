FROM php:8.3-fpm

# Extensions système
RUN apt-get update && apt-get install -y \
    git curl unzip libpq-dev libzip-dev zip \
    && docker-php-ext-install pdo pdo_pgsql zip

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
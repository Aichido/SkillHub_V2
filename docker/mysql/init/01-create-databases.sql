-- Création des bases de données
CREATE DATABASE IF NOT EXISTS `skillhub_auth`;
CREATE DATABASE IF NOT EXISTS `skillhub_catalog`;
CREATE DATABASE IF NOT EXISTS `skillhub_enrollment`;

-- Autorisations pour ton utilisateur principal
GRANT ALL PRIVILEGES ON `skillhub_auth`.* TO 'skillhub_user'@'%';
GRANT ALL PRIVILEGES ON `skillhub_catalog`.* TO 'skillhub_user'@'%';
GRANT ALL PRIVILEGES ON `skillhub_enrollment`.* TO 'skillhub_user'@'%';
FLUSH PRIVILEGES;
# Luxe Beauty - Site de Réservation pour Salon de Beauté

## Résumé du Projet
Application web de prise de rendez-vous pour prothésiste ongulaire et pose d'extensions de cils, avec dashboard administrateur complet.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Authentification**: JWT

## Personas Utilisateurs

### Cliente
- Femme recherchant des services de beauté (manucure, extensions de cils)
- Souhaite réserver facilement en ligne
- Veut recevoir des confirmations par email

### Administratrice (Prothésiste)
- Gère les rendez-vous
- Configure les services et les prix
- Personnalise le site (couleurs, images, infos)
- Configure les notifications email

## Fonctionnalités Implémentées

### Site Public ✅
- [x] Page d'accueil avec hero section et navigation
- [x] Section services (onglerie + extensions cils)
- [x] Galerie d'images
- [x] Liens réseaux sociaux (Instagram, TikTok)
- [x] Footer avec informations de contact

### Système de Réservation ✅
- [x] Parcours en 4 étapes (Service → Date/Heure → Infos → Confirmation)
- [x] Calendrier interactif avec créneaux disponibles
- [x] Validation des créneaux en temps réel
- [x] Confirmation avec récapitulatif

### Dashboard Admin ✅
- [x] Authentification (inscription/connexion)
- [x] Tableau de bord avec statistiques
- [x] Gestion des rendez-vous (confirmer, annuler, supprimer)
- [x] Gestion des services (CRUD)
- [x] Configuration du site (nom, slogan, contact)
- [x] Configuration des horaires d'ouverture
- [x] Configuration des réseaux sociaux
- [x] Personnalisation des couleurs
- [x] Gestion des images (upload, galerie)
- [x] Configuration SMTP pour emails

### API Backend ✅
- [x] /api/services - Liste des services
- [x] /api/site-settings - Paramètres du site
- [x] /api/available-slots/{date} - Créneaux disponibles
- [x] /api/appointments - Création de rendez-vous
- [x] /api/admin/* - Endpoints admin protégés

## Configuration SMTP (Non testée - nécessite credentials)
L'utilisateur doit configurer:
1. Activer la validation en 2 étapes sur Google
2. Créer un "Mot de passe d'application"
3. Saisir les credentials dans le dashboard admin

## Configuration Google Calendar (Non implémentée)
Nécessite:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- Configuration OAuth dans Google Cloud Console

## Design
- **Thème**: "Soft Luxury" - élégant et féminin
- **Couleurs**: Warm White (#FDFCF8), Obsidian (#1A1A1A), Gold (#D4AF37), Blush (#F5E6E8)
- **Typographie**: Playfair Display (headings) + Manrope (body)

## Backlog (P1/P2)

### P1 - Priorité Haute
- [ ] Intégration Google Calendar complète
- [ ] Envoi d'emails SMTP (test avec credentials réels)
- [ ] Rappels automatiques avant rendez-vous

### P2 - Améliorations
- [ ] Mode hors-ligne PWA
- [ ] Notifications push
- [ ] Multi-langue
- [ ] Système de fidélité
- [ ] Paiement en ligne (acompte)

## Prochaines Actions
1. Configurer les credentials SMTP Gmail
2. Tester l'envoi d'emails
3. Configurer Google Calendar (si souhaité)
4. Ajouter les vraies images du salon
5. Personnaliser les couleurs selon la charte graphique

## Date de Création
6 Mars 2026

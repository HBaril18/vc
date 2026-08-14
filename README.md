# VALORANT • Centre de recrutement collégial - Version HTML/CSS/JS

Application web locale pour gérer le recrutement d'une équipe collégiale de Valorant.

## Comment l'utiliser

1. Ouvre `index.html` dans ton navigateur.
2. Ajoute les candidats dans `Ajouter / Évaluer`.
3. Entre les six notes de tryout de 1 à 5.
4. Consulte le classement et les graphiques.

## Fonctionnalités

- Portail avec KPIs.
- Formulaire candidat.
- Évaluation rapide avec six notes.
- Score pondéré /100.
- Classement automatique.
- Graphique en colonnes du top 10.
- Radar de profil individuel.
- Pondération modifiable.
- Critères par rôle.
- Sauvegarde locale avec localStorage.
- Export CSV du classement.
- Export et import JSON de toutes les données.

## Données

L'application sauvegarde les informations dans le navigateur avec `localStorage`.
Pour transférer les données vers un autre ordinateur, utilise `Exporter JSON`, puis `Importer JSON`.

## Pondération par défaut

- Mécanique : 0.20
- Intelligence de jeu : 0.20
- Utilitaires et rôle : 0.20
- Communication : 0.15
- Mentalité : 0.15
- Adaptabilité / potentiel : 0.10

## Fichiers

- `index.html` : structure de l'application
- `style.css` : design responsive
- `app.js` : logique, sauvegarde, score et graphiques


## Profil PDF

Dans `Ajouter / Évaluer`, sélectionne un candidat puis clique sur `Profil PDF du candidat`. Tu peux aussi utiliser le bouton `PDF` dans le classement. Le navigateur ouvrira la fenêtre d’impression. Choisis `Enregistrer au format PDF`.


## Correction PDF

La génération PDF utilise maintenant l’impression de la page courante au lieu d’ouvrir une nouvelle fenêtre. Cela évite les bloqueurs de popups.


## VOD Review

Nouvelle section pour documenter les analyses individuelles : joueur, date, map, type de VOD, lien vidéo, contexte, forces, erreurs, plan d’action, priorité et coach responsable. Les dernières VOD liées au joueur apparaissent aussi dans son profil PDF.

## Scrims

Nouvelle section pour suivre les pratiques d’équipe : adversaire, map, score, joueurs présents, composition, objectif, constats attaque/défense, communication, actions à faire et note d’équipe. Les scrims où le pseudo du joueur est inscrit dans `Joueurs présents` peuvent aussi apparaître dans son profil PDF.


## Planification pratique

Nouvelle section inspirée d’une planification de cours du secondaire pour créer des séances d’environ 2 heures. Elle contient : titre, date, heure, durée, map, focus, participants, intention pédagogique, objectifs d’apprentissage, critères de réussite, matériel, déroulement minuté, adaptations, évaluation formative, notes coach, statut et impression PDF du plan de séance.

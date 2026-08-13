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
- Génération d’un profil PDF présentable pour chaque joueur, avec toutes les informations, les notes, une recommandation et un court contexte pour un lecteur qui connaît peu Valorant.

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

Dans `Ajouter / Évaluer`, sélectionne un candidat puis clique sur `Profil PDF du candidat`. Tu peux aussi utiliser le bouton `PDF` dans le classement. Le navigateur ouvre une page de rapport prête à imprimer. Choisis ensuite `Enregistrer au format PDF` dans la fenêtre d’impression.

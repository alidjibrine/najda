@AGENTS.md

# Préférences de communication d'Ali

## Toujours rappeler les commandes à exécuter

À la fin de chaque changement de code (modification de fichier, ajout de package, refonte d'écran), Claude doit **toujours** lister à Ali les commandes exactes qu'il doit taper dans son terminal pour voir le résultat.

Format attendu, dans un bloc à part avant le débrief :

> **À exécuter dans ton terminal :**
>
> ```
> npx expo start --clear
> ```
> Puis presse `r` pour reload sur ton iPhone.

Inclure systématiquement :
- La commande d'install si un package a été ajouté (`npx expo install <pkg>`).
- La commande pour relancer Metro (`npx expo start --clear` quand le cache pourrait être périmé, sinon juste `npx expo start`).
- L'instruction pour reload Expo Go (`r` dans le terminal, ou secousse iPhone).
- La commande git si on veut sauvegarder (`git add . && git commit -m "…" && git push`).

Ali est sur Windows + iPhone 17 Pro Max, utilise Expo Go. Ne pas oublier ce contexte quand on lui donne des commandes.

## Tâches

Mettre à jour la liste des tâches au fur et à mesure (TaskCreate / TaskUpdate). Ali aime suivre la progression.

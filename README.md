# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Calendriers

L’onglet **Calendriers** (`app/(tabs)/calendrier.tsx`) intègre le parcours mobile de CalendrierSP : sélection d’une tournée, liste des adresses, enregistrement et modification des passages (vente, refus, absence, à revoir), quantités, montant, moyen de paiement et commentaire.

Le module fonctionne actuellement en **démonstration locale**, avec deux tournées d’exemple. Les compteurs et montants sont calculés à partir des passages saisis. Sur Android/iOS, les passages sont conservés dans le répertoire de documents de l’application via `expo-file-system` ; sur le web, dans le stockage local du navigateur. Les données sont rechargées après fermeture. Les données de démonstration sont stockées séparément des futures données serveur.

Les moyens de paiement proposés sont Espèces, Chèque, CB, DON et Autre. Dans une tournée, **Ajouter une adresse** permet de saisir une voie, une ville et, facultativement, un code postal, un bâtiment, un étage et un appartement. Depuis la saisie d’un passage, **Modifier l’adresse** permet de compléter une adresse existante. Deux appartements d’une même adresse peuvent être enregistrés séparément. Les adresses ajoutées ou modifiées sont sauvegardées avec les passages ; les anciennes sauvegardes sont reprises automatiquement.

Chaque passage possède une **date de passage** obligatoire au format JJ/MM/AAAA, préremplie à la date locale du jour. Elle peut être antérieure pour saisir une visite après coup ; les dates impossibles ou futures sont refusées. Cette date reste distincte de `updatedAt`, qui conserve la date et l’heure réelles de la dernière sauvegarde. Lors de la reprise des anciens passages, leur date est déduite de leur ancien horodatage de sauvegarde et peut ensuite être corrigée.

Une **vente** exige un carnet et un reçu, y compris pour CB ou DON. Trois carnets d’exemple, `2026-001`, `2026-002` et `2026-003`, contiennent chacun 25 reçus, de `00001` à `00025`. Les listes ne proposent que les reçus encore sélectionnables. Le numéro de carnet est unique ; le numéro de reçu est unique au sein de son carnet. Un même numéro à cinq chiffres peut donc exister dans deux carnets différents. Le registre local empêche de réutiliser un reçu dans une autre adresse ou tournée, même après correction ou annulation de la vente. Une vente peut conserver son reçu lorsqu’elle est modifiée. Si celui-ci est remplacé, l’ancien reste consommé.

Le résumé de chaque tournée et le résumé global présentent le nombre de reçus et le montant des ventes par carnet. Les anciennes ventes sans reçu sont conservées et affichées séparément comme étant à compléter ; leur prochaine sauvegarde en vente exige un reçu. Le stockage passe au format 3 avec reprise des formats 1 et 2, en conservant le même fichier et la même clé de stockage. Le registre des reçus reste propre à cet appareil : l’unicité entre plusieurs appareils nécessitera un contrôle transactionnel côté API lors du futur raccordement.

Le backend CalendrierSP ne fournit pas encore les routes métier `/api/mobile/tournees`, `/api/mobile/tournees/{id}/adresses` et `/api/mobile/sync` ni leur authentification. Aucun envoi ni synchronisation ne sont simulés. Le `.env` de `calendriersp/` configure les conteneurs Docker ; il n’est pas chargé par MobileSP. Le futur raccordement de l’API nécessitera une URL Expo publique accessible depuis le terminal, une authentification et le contrat de synchronisation décrit dans `../calendriersp/docs/OFFLINE_SYNC.md`.

Le module réutilise les dépendances Expo 54 de MobileSP et la navigation existante, sans importer une seconde application Expo ni installer les dépendances Expo 53 du starter.

Vérification du stockage et des règles de saisie :

```bash
node --test scripts/test-calendriers.cjs
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

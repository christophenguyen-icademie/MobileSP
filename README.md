# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Calendriers

L’onglet **Calendriers** (`app/(tabs)/calendrier.tsx`) utilise maintenant l’API Symfony de CalendrierSP. Il propose la connexion par identifiant court d’amicale (4 à 20 lettres non accentuées ou chiffres), e-mail et mot de passe, les campagnes et les tournées autorisées pour le compte. Un sapeur ne voit que ses tournées affectées. 

Les adresses, résultats, carnets et reçus proviennent du serveur. Les résultats disponibles sont **Vente, Don, Refus, Absent, À revoir et Non visitée**. Une vente propose Espèces, Chèque, CB ou Autre. Un **Don** est un résultat distinct, avec carnet/reçu et commentaire, sans quantité, montant ni paiement. Les reçus sont sélectionnés par identifiant serveur et leur numéro est unique par amicale, toutes tournées confondues. Un reçu consommé ou annulé ne se réutilise pas ; une correction peut conserver son reçu courant. Les totaux par carnet sont ceux du serveur.

La saisie complète l’adresse avec **bâtiment, étage, appartement et porte** (80 caractères maximum chacun). **Ajouter un appartement** copie la voie, le code postal et la ville, vide les quatre précisions et ouvre un passage indépendant. **＋ Numéro** reprend la rue, le code postal et la ville d’une adresse et demande seulement le nouveau numéro (`12 bis`, `3 ter`, etc.) avant la saisie du passage. Le logement et le reçu sont initialement vides et l’adresse source reste inchangée. **Nouvelle adresse** permet une vente ou visite hors référentiel, avec voie, code postal et ville requis. Dans ces trois cas, l’adresse et le passage sont créés atomiquement : un logement déjà présent ou un reçu consommé bloque toute l’opération. La date de passage JJ/MM/AAAA est conservée côté serveur, distincte de la dernière modification ; les dates impossibles et futures sont refusées.

Les filtres par rue, résultat et carnet se combinent avec la recherche du numéro exact de reçu. Les suffixes de numéro (`12 T`, `14bis`, `18B`) ne créent pas de rues distinctes. Le tri est disponible par adresse, montant ou résultat, dans les deux sens. Pour l’adresse, le tri regroupe d’abord les **rues**, puis compare uniquement la **partie numérique du numéro** dans chaque rue : `2` précède `171`, et `3`, `3t` ou `3 ter` ont la même valeur de tri ; les adresses de même numéro dans une même rue conservent leur ordre d’origine. Les ventes et dons sont verts, les refus rouges, les absences et visites à revoir orange. Une tournée validée reste consultable, avec ses écritures désactivées. Un responsable peut ajouter un carnet (25 reçus par défaut).

L’équipe affichée dans la liste et le détail des tournées utilise le **nom des sapeurs** fourni par l’API. Il se renseigne ou se modifie dans la rubrique **Sapeurs** du front CalendrierSP, par un administrateur. Les comptes anciens sans nom restent identifiables par leur e-mail jusqu’à leur mise à jour ; l’identifiant de connexion reste l’e-mail.

Le bouton **Afficher les filtres et le tri** développe la recherche par rue, résultat, carnet et reçu ainsi que les options de tri, masquées par défaut. Les replier conserve les sélections et affiche le nombre de filtres actifs. Les actions d’une adresse utilisent des boutons courts, **Saisir / Modifier**, **＋ Appartement** et **＋ Numéro**, regroupés sur une ligne avec retour à la ligne si nécessaire. L’adresse et le logement restent présents dans leurs libellés d’accessibilité.

### Connexion au backend

Configurer l’adresse de l’API dans `.env.local` (ou dans le champ de connexion) :

```dotenv
EXPO_PUBLIC_CALENDRIERS_API_URL=http://192.168.1.20:8082/api
```

Cette variable est publique et ne doit contenir aucun secret. Sans variable, le module propose le poste Expo sur le port 8082. Adapter ce port à `WEB_PORT` du projet CalendrierSP. Sur un téléphone, `localhost` désigne le téléphone : utiliser l’IP locale du poste Docker. Sur l’émulateur Android, utiliser `10.0.2.2` si nécessaire. Sur le web, utiliser le même nom d’hôte pour Expo et l’API (`localhost` des deux côtés ou la même IP) pour les cookies SameSite. Après une modification de variable Expo, redémarrer Metro.

Pour autoriser un téléphone sur le réseau local, depuis `../calendriersp`, démarrer le frontal avec `WEB_BIND_ADDRESS=0.0.0.0 docker compose up -d frontend-web`. PostgreSQL et l’API directe restent liés à leur adresse configurée. Le téléphone et le poste doivent partager le réseau et le pare-feu doit autoriser le port web choisi. En production, utiliser HTTPS.

Le client natif utilise le cookie de session du système et le jeton CSRF de `/api/session`. Les cookies restent gérés par le système. La mémorisation des identifiants est facultative, selon les modalités ci-dessous. La session est reprise au lancement si le système dispose encore du cookie. Pour Expo web, le backend autorise uniquement les origines listées dans `MOBILE_WEB_ORIGINS` (par défaut `http://localhost:8081,http://127.0.0.1:8081`). Pour un autre port ou une IP locale, ajouter l’origine exacte à cette variable du backend puis recréer son conteneur. Un déploiement web sur un autre domaine doit utiliser un proxy de même origine ou une configuration de cookies adaptée ; CORS seul ne contourne pas SameSite.

Une connexion est nécessaire pour lire et écrire. L’interface confirme un enregistrement uniquement après réponse positive de l’API. Une erreur conserve le formulaire ; un conflit recharge les reçus disponibles. Si une réponse d’écriture est perdue, actualiser la tournée avant de renouveler la saisie. Aucune écriture n’est rejouée automatiquement. La synchronisation offline avec journal idempotent n’est pas encore implémentée.

Les anciens fichiers et clés de démonstration restent conservés séparément et ne sont ni importés ni envoyés au serveur. Les anciens utilitaires de démonstration sont gardés pour la lecture et les tests de ces sauvegardes ; le parcours actif n’importe plus les tournées ou carnets d’exemple.

### Mémoriser la connexion et suivre les calendriers

L’option **Mémoriser mes informations de connexion**, désactivée par défaut, conserve l’identifiant d’amicale, l’identifiant utilisateur (e-mail) et le mot de passe uniquement après une connexion réussie. L’adresse de l’API est conservée avec eux pour reprendre le bon serveur. Le prochain lancement préremplit ces champs, sans lancer une nouvelle connexion automatique. Une déconnexion conserve ce choix. Désactiver l’option ou utiliser **Oublier mes informations de connexion** efface la sauvegarde ; le bouton reste accessible quand le compte est connecté.

Sur Android/iOS, ces valeurs utilisent Expo SecureStore (Keychain/Keystore), sans fichier JSON de mot de passe. Une nouvelle compilation du client de développement est nécessaire pour intégrer cette dépendance native ; elle est disponible dans Expo Go. Sur le web, elles sont conservées dans le stockage local du navigateur, sans chiffrement : l’écran le précise avant activation. Cette option est destinée à un appareil personnel. Une erreur de stockage est affichée et ne bloque pas une connexion réussie.

Chaque tournée affiche **Calendriers vendus ou donnés : distribués / stock total**, avec le détail des ventes et des dons et une barre de progression. Ces valeurs viennent du serveur et se rechargent après une saisie ou une correction. Un passage **Don** compte pour un calendrier donné, conformément au calcul de l’API. Un stock nul affiche **Stock à renseigner**.

### Vérifications

```bash
node --test scripts/test-calendriers.cjs scripts/test-calendriers-api.cjs scripts/test-calendriers-connexion.cjs
npx tsc --noEmit
```

Les tests du client API et de la saisie couvrent cookies/CSRF, routes de création atomique, dons, CB, dates, logement, reçus utilisés et filtres. Les tests HTTP et le parcours Chrome interprojets sont exécutés avec la base éphémère de `../calendriersp/compose.test.yml` ; aucune donnée réelle n’est nécessaire.

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

# Ressources Leaflet embarquées

Ces modules contiennent le code source de Leaflet, Leaflet.markercluster et proj4,
exportés sous forme de chaînes de caractères. `LeafletMap.ts` les inline directement
dans le HTML de la WebView : plus aucun `<link>` ni `<script src>` distant, donc la
carte s'initialise sans réseau.

Les images référencées par `leaflet.css` (`layers.png`, `layers-2x.png`,
`marker-icon.png`) sont converties en data URI, et `leafletMarkerImages.ts` fournit
les images du marqueur `L.Icon.Default`.

## Régénérer

```
npm run vendor:leaflet
```

Le script `scripts/vendor-leaflet.mjs` retélécharge tout depuis unpkg / cdnjs.
Les versions sont fixées en tête du script (Leaflet 1.9.4, markercluster 1.5.3,
proj4 2.9.0). Ne pas éditer les fichiers générés à la main.

## Limite : les tuiles restent en ligne

Les fonds de carte (`https://{s}.tile.openstreetmap.org/...` et Google Satellite)
sont téléchargés tuile par tuile à l'affichage. Ils ne sont pas couverts ici : hors
réseau, la carte s'affiche avec ses marqueurs, contrôles, carroyage et itinéraires,
mais sur un fond vide.

Pour un fond de carte hors ligne il faut un pack de tuiles pré-téléchargé pour la
zone du secteur (par ex. tuiles zoom 12–17 exportées puis servies depuis le système
de fichiers de l'app), c'est une évolution distincte.

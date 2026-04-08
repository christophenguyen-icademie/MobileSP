import listeHydrants from "../../assets/hydrants.json";
import listePK from "../../assets/pk.json";
import ItineraireConstants from "./ItinerairesConstants";

export default function LeafletMap() {

  const listePKA5 = listePK.filter((pk) => pk.route === 'A5');
  const listePKA26 = listePK.filter((pk) => pk.route === 'A26');
  const listePKD610 = listePK.filter((pk) => pk.route === 'D610');
  const listePKN77 = listePK.filter((pk) => pk.route === 'N77');

  let literalScriptMarkersPKA5="[";
  listePKA5.forEach((pk) => {
    literalScriptMarkersPKA5+= "L.marker([" + pk.position[0] + "," + pk.position[1] + "],{icon: createNumberedMarker(" + pk.pk + ")}),";
  });

  if(listePKA5.length>0){
    literalScriptMarkersPKA5 = literalScriptMarkersPKA5.substring(0,literalScriptMarkersPKA5.length-1);
  }
  literalScriptMarkersPKA5+="]";

  let literalScriptMarkersPKA26="[";
  listePKA26.forEach((pk) => {
    literalScriptMarkersPKA26+= "L.marker([" + pk.position[0] + "," + pk.position[1] + "],{icon: createNumberedMarker(" + pk.pk + ")}),";
  });

  if(listePKA26.length>0){
    literalScriptMarkersPKA26 = literalScriptMarkersPKA26.substring(0,literalScriptMarkersPKA26.length-1);
  }
  literalScriptMarkersPKA26+="]";

  let literalScriptMarkersPKD610="[";
  listePKD610.forEach((pk) => {
    literalScriptMarkersPKD610+= "L.marker([" + pk.position[0] + "," + pk.position[1] + "],{icon: createNumberedMarker(" + pk.pk + ")}),";
  });

  if(listePKD610.length>0){
    literalScriptMarkersPKD610 = literalScriptMarkersPKD610.substring(0,literalScriptMarkersPKD610.length-1);
  }
  literalScriptMarkersPKD610+="]";

  let literalScriptMarkersPKN77="[";
  listePKN77.forEach((pk) => {
    literalScriptMarkersPKN77+= "L.marker([" + pk.position[0] + "," + pk.position[1] + "],{icon: createNumberedMarker(" + pk.pk + ")}),";
  });

  if(listePKN77.length>0){
    literalScriptMarkersPKN77 = literalScriptMarkersPKN77.substring(0,literalScriptMarkersPKN77.length-1);
  }
  literalScriptMarkersPKN77+="]";


  let literalScriptMarkersHydrants="[";

  listeHydrants.forEach((hydrant) => {
    const popup = hydrant.nom_sdis + " " + hydrant.type_hydrant;
    if(hydrant.type_hydrant === "Poteau incendie"){
      literalScriptMarkersHydrants += "L.marker([" + hydrant.latitude + "," + hydrant.longitude + "],{icon: createFireHydrantIcon()}).bindPopup(\"" + popup + "\"),";
    } else if(hydrant.type_hydrant === "Bouche incendie"){
      literalScriptMarkersHydrants += "L.marker([" + hydrant.latitude + "," + hydrant.longitude + "],{icon: createFireHydrantBoucheIcon()}).bindPopup(\"" + popup + "\"),";
    } else {
      literalScriptMarkersHydrants += "L.marker([" + hydrant.latitude + "," + hydrant.longitude + "],{icon: createMarkerPEI()}).bindPopup(\"" + popup + "\"),";
    }
  });

  if(listeHydrants.length>0){
   literalScriptMarkersHydrants = literalScriptMarkersHydrants.substring(0,literalScriptMarkersHydrants.length-1);
  }

  literalScriptMarkersHydrants+="]";

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css">
<style>
    html,body,#map{height:100%;margin:0;padding:0}
    body{background:#fff}  
    .label {
        font-weight: bold;
        color: red;
        font-size: 14px;
    }

    .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
    }

    /* Hide default HTML checkbox */
    .switch input {
    opacity: 0;
    width: 0;
    height: 0;
    }

    /* The slider */
    .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
    }

    .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
    }

    input:checked + .slider {
    background-color: #2196F3;
    }

    input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
    }

    input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
    }

    .slider.round:before {
    border-radius: 50%;
    }

    .custom-number-marker {
    background: transparent;
    }

    .marker-badge {
        width: 30px;
        height: 30px;
        background-color: #1976d2;
        color: white;
        font-weight: bold;
        text-align: center;
        line-height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    
    .marker-badge {
        width: 30px;
        height: 30px;
        background-color: #1976d2;
        color: white;
        font-weight: bold;
        text-align: center;
        line-height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .route-time-control {
        background: white;
        padding: 8px 12px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-weight: 700;
        font-size: 14px;
        color: #111;
        min-width: 120px;
        text-align: center;
    }
    .maille-control {
        background: white;
        padding: 8px 12px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-weight: 700;
        font-size: 14px;
        color: #111;
        min-width: 120px;
        text-align: center;
    }
    
    .fire-hydrant-icon {
      background: transparent;
      border: none;
    }
    
    .fire-hydrant-bouche-icon {
      background: transparent;
      border: none;
    }
    
    .fire-hydrant-bouche-marker {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
    }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js"></script>
<script>
  // Créer l'objet ReactNativeWebView pour la communication avec React Native
  window.ReactNativeWebView = {
    postMessage: (data) => {
      // Envoyer le message au window parent qui écoute via addEventListener
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage(typeof data === 'string' ? data : JSON.stringify(data), "*");
      }
    }
  };

  proj4.defs("EPSG:2154",
    "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 " +
    "+x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs");

  function toLambert(lat, lon) {
      return proj4("EPSG:4326", "EPSG:2154", [lon, lat]);
  }

  function toWGS(x, y) {
      return proj4("EPSG:2154", "EPSG:4326", [x, y]);
  }

  
  const PAS = 600; // 600 mètres

  // Point Nord-Ouest de 80-CK
  const refLat = 48.294458;
  const refLon = 4.085533;
  const refXY = toLambert(refLat, refLon);

  const originX = refXY[0];
  const originY = refXY[1]; 

  // -----------------------------
  // 4) Génération des mailles
  // -----------------------------
  const refRow = 80;
  const startRow = 68;
  const endRow = 95;
  const refCol = "CK";
  const startCol = "CA";
  const endCol = "CZ";

  // Conversion lettres en index
  function colToIndex(col) {
      return (col.charCodeAt(0) - 65) * 26 + (col.charCodeAt(1) - 65);
  }

  function indexToCol(index) {
      let first = Math.floor(index / 26);
      let second = index % 26;
      return String.fromCharCode(65 + first) +
            String.fromCharCode(65 + second);
  }

  let refColIndex = colToIndex(refCol);
  let startColIndex = colToIndex(startCol);
  let endColIndex = colToIndex(endCol);

  function getCellInfo(lat, lon) {

      let xy = toLambert(lat, lon);

      let colOffset = Math.floor((xy[0] - originX) / PAS);
      let rowOffset = Math.floor((originY - xy[1]) / PAS);

      let colIndex = refColIndex + colOffset;
      let row = refRow + rowOffset;

      let inside =
          row >= startRow &&
          row <= endRow &&
          colIndex >= startColIndex &&
          colIndex <= endColIndex;
   
      return {
          inside: inside,
          row: row,
          colIndex: colIndex
      };
  }
  
  function showMailles(){  
    let markers = [];
    for (let row = startRow; row <= endRow; row++) {
        for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
            let dx = (colIndex - refColIndex) * PAS;
            let dy = (row - refRow) * PAS;

            let xWest = originX + dx;
            let xEast = xWest + PAS;

            let yNorth = originY - dy;
            let ySouth = yNorth - PAS;

            // Conversion vers WGS
            let nw = toWGS(xWest, yNorth);
            let ne = toWGS(xEast, yNorth);
            let se = toWGS(xEast, ySouth);
            let sw = toWGS(xWest, ySouth);

            let polygon = L.polygon([
                [nw[1], nw[0]],
                [ne[1], ne[0]],
                [se[1], se[0]],
                [sw[1], sw[0]]
            ], {
                color: "red",
                weight: 1,
                fill: false
            });

            markers.push(polygon);

            // Label au centre
            let centerX = xWest + PAS/2;
            let centerY = yNorth - PAS/2;
            let center = toWGS(centerX, centerY);

            let markerMaille = L.marker([center[1], center[0]], {
                icon: L.divIcon({
                    className: 'label',
                    html: row + "-" + indexToCol(colIndex),
                    iconSize: [80,20]
                })
            });
            markers.push(markerMaille);
        }
    }
    return markers;
  }

  function hideMailles(){
    polylinesMailles.forEach(poly => map.removeLayer(poly));
    polylinesMailles = []; 
    marqueursMailles.forEach(m => map.removeLayer(m));
    marqueursMailles = [];
  }


  function createNumberedMarker(number) {
      return L.divIcon({
          className: "custom-number-marker",
          html: '<div class="marker-badge">' + number + '</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
      });
  }

  function createMarkerPEI() {  
    return L.divIcon({
      html: '<div style="font-size:32px">🧯</div>',
      className: '',
      iconSize: [36,36],
      iconAnchor: [18,18]
    });
  }
  
  function createFireHydrantBoucheIcon() {
  return L.divIcon({
    className: 'fire-hydrant-bouche-icon',
    html: \`
      <div class="fire-hydrant-bouche-marker">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#1976D2" />
          <circle cx="12" cy="12" r="5" fill="#E3F2FD" />
          <path
            d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4Z"
            fill="#1565C0"
          />
          <path
            d="M10 9.5h4v5h-4v-5Z"
            fill="#FFFFFF"
          />
          <path
            d="M9 7.5h6"
            stroke="#0D47A1"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </div>
    \`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  });
}
  
  function createFireHydrantIcon() {
  return L.divIcon({
    className: 'fire-hydrant-icon',
    html: \`
      <div class="fire-hydrant-marker">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 10c0-2.8 2.2-5 5-5s5 2.2 5 5v2h1.5c.8 0 1.5.7 1.5 1.5V16h-2v5h-3v-3H9v3H6v-5H4v-2.5C4 12.7 4.7 12 5.5 12H7v-2Z"
            fill="#D32F2F"
          />
          <path
            d="M9 9.5c0-1.4 1.1-2.5 2.5-2.5S14 8.1 14 9.5V12H9V9.5Z"
            fill="#FFCDD2"
          />
          <rect x="7.5" y="16" width="9" height="2" rx="1" fill="#B71C1C" />
          <rect x="10" y="18" width="4" height="3" rx="1" fill="#B71C1C" />
        </svg>
      </div>
    \`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}
</script>
<script>
  var map = L.map('map').setView([${ItineraireConstants.CIS_COORDINATES.latitude}, ${ItineraireConstants.CIS_COORDINATES.longitude}], 13);

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  })
  osm.addTo(map);

  var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: '© Google contributors'
  });

  var baseMaps = {
    "OpenStreetMap": osm,
    "Google Satellite": googleSat
  };

  var pei = L.layerGroup(${literalScriptMarkersHydrants});
  var pkA5 = L.layerGroup(${literalScriptMarkersPKA5});
  var pkA26 = L.layerGroup(${literalScriptMarkersPKA26});
  var pkD610 = L.layerGroup(${literalScriptMarkersPKD610});
  var pkN77 = L.layerGroup(${literalScriptMarkersPKN77});
  var Lmailles = L.layerGroup(showMailles());
  var overlayMaps = {
      "Points kilométriques A5": pkA5,
      "Points kilométriques A26": pkA26,
      "Points kilométriques D610": pkD610,
      "Points kilométriques N77": pkN77,
      "Carroyage": Lmailles
  };
  var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
  
  var routeTimeControl = null;
  var mailleControl = null;
  
  // Création du cluster
  const hydrantsMarkersCluster = L.markerClusterGroup();
  
  // Ajout des markers du layerGroup au cluster
  pei.eachLayer(function(layer) {
      hydrantsMarkersCluster.addLayer(layer);
  });
 
  layerControl.addOverlay(hydrantsMarkersCluster , "Hydrants");
  var cisIcon = L.divIcon({
      html: '<div style="font-size:32px">👨‍🚒</div>',
      className: '',
      iconSize: [36,36],
      iconAnchor: [18,18]
    });

  var chIcon = L.divIcon({
      html: '<div style="font-size:32px">🏥</div>',
      className: '',
      iconSize: [36,36],
      iconAnchor: [18,18]
    });

  L.marker([${ItineraireConstants.CIS_COORDINATES.latitude}, ${ItineraireConstants.CIS_COORDINATES.longitude}], { icon: cisIcon }).addTo(map);
  L.marker([${ItineraireConstants.CH_COORDINATES.latitude}, ${ItineraireConstants.CH_COORDINATES.longitude}], { icon: chIcon }).addTo(map);

  var currentLocationMarker = null;
  var destinationMarker = null;
  var routeLayer = null;
  var stepLayers = [];
  var highlightedStepIndex = null;

  function setCenter(lat, lon) {
    map.setView([lat, lon], 13);
  }
  
  function createRouteTimeControl() {
    if (routeTimeControl) {
      return routeTimeControl;
    }

    routeTimeControl = L.control({ position: 'topright' });

    routeTimeControl.onAdd = function () {
      var div = L.DomUtil.create('div', 'route-time-control');
      div.innerHTML = '⏱ Temps : --';
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      routeTimeControl._div = div;
      return div;
    };

    routeTimeControl.addTo(map);
    return routeTimeControl;
  }

  function setRouteTime(duration, distance) {
    createRouteTimeControl();

    if (routeTimeControl && routeTimeControl._div) {
      routeTimeControl._div.innerHTML = '⏱ Temps : ' + (duration || '--');
      routeTimeControl._div.innerHTML += '<br/>📏 Distance : ' + (distance || '--');      
    }
  }
  
  function createMailleControl() {
    if (mailleControl) {
      return mailleControl;
    }

    mailleControl = L.control({ position: 'topright' });

    mailleControl.onAdd = function () {
      var div = L.DomUtil.create('div', 'maille-control');
      div.innerHTML = '⬜ Maille : --';
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      mailleControl._div = div;
      return div;
    };

    mailleControl.addTo(map);
    return mailleControl;
  }

  function setCurrentLocation(lat, lon) {
    if (currentLocationMarker) {
      currentLocationMarker.setLatLng([lat, lon]);
    } else {
      var truckIcon = L.divIcon({
        html: '<div style="font-size:32px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">🚒</div>',
        className: '',
        iconSize: [36,36],
        iconAnchor: [18,18]
      });
      currentLocationMarker = L.marker([lat, lon], { icon: truckIcon }).addTo(map);
    }
  }

  function setDestination(lat, lon, pk) {
  
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
    }
    
    if(pk) {        
      destinationMarker = L.marker([lat, lon],{icon: createNumberedMarker(pk)}).addTo(map);      
    } else {
      var destIcon = L.divIcon({
        html: '<div style="font-size:32px">🔥</div>',
        className: '',
        iconSize: [36,36],
        iconAnchor: [18,18]
      });
      destinationMarker = L.marker([lat, lon], { icon: destIcon }).addTo(map);
    }   

    let cell = getCellInfo(lat, lon);
    let content;
    if (cell.inside) {
        let code = cell.row + "-" + indexToCol(cell.colIndex);
        setMaille(code);
    } else {
        setMaille('');
    }   
  }

  function setMaille(code){  
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'setMaille',
        maille: code
      }));
      createMailleControl();
      if (mailleControl && mailleControl._div) {
        mailleControl._div.innerHTML = '⬜ Maille : ' + (code || '--');
      }
  }

  function drawRoute(coords) {
    try {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      stepLayers.forEach(layer => map.removeLayer(layer));
      stepLayers = [];
      
      var latlngs = coords.map(function(c){ return [c[0], c[1]]; });
      routeLayer = L.polyline(latlngs, { color: '#007AFF', weight: 4 }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [20,20] });
    } catch(e){ console.error('Error drawing route:', e); }
  }

  function highlightStep(stepIndex) {  
    if (highlightedStepIndex !== null && stepLayers[highlightedStepIndex]) {
      stepLayers[highlightedStepIndex].setStyle({ color: '#007AFF', weight: 4, opacity: 0.8 });
    }
    
    if (stepLayers[stepIndex]) {
      stepLayers[stepIndex].setStyle({ color: '#FF6B00', weight: 8, opacity: 1 });
      map.fitBounds(stepLayers[stepIndex].getBounds(), { padding: [50,50] });
    }
    highlightedStepIndex = stepIndex;
  }

  function clearRoute() {
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
      destinationMarker = null;
    }
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    stepLayers.forEach(layer => map.removeLayer(layer));
    stepLayers = [];
    highlightedStepIndex = null;
    setMaille('');   
    if (routeTimeControl) {
      map.removeControl(routeTimeControl);
      routeTimeControl = null;
    }
    if (mailleControl) {
      map.removeControl(mailleControl);
      mailleControl = null;
    }
  }

  function handleMessage(msg) {   
    
    try {
      var data = typeof msg === 'string' ? JSON.parse(msg) : msg;      
      if (data.type === 'setCurrentLocation' && data.latitude && data.longitude) {          
        setCurrentLocation(data.latitude, data.longitude);
      } else if (data.type === 'setCenter' && data.lat && data.lon) {
        setCenter(data.lat, data.lon);
      } else if (data.type === 'setDestination' && data.latitude && data.longitude) {          
        setDestination(data.latitude, data.longitude, data.pk);
      } else if (data.type === 'drawRoute' && Array.isArray(data.coords)) {
        drawRoute(data.coords);
      } else if (data.type === 'highlightStep') {
        highlightStep(data.stepIndex);      
      } else if (data.type === 'clearRoute') {
        clearRoute();
      } else if (data.type === 'setRouteTime') {
        setRouteTime(data.duration, data.distance);
      }
    } catch (e) { console.error('Error handling message:', e); }
  }

  document.addEventListener('message', function(e) { handleMessage(e.data); }, false);
  window.addEventListener('message', function(e) { handleMessage(e.data); }, false);

</script>
</body>
</html>`;
}
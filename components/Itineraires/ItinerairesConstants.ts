type ServicesMode = 'local' | 'remote';

const SERVICES_MODE: ServicesMode =
    process.env.EXPO_PUBLIC_SERVICES_MODE === 'remote' ? 'remote' : 'local';

const LOCAL_HOST = process.env.EXPO_PUBLIC_LOCAL_SERVICES_HOST || 'localhost';

const commonConstants = {
    CIS_COORDINATES: { latitude: 48.29197, longitude: 4.08716 },
    CH_COORDINATES: { latitude: 48.278076, longitude: 4.067612 },
};

export const LocalItineraireConstants = {
    ...commonConstants,
    SERVICES_MODE: 'local' as const,
    ORS_API_KEY: '',
    GEOCODING_URL: `http://${LOCAL_HOST}:8082/geocodage`,
    TUILES_URL: `http://${LOCAL_HOST}:8090/tile/{z}/{x}/{y}.png`,
    TUILES_LAYER_NAME: 'OpenStreetMap (local)',
    TUILES_ZOOM_MAX_NATIF: 19,
    OPENROUTESERVICE_DIRECTIONS_URL:
        `http://${LOCAL_HOST}:8084/ors/v2/directions/driving-car/json`,
    OPENROUTESERVICE_SNAP_URL:
        `http://${LOCAL_HOST}:8084/ors/v2/snap/driving-car`,
};

export const RemoteItineraireConstants = {
    ...commonConstants,
    SERVICES_MODE: 'remote' as const,
    ORS_API_KEY: process.env.EXPO_PUBLIC_ORS_API_KEY || '',
    GEOCODING_URL: 'https://data.geopf.fr/geocodage',
    TUILES_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    TUILES_LAYER_NAME: 'OpenStreetMap (en ligne)',
    TUILES_ZOOM_MAX_NATIF: 19,
    OPENROUTESERVICE_DIRECTIONS_URL:
        'https://api.openrouteservice.org/v2/directions/driving-car/json',
    OPENROUTESERVICE_SNAP_URL:
        'https://api.openrouteservice.org/v2/snap/driving-car',
};

const ItineraireConstants = SERVICES_MODE === 'remote'
    ? RemoteItineraireConstants
    : LocalItineraireConstants;

export default ItineraireConstants;

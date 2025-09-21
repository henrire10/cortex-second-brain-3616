
// Centralized Google Maps loader
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCbnFc9494hg0LJERQX5bVP1DWNEyVENxM';

let loaderPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    (window as any).initMap = () => {
      resolve((window as any).google);
    };

    const existing = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    ) as HTMLScriptElement | null;

    if (!existing) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        reject(new Error('Google Maps script failed to load'));
      };
      document.head.appendChild(script);
    }
  });

  return loaderPromise;
}

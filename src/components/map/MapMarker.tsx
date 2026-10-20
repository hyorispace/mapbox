import { useEffect } from 'react';

import mapboxgl from 'mapbox-gl';

interface MapMarkerProps {
  map: mapboxgl.Map;
  lng: number;
  lat: number;
  popupText?: string;
}

export function MapMarker({ map, lng, lat, popupText }: MapMarkerProps) {
  useEffect(() => {
    const marker = new mapboxgl.Marker().setLngLat([lng, lat]);

    if (popupText) {
      marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText(popupText));
    }

    marker.addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, lng, lat, popupText]);

  return null;
}

'use client';

import { useRef, useEffect, useState } from 'react';

import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

export default function Map() {
  const [center, setCenter] = useState<[number, number]>(() => INITIAL_CENTER);
  const [zoom, setZoom] = useState(() => INITIAL_ZOOM);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const handleReset = () => {
    mapRef.current?.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  useEffect(() => {
    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
      container: mapContainerRef.current!,
      center,
      zoom,
      projection: 'mercator',
      pitchWithRotate: false,
      dragPan: false,
      scrollZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      touchPitch: false,
      touchZoomRotate: false,
      dragRotate: false,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      setCenter([lng, lat]);
      setZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      {/* Sidebar placeholder */}
      <div className="w-1/4 p-4 bg-sg-light-green">
        <h2 className="text-sg-green text-xl font-bold">Stores nearby:</h2>
      </div>

      <button onClick={handleReset}>Reset</button>

      {/* Map container */}
      <div className="w-3/4">
        <div className="h-full w-full" ref={mapContainerRef} />
      </div>
    </div>
  );
}

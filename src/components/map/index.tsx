'use client';

import { useRef, useEffect, useState } from 'react';

import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

function isStyleReady(map: mapboxgl.Map | null) {
  return Boolean(map?.style?._loaded);
}

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
      dragRotate: false,
      maxPitch: 0,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.touchZoomRotate.disableRotation(); // 터치: 두 손가락 회전만 끔 (핀치 줌은 유지)
    map.keyboard.disableRotation(); // 키보드: Shift+←/→ 회전, Shift+↑/↓ 기울기 끔 (이동·줌은 유지)

    map.on('style.load', () => {
      if (isStyleReady(map)) {
        map.addSource('urban-areas', {
          type: 'geojson',
          data: 'https://docs.mapbox.com/mapbox-gl-js/assets/ne_50m_urban_areas.geojson',
        });

        map.addLayer({
          id: 'urban-areas-fill',
          type: 'fill',
          source: 'urban-areas',
          layout: {},
          paint: {
            'fill-color': '#f08',
            'fill-opacity': 0.4,
          },
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleStyleChange = () => {
    if (
      isStyleReady(mapRef.current) ||
      mapRef.current?.getLayer('urban-areas-fill') === null
    ) {
      console.log('헐', mapRef.current?.getLayer('urban-areas-fill'));
      mapRef.current?.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    }
  };

  const handleStyleReset = () => {
    mapRef.current?.setStyle('mapbox://styles/mapbox/streets-v12');
  };

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      {/* Sidebar placeholder */}
      <div className="w-1/4 p-4 bg-sg-light-green">
        <h2 className="text-sg-green text-xl font-bold">Stores nearby:</h2>
      </div>

      <button onClick={handleReset}>Reset</button>

      <button
        onClick={handleStyleChange}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        스타일 전환 버튼
      </button>

      <button
        onClick={handleStyleReset}
        className="cursor-pointer bg-black text-white p-2 rounded-md h-fit w-20"
      >
        스타일 리셋 버튼
      </button>

      {/* Map container */}
      <div className="w-3/4">
        <div className="h-full w-full" ref={mapContainerRef} />
      </div>
    </div>
  );
}

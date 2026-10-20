'use client';

import { useRef, useEffect, useState } from 'react';

import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import { UrbanAreasLayer } from './UrbanAreasLayer';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

const NO_DIFF = { diff: false } as Parameters<mapboxgl.Map['setStyle']>[1];

export default function Map() {
  const [center, setCenter] = useState<[number, number]>(() => INITIAL_CENTER);
  const [zoom, setZoom] = useState(() => INITIAL_ZOOM);

  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isUrbanVisible, setIsUrbanVisible] = useState(true);

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

    setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, []);

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      {/* Sidebar placeholder */}
      <div className="w-1/4 p-4 bg-sg-light-green">
        <h2 className="text-sg-green text-xl font-bold">Stores nearby:</h2>
      </div>

      <button onClick={handleReset}>Reset</button>

      <button
        onClick={() => setIsUrbanVisible((prev) => !prev)}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        도시레이어 토글
      </button>

      <button
        onClick={() =>
          mapRef.current?.setStyle(
            'mapbox://styles/mapbox/satellite-streets-v12',
            NO_DIFF
          )
        }
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        위성
      </button>
      <button
        onClick={() =>
          mapRef.current?.setStyle(
            'mapbox://styles/mapbox/streets-v12',
            NO_DIFF
          )
        }
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        일반
      </button>

      {/* Map container */}
      <div className="w-3/4">
        <div className="h-full w-full" ref={mapContainerRef} />
        {map && isUrbanVisible && <UrbanAreasLayer map={map} />}
      </div>
    </div>
  );
}

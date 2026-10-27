'use client';

import { useRef, useState } from 'react';
import MapGL, {
  type MapRef,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';
import DrawControl, { type TDrawError } from './DrawControl';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

/** react-map-gl은 mapStyle을 생략하면 빈 스타일을 쓰므로 Standard도 직접 적는다 */
const MAP_STYLES = {
  standard: { label: '기본', url: 'mapbox://styles/mapbox/standard' },
  streets: { label: '일반', url: 'mapbox://styles/mapbox/streets-v12' },
  satellite: {
    label: '위성',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
} as const;

type TMapStyle = keyof typeof MAP_STYLES;

const MAP_STYLE_KEYS = Object.keys(MAP_STYLES) as TMapStyle[];

export default function Map() {
  const [mapStyle, setMapStyle] = useState<TMapStyle>('standard');
  const [area, setArea] = useState(0);
  const [error, setError] = useState<TDrawError>(null);

  const mapRef = useRef<MapRef>(null);

  const handleReset = () => {
    mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleReset}
          className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
        >
          Reset
        </button>

        {MAP_STYLE_KEYS.map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
          >
            {MAP_STYLES[style].label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="relative w-3/4">
        <MapGL
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            longitude: INITIAL_CENTER[0],
            latitude: INITIAL_CENTER[1],
            zoom: INITIAL_ZOOM,
          }}
          mapStyle={MAP_STYLES[mapStyle].url}
          // 스타일을 바꿀 때마다 새로 만들어서 직접 추가한 레이어가 styledata 때 확실히 다시 붙게 한다
          styleDiffing={false}
          projection="mercator"
          dragRotate={false}
          maxPitch={0}
          onLoad={(e) => {
            e.target.touchZoomRotate.disableRotation(); // 터치: 두 손가락 회전만 끔 (핀치 줌은 유지)
            e.target.keyboard.disableRotation(); // 키보드: Shift+←/→ 회전, Shift+↑/↓ 기울기 끔 (이동·줌은 유지)
          }}
        >
          <DrawControl setArea={setArea} setError={setError} />
          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-left" />
        </MapGL>

        {/* Floating panel over the map */}
        <div className="absolute top-0 bottom-0 left-0 z-10 w-75 bg-white/60 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-bold">패널</h2>
          <p>면적: {area.toFixed(1)} ㎢</p>
          {error === 'geometry' && (
            <p className="text-red-600">선이 꼬였습니다</p>
          )}
          {error === 'area' && (
            <p className="text-red-600">최소 25㎢ 이상 그려야 합니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

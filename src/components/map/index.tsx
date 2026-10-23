'use client';

import { useRef, useState } from 'react';
import MapGL, {
  type MapRef,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';
import {
  type TLayerPlacement,
  type TUrbanArea,
  UrbanAreasLayer,
} from './UrbanAreasLayer';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

const URBAN_AREAS: TUrbanArea[] = ['seoul', 'busan', 'jeju'];

const DEFAULT_FILL_COLOR = '#ff4c4c';
const BLUE_FILL_COLOR = '#0000FF';

/**
 * 스타일별 URL과 내 레이어를 끼울 자리.
 * react-map-gl은 mapStyle을 생략하면 빈 스타일을 쓰므로 Standard도 직접 적는다.
 * beforeId는 각 스타일에서 글자가 있는 첫 symbol 레이어다.
 */
const MAP_STYLES = {
  standard: {
    url: 'mapbox://styles/mapbox/standard',
    placement: { slot: 'middle' },
  },
  streets: {
    url: 'mapbox://styles/mapbox/streets-v12',
    placement: { beforeId: 'building-entrance' },
  },
  satellite: {
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    placement: { beforeId: 'road-label' },
  },
} satisfies Record<string, { url: string; placement: TLayerPlacement }>;

type TMapStyle = keyof typeof MAP_STYLES;

export default function Map() {
  const [mapStyle, setMapStyle] = useState<TMapStyle>('standard');
  const [selectedUrbanArea, setSelectedUrbanArea] =
    useState<TUrbanArea>('seoul');
  const [fillColor, setFillColor] = useState(DEFAULT_FILL_COLOR);
  const [isUrbanVisible, setIsUrbanVisible] = useState(true);

  const mapRef = useRef<MapRef>(null);

  const handleReset = () => {
    mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  const handleFitBounds = () => {
    mapRef.current?.fitBounds([126.76, 37.41, 127.18, 37.7], {
      padding: { top: 20, right: 20, bottom: 20, left: 320 },
      retainPadding: false,
    });
  };

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      {/* Sidebar placeholder */}
      <div className="w-1/4 p-4 bg-sg-light-green">
        <h2 className="text-sg-green text-xl font-bold">Stores nearby:</h2>
      </div>

      <button onClick={handleReset}>Reset</button>

      <button
        onClick={handleFitBounds}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        Fit bounds
      </button>

      <button
        onClick={() => setFillColor(BLUE_FILL_COLOR)}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        파랑
      </button>
      <button
        onClick={() => setIsUrbanVisible((prev) => !prev)}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        {isUrbanVisible ? '숨기기' : '보이기'}
      </button>

      <button
        onClick={() => setMapStyle('satellite')}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        위성
      </button>
      <button
        onClick={() => setMapStyle('streets')}
        className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
      >
        일반
      </button>

      {URBAN_AREAS.map((urbanArea) => (
        <button
          key={urbanArea}
          onClick={() => setSelectedUrbanArea(urbanArea)}
          className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
        >
          {urbanArea}
        </button>
      ))}

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
          // 스타일을 바꿀 때마다 새로 만들어서 Layer가 styledata 때 확실히 다시 붙게 한다
          styleDiffing={false}
          projection="mercator"
          dragRotate={false}
          maxPitch={0}
          onLoad={(e) => {
            e.target.touchZoomRotate.disableRotation(); // 터치: 두 손가락 회전만 끔 (핀치 줌은 유지)
            e.target.keyboard.disableRotation(); // 키보드: Shift+←/→ 회전, Shift+↑/↓ 기울기 끔 (이동·줌은 유지)
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-left" />
          {/* 스타일마다 끼울 자리가 달라서, 스타일이 바뀌면 레이어를 새로 마운트한다 */}
          <UrbanAreasLayer
            key={mapStyle}
            urbanArea={selectedUrbanArea}
            fillColor={fillColor}
            isVisible={isUrbanVisible}
            placement={MAP_STYLES[mapStyle].placement}
          />
        </MapGL>

        {/* Floating panel over the map */}
        <div className="absolute top-0 bottom-0 left-0 z-10 w-75 bg-white/60 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-bold">Floating panel</h2>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import MapGL, {
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
} from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';
import {
  LAYER_FILL_ID,
  SOURCE_ID,
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

/** 팝업을 띄울 위치와 내용. null이면 팝업이 닫혀 있다 */
type TPopupInfo = {
  longitude: number;
  latitude: number;
  name: string;
} | null;

export default function Map() {
  const [cursor, setCursor] = useState('');
  const [mapStyle, setMapStyle] = useState<TMapStyle>('standard');
  const [selectedUrbanArea, setSelectedUrbanArea] =
    useState<TUrbanArea>('seoul');
  const [fillColor, setFillColor] = useState(DEFAULT_FILL_COLOR);
  const [isUrbanVisible, setIsUrbanVisible] = useState(true);
  const [popupInfo, setPopupInfo] = useState<TPopupInfo>(null);
  const [visibleUrbanAreas, setVisibleUrbanAreas] = useState<string[]>([]);

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
      <div className="flex gap-4 flex-wrap">
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

        <div>
          {URBAN_AREAS.map((urbanArea) => (
            <button
              key={urbanArea}
              onClick={() => setSelectedUrbanArea(urbanArea)}
              className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
            >
              {urbanArea}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="relative w-3/4">
        <MapGL
          ref={mapRef}
          interactiveLayerIds={[LAYER_FILL_ID]}
          onMoveEnd={(e) => {
            // 지금 화면에 그려진 도시 영역만 찾는다. 숨긴 레이어나 화면 밖 feature는 빠진다
            const features = e.target.queryRenderedFeatures({
              layers: [LAYER_FILL_ID],
            });
            const names = features
              .map((feature) => feature.properties?.name)
              .filter((name): name is string => typeof name === 'string');

            // 타일 경계에 걸친 영역은 조각마다 따로 나오므로 이름으로 중복을 없앤다
            setVisibleUrbanAreas([...new Set(names)]);
          }}
          onClick={(e) => {
            const name = e.features?.[0]?.properties?.name;

            // 영역 밖을 누르면 닫고, 영역을 누르면 그 위치로 팝업을 옮긴다
            setPopupInfo(
              typeof name === 'string'
                ? { longitude: e.lngLat.lng, latitude: e.lngLat.lat, name }
                : null
            );
          }}
          onMouseEnter={() => setCursor('pointer')}
          onMouseLeave={(e) => {
            setCursor('');
            const id = e.features?.[0]?.id;
            if (id === undefined) return; // 영역 밖이면 아무것도 안 한다

            mapRef.current?.setFeatureState(
              { source: SOURCE_ID, id },
              { hover: false }
            );
          }}
          onMouseMove={(e) => {
            const id = e.features?.[0]?.id;
            if (id === undefined) return; // 영역 밖이면 아무것도 안 한다

            mapRef.current?.setFeatureState(
              { source: SOURCE_ID, id },
              { hover: true }
            );
          }}
          cursor={cursor}
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
            fillColor={fillColor}
            isVisible={isUrbanVisible}
            placement={MAP_STYLES[mapStyle].placement}
          />

          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              offset={10}
              // 지도 클릭으로 여닫기를 onClick에서 직접 하므로, mapbox의 "다른 곳 클릭 시 닫기"는 끈다
              closeOnClick={false}
              onClose={() => setPopupInfo(null)}
            >
              <div className="flex flex-col gap-2">
                <strong>{popupInfo.name}</strong>
                <button
                  onClick={() => setPopupInfo(null)}
                  className="bg-black text-white px-2 py-1 rounded-md cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </Popup>
          )}
        </MapGL>

        {/* Floating panel over the map */}
        <div className="absolute top-0 bottom-0 left-0 z-10 w-75 bg-white/60 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-bold">화면에 보이는 도시</h2>
          {visibleUrbanAreas.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {visibleUrbanAreas.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">없음 (지도를 움직이면 갱신된다)</p>
          )}
        </div>
      </div>
    </div>
  );
}

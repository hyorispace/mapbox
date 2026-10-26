'use client';

import { Fragment, useRef, useState } from 'react';
import MapGL, {
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
} from 'react-map-gl/mapbox';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import 'mapbox-gl/dist/mapbox-gl.css';
import {
  SOURCE_ID,
  type TLayerPlacement,
  type TUrbanArea,
} from './UrbanAreasLayer';
import SatelliteLayer from './SatelliteLayer';
import ImageLayer from './ImageLayer';

const INITIAL_CENTER: [number, number] = [127.42961, 35.91911];
const INITIAL_ZOOM = 6.5;

/** 서울 영역 [서, 남, 동, 북] */
const SEOUL_BOUNDS: [number, number, number, number] = [
  126.76, 37.41, 127.18, 37.7,
];

const URBAN_AREAS: TUrbanArea[] = ['seoul', 'busan', 'jeju'];

/** 투명 픽셀 하나짜리 PNG. 막은 타일 자리에 돌려준다 */
const EMPTY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** 위성 타일 주소에서 z/x/y를 뽑는다. 배경지도 벡터 타일(.vector.pbf)은 걸리지 않는다 */
const SATELLITE_TILE_PATTERN = /mapbox\.satellite\/(\d+)\/(\d+)\/(\d+)/;

/** 이 타일 z부터 위성 타일을 받지 않는다. tileSize 256이라 지도 줌으로는 약 14부터다 */
const SATELLITE_BLOCK_MIN_TILE_ZOOM = 15;

/**
 * 지도가 보내는 모든 요청이 지나간다. 지도를 만들 때 한 번만 쓰이므로 React state를 읽지 않는다.
 * 고해상도 위성 타일만 빈 이미지로 바꾸고, 나머지는 그대로 보낸다.
 */
function transformRequest(url: string, resourceType?: string) {
  if (resourceType !== 'Tile') {
    return { url };
  }

  const match = url.match(SATELLITE_TILE_PATTERN);
  if (!match) {
    return { url };
  }

  const z = Number(match[1]);
  return { url: z >= SATELLITE_BLOCK_MIN_TILE_ZOOM ? EMPTY_PNG : url };
}

const DEFAULT_FILL_COLOR = '#ff4c4c';

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
  const [, setSelectedUrbanArea] = useState<TUrbanArea>('seoul');
  const [isUrbanVisible, setIsUrbanVisible] = useState(true);
  const [popupInfo, setPopupInfo] = useState<TPopupInfo>(null);
  const [visibleUrbanAreas] = useState<string[]>([]);
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.8);
  const [isSatelliteGrayscale, setIsSatelliteGrayscale] = useState(false);

  const mapRef = useRef<MapRef>(null);

  const handleReset = () => {
    mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
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

        <label className="flex flex-col text-sm">
          위성사진 투명도 {satelliteOpacity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={satelliteOpacity}
            onChange={(e) => setSatelliteOpacity(Number(e.target.value))}
          />
        </label>
        <button
          onClick={() => setIsSatelliteGrayscale((prev) => !prev)}
          className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
        >
          {isSatelliteGrayscale ? '컬러' : '흑백'}
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
          transformRequest={transformRequest}
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
          <Fragment key={mapStyle}>
            <SatelliteLayer
              placement={MAP_STYLES[mapStyle].placement}
              opacity={satelliteOpacity}
              isGrayscale={isSatelliteGrayscale}
              bounds={SEOUL_BOUNDS}
            />
            <ImageLayer placement={MAP_STYLES[mapStyle].placement} />
          </Fragment>

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

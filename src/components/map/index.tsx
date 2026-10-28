'use client';

import { useRef, useState } from 'react';
import MapGL, {
  type MapRef,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/mapbox';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import bbox from '@turf/bbox';
import type { Feature, Polygon } from 'geojson';

import 'mapbox-gl/dist/mapbox-gl.css';
import DrawControl, {
  checkShape,
  EMPTY_SHAPE,
  type TShape,
} from './DrawControl';
import DrawRectangle from './DrawRectangle';
import { DRAW_STYLES } from './drawStyles';

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

/** 서울 영역 사각형. (서,남) → (동,남) → (동,북) → (서,북) → 첫 점으로 닫기 */
const SEOUL_FEATURE: Feature<Polygon> = {
  type: 'Feature',
  properties: { name: 'seoul' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [126.76, 37.41],
        [127.18, 37.41],
        [127.18, 37.7],
        [126.76, 37.7],
        [126.76, 37.41],
      ],
    ],
  },
};

/** 플로팅 패널(왼쪽 300px)에 가리지 않게 영역을 맞춘다 */
const FIT_PADDING = { top: 20, right: 20, bottom: 20, left: 320 };

export default function Map() {
  const [mapStyle, setMapStyle] = useState<TMapStyle>('standard');
  const [shape, setShape] = useState<TShape>(EMPTY_SHAPE);
  // 지도 밖 버튼에서도 명령해야 하므로 Draw는 부모가 처음 한 번만 만들어 DrawControl에 넘긴다
  const [draw] = useState(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle,
        },
        styles: DRAW_STYLES,
        // 내가 단 속성(invalid)을 스타일에서 user_invalid로 읽을 수 있게 한다
        userProperties: true,
      })
  );

  const mapRef = useRef<MapRef>(null);

  const handleReset = () => {
    mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  const handleLoadSeoul = () => {
    // AOI는 하나만이므로 기존 도형을 비우고 넣는다
    draw.deleteAll();
    draw.add(SEOUL_FEATURE);

    // draw.add/deleteAll은 draw.create 등 이벤트를 내지 않으므로 직접 다시 읽는다
    setShape(checkShape(draw));

    const [west, south, east, north] = bbox(SEOUL_FEATURE);
    mapRef.current?.fitBounds([west, south, east, north], {
      padding: FIT_PADDING,
      retainPadding: false,
    });
  };

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 h-full w-full">
      {/* Map container */}
      <div className="relative w-full">
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
          <DrawControl draw={draw} onShapeChange={setShape} />
          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-left" />
        </MapGL>

        {/* Floating panel over the map */}
        <div className="absolute top-0 bottom-0 left-0 z-10 w-75 bg-white/60 p-4 backdrop-blur-sm">
          <h2 className="text-lg font-bold">패널</h2>
          <button
            onClick={handleReset}
            className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
          >
            Reset
          </button>

          <button
            onClick={() => {
              draw.changeMode('draw_rectangle');
            }}
          >
            직사각형 그리기
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

          <button
            onClick={handleLoadSeoul}
            className="bg-black text-white p-2 rounded-md h-fit w-20 cursor-pointer"
          >
            서울 불러오기
          </button>
          <p>면적: {shape.area.toFixed(1)} ㎢</p>
          {shape.error === 'geometry' && (
            <p className="text-red-600">선이 꼬였습니다</p>
          )}
          {shape.error === 'area' && (
            <p className="text-red-600">최소 25㎢ 이상 그려야 합니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';

const SOURCE_ID = 'cities';
const LAYER_FILL_ID = 'cities-fill';
const LAYER_LINE_ID = 'cities-line';

const SEOUL_BOUNDS = [
  [
    [126.76, 37.41],
    [127.18, 37.41],
    [127.18, 37.7],
    [126.76, 37.7],
    [126.76, 37.41],
  ],
];

const SEOUL_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '서울' },
      geometry: { type: 'Polygon', coordinates: SEOUL_BOUNDS },
    },
  ],
};

/** 스타일 설계도(JSON)가 도착했는지. 타일 로딩 여부는 보지 않는다 */
function isStyleReady(map: mapboxgl.Map) {
  return Boolean(map.style?._loaded);
}

export function UrbanAreasLayer({ map }: { map: mapboxgl.Map }) {
  useEffect(() => {
    let isMapRemoved = false;

    const add = () => {
      if (!isStyleReady(map)) return; // 아직 설계도 없음 → style.load 때 다시 온다

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: SEOUL_GEOJSON,
        });
      }
      if (!map.getLayer(LAYER_FILL_ID)) {
        map.addLayer({
          id: LAYER_FILL_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: { 'fill-color': '#ff4c4c', 'fill-opacity': 0.4 },
        });
      }
      if (!map.getLayer(LAYER_LINE_ID)) {
        map.addLayer({
          id: LAYER_LINE_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: { 'line-color': '#000000', 'line-width': 2 },
        });
      }
    };

    const handleRemove = () => {
      isMapRemoved = true;
    };

    add(); // ① 이미 준비된 지도에 마운트된 경우
    map.on('style.load', add); // ② 첫 로드 전이었거나, setStyle로 지워진 경우
    map.on('remove', handleRemove); // ③ 부모가 지도를 먼저 파괴하는 경우 대비

    return () => {
      map.off('style.load', add);
      map.off('remove', handleRemove);

      if (isMapRemoved || !isStyleReady(map)) return;

      if (map.getLayer(LAYER_FILL_ID)) map.removeLayer(LAYER_FILL_ID); // 레이어 먼저
      if (map.getLayer(LAYER_LINE_ID)) map.removeLayer(LAYER_LINE_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); // 소스는 나중
    };
  }, [map]);

  return null;
}

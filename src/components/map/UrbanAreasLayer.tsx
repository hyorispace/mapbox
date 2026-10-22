import { useEffect } from 'react';

const SOURCE_ID = 'cities';
const LAYER_ID = 'cities-circle';

const CITIES = {
  서울: { center: [126.978, 37.5665], zoom: 10.5 },
  부산: { center: [129.0756, 35.1796], zoom: 10.5 },
  제주: { center: [126.55, 33.38], zoom: 9.3 },
} as const;

const CITIES_GEOJSON = {
  type: 'FeatureCollection',
  features: Object.entries(CITIES).map(([name, { center }]) => ({
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Point', coordinates: center },
  })),
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
          data: CITIES_GEOJSON,
        });
      }
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: { 'circle-color': '#ff0000', 'circle-radius': 4 },
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

      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID); // 레이어 먼저
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); // 소스는 나중
    };
  }, [map]);

  return null;
}

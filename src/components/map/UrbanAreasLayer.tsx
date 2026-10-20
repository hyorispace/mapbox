import { useEffect } from 'react';

import mapboxgl from 'mapbox-gl';

const SOURCE_ID = 'urban-areas';
const LAYER_ID = 'urban-areas-fill';

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
          data: 'https://docs.mapbox.com/mapbox-gl-js/assets/ne_50m_urban_areas.geojson',
        });
      }
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: { 'fill-color': '#f08', 'fill-opacity': 0.4 },
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
  }, []);

  return null;
}

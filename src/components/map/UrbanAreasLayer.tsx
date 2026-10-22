import { useEffect } from 'react';

const SOURCE_ID = 'cities';
const LAYER_FILL_ID = 'cities-fill';
const LAYER_LINE_ID = 'cities-line';

const SEOUL_BOUNDS = [126.76, 37.41, 127.18, 37.7];
const BUSAN_BOUNDS = [128.85, 35.05, 129.3, 35.4];
const JEJU_BOUNDS = [126.15, 33.15, 126.97, 33.57];

const POLYGON_COORDINATES_DATA = {
  seoul: [
    [
      [SEOUL_BOUNDS[0], SEOUL_BOUNDS[1]],
      [SEOUL_BOUNDS[2], SEOUL_BOUNDS[1]],
      [SEOUL_BOUNDS[2], SEOUL_BOUNDS[3]],
      [SEOUL_BOUNDS[0], SEOUL_BOUNDS[3]],
      [SEOUL_BOUNDS[0], SEOUL_BOUNDS[1]],
    ],
  ],
  busan: [
    [
      [BUSAN_BOUNDS[0], BUSAN_BOUNDS[1]],
      [BUSAN_BOUNDS[2], BUSAN_BOUNDS[1]],
      [BUSAN_BOUNDS[2], BUSAN_BOUNDS[3]],
      [BUSAN_BOUNDS[0], BUSAN_BOUNDS[3]],
      [BUSAN_BOUNDS[0], BUSAN_BOUNDS[1]],
    ],
  ],
  jeju: [
    [
      [JEJU_BOUNDS[0], JEJU_BOUNDS[1]],
      [JEJU_BOUNDS[2], JEJU_BOUNDS[1]],
      [JEJU_BOUNDS[2], JEJU_BOUNDS[3]],
      [JEJU_BOUNDS[0], JEJU_BOUNDS[3]],
      [JEJU_BOUNDS[0], JEJU_BOUNDS[1]],
    ],
  ],
};

const getGeoJSON = (name: string, polygonCoordinates: number[][][]) => {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name },
        geometry: { type: 'Polygon', coordinates: polygonCoordinates },
      },
    ],
  };
};

/** 스타일 설계도(JSON)가 도착했는지. 타일 로딩 여부는 보지 않는다 */
function isStyleReady(map: mapboxgl.Map) {
  return Boolean(map.style?._loaded);
}

type TProps = {
  map: mapboxgl.Map;
  urbanArea: 'seoul' | 'busan' | 'jeju';
};

export function UrbanAreasLayer({ map, urbanArea }: TProps) {
  useEffect(() => {
    let isMapRemoved = false;

    const add = () => {
      if (!isStyleReady(map)) return; // 아직 설계도 없음 → style.load 때 다시 온다

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: getGeoJSON(urbanArea, POLYGON_COORDINATES_DATA.seoul),
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

  useEffect(() => {
    map
      .getSource<mapboxgl.GeoJSONSource>(SOURCE_ID)
      ?.setData(getGeoJSON(urbanArea, POLYGON_COORDINATES_DATA[urbanArea]));
  }, [map, urbanArea]);

  return null;
}

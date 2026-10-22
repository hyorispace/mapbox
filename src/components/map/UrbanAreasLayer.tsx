import { useEffect, useEffectEvent } from 'react';
import type { FeatureCollection } from 'geojson';

const SOURCE_ID = 'cities';
const LAYER_FILL_ID = 'cities-fill';
const LAYER_LINE_ID = 'cities-line';

/** 도시별 영역 [서, 남, 동, 북] */
const URBAN_AREA_BOUNDS = {
  seoul: [126.76, 37.41, 127.18, 37.7],
  busan: [128.85, 35.05, 129.3, 35.4],
  jeju: [126.15, 33.15, 126.97, 33.57],
} as const;

export type TUrbanArea = keyof typeof URBAN_AREA_BOUNDS;

/** bbox를 사각형 Polygon 하나가 담긴 FeatureCollection으로 바꾼다 */
function bboxToGeoJSON(
  name: string,
  [west, south, east, north]: readonly number[]
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'Polygon',
          // (서,남) → (동,남) → (동,북) → (서,북) → 첫 점으로 닫기
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  };
}

function getUrbanAreaGeoJSON(urbanArea: TUrbanArea) {
  return bboxToGeoJSON(urbanArea, URBAN_AREA_BOUNDS[urbanArea]);
}

/** 스타일 설계도(JSON)가 도착했는지. 타일 로딩 여부는 보지 않는다 */
function isStyleReady(map: mapboxgl.Map) {
  return Boolean(map.style?._loaded);
}

type TProps = {
  map: mapboxgl.Map;
  urbanArea: TUrbanArea;
  fillColor: string;
  isVisible: boolean;
};

export function UrbanAreasLayer({
  map,
  urbanArea,
  fillColor,
  isVisible,
}: TProps) {
  // 호출되는 순간의 최신 props로 소스·레이어를 만든다 (처음 마운트, 스타일 전환 모두)
  const add = useEffectEvent(() => {
    if (!isStyleReady(map)) return; // 아직 설계도 없음 → style.load 때 다시 온다

    const visibility = isVisible ? 'visible' : 'none';

    const firstLabelId = map
      .getStyle()
      .layers.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

    const hasMiddleSlot = map.getSlots()?.includes('middle');

    const placement = hasMiddleSlot
      ? { slot: 'middle', beforeId: undefined } // Standard: 칸에 넣기
      : { slot: undefined, beforeId: firstLabelId };

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: getUrbanAreaGeoJSON(urbanArea),
      });
    }
    if (!map.getLayer(LAYER_FILL_ID)) {
      map.addLayer(
        {
          id: LAYER_FILL_ID,
          type: 'fill',
          source: SOURCE_ID,
          layout: { visibility },
          ...(placement.slot && { slot: placement.slot }),
          paint: { 'fill-color': fillColor, 'fill-opacity': 0.4 },
        },
        placement.beforeId
      );
    }
    if (!map.getLayer(LAYER_LINE_ID)) {
      map.addLayer(
        {
          id: LAYER_LINE_ID,
          type: 'line',
          source: SOURCE_ID,
          layout: { visibility },
          ...(placement.slot && { slot: placement.slot }),
          paint: { 'line-color': '#000000', 'line-width': 2 },
        },
        placement.beforeId
      );
    }
  });

  // 만들기·정리: 지도가 바뀔 때만 다시 돈다. props가 바뀌어도 레이어를 지웠다 만들지 않는다
  useEffect(() => {
    let isMapRemoved = false;

    // map.off가 같은 참조를 지우도록 effect 안에서 래퍼를 만든다
    const handleStyleLoad = () => add();
    const handleRemove = () => {
      isMapRemoved = true;
    };

    add(); // ① 이미 준비된 지도에 마운트된 경우
    map.on('style.load', handleStyleLoad); // ② 첫 로드 전이었거나, setStyle로 지워진 경우
    map.on('remove', handleRemove); // ③ 부모가 지도를 먼저 파괴하는 경우 대비

    return () => {
      map.off('style.load', handleStyleLoad);
      map.off('remove', handleRemove);

      if (isMapRemoved || !isStyleReady(map)) return;

      if (map.getLayer(LAYER_FILL_ID)) map.removeLayer(LAYER_FILL_ID); // 레이어 먼저
      if (map.getLayer(LAYER_LINE_ID)) map.removeLayer(LAYER_LINE_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); // 소스는 나중
    };
  }, [map]);

  // 바꾸기: 이미 있는 소스·레이어에 바뀐 부분만 반영한다. 아직 없으면 add()가 최신 값으로 만든다
  useEffect(() => {
    map
      .getSource<mapboxgl.GeoJSONSource>(SOURCE_ID)
      ?.setData(getUrbanAreaGeoJSON(urbanArea));
  }, [map, urbanArea]);

  useEffect(() => {
    if (map.getLayer(LAYER_FILL_ID)) {
      map.setPaintProperty(LAYER_FILL_ID, 'fill-color', fillColor);
    }
  }, [map, fillColor]);

  useEffect(() => {
    const visibility = isVisible ? 'visible' : 'none';

    for (const layerId of [LAYER_FILL_ID, LAYER_LINE_ID]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  }, [map, isVisible]);

  return null;
}

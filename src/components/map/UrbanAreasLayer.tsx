import { Layer, Source } from 'react-map-gl/mapbox';
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

/** 레이어를 끼울 자리. Standard는 slot, 클래식은 첫 라벨 레이어 바로 아래 */
export type TLayerPlacement = { slot: 'middle' } | { beforeId: string };

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

type TProps = {
  urbanArea: TUrbanArea;
  fillColor: string;
  isVisible: boolean;
  placement: TLayerPlacement;
};

/**
 * 생성·정리·스타일 전환 복원·부분 갱신은 react-map-gl의 Source/Layer가 맡는다.
 * - data가 바뀌면 Source가 setData를 부른다
 * - paint/layout이 바뀌면 Layer가 바뀐 키만 setPaintProperty/setLayoutProperty 한다
 * - setStyle로 지워지면 styledata 때 지금 props로 다시 만든다
 */
export function UrbanAreasLayer({
  urbanArea,
  fillColor,
  isVisible,
  placement,
}: TProps) {
  const visibility = isVisible ? 'visible' : 'none';

  return (
    <Source
      id={SOURCE_ID}
      type="geojson"
      data={getUrbanAreaGeoJSON(urbanArea)}
    >
      <Layer
        id={LAYER_FILL_ID}
        type="fill"
        layout={{ visibility }}
        paint={{ 'fill-color': fillColor, 'fill-opacity': 0.4 }}
        {...placement}
      />
      <Layer
        id={LAYER_LINE_ID}
        type="line"
        layout={{ visibility }}
        paint={{ 'line-color': '#000000', 'line-width': 2 }}
        {...placement}
      />
    </Source>
  );
}

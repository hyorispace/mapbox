import { useControl } from 'react-map-gl/mapbox';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import turfArea from '@turf/area';
import kinks from '@turf/kinks';
import type { Feature, Polygon } from 'geojson';

import { INVALID_PROPERTY } from './drawStyles';

/** 위성 촬영 최소 주문 면적 (㎢) */
const MIN_AREA_KM2 = 25;

/** 쓸 수 없는 도형의 이유. null이면 문제없다 */
export type TDrawError = 'area' | 'geometry' | null;

/** 지금 그려진 도형의 상태 */
export type TShape = {
  /** 면적(㎢, 반올림 전 값). 도형이 없으면 0 */
  area: number;
  error: TDrawError;
};

export const EMPTY_SHAPE: TShape = { area: 0, error: null };

function isPolygonFeature(feature: Feature): feature is Feature<Polygon> {
  return feature.geometry.type === 'Polygon';
}

/**
 * Draw에 지금 그려진 도형의 면적과 오류를 계산한다.
 * 도형의 주인은 Draw이므로, 사용자가 그렸든 코드로 넣었든 바뀐 뒤에 이걸로 다시 읽는다.
 */
function readShape(draw: MapboxDraw): TShape {
  const feature = draw.getAll().features.at(-1);

  // 마지막 도형을 지웠으면 빈 상태다
  if (!feature || !isPolygonFeature(feature)) {
    return EMPTY_SHAPE;
  }

  const area = turfArea(feature) / 1_000_000;

  // 꼬인 도형은 고리끼리 면적이 상쇄돼 면적 값을 믿을 수 없으므로 먼저 본다
  if (kinks(feature).features.length > 0) {
    return { area, error: 'geometry' };
  }

  // 반올림하지 않은 값으로 비교한다
  if (area < MIN_AREA_KM2) {
    return { area, error: 'area' };
  }

  return { area, error: null };
}

/**
 * 도형을 다시 읽고, 잘못된 도형이면 스타일이 빨갛게 그리도록 속성을 단다.
 * 도형이 바뀐 뒤에는 readShape 대신 이걸 부른다.
 */
export function checkShape(draw: MapboxDraw): TShape {
  const shape = readShape(draw);
  const feature = draw.getAll().features.at(-1);

  if (typeof feature?.id === 'string') {
    // setFeatureProperty는 draw.update를 내지 않으므로 update 핸들러 안에서 불러도 반복되지 않는다
    draw.setFeatureProperty(feature.id, INVALID_PROPERTY, shape.error !== null);
  }

  return shape;
}

type TProps = {
  /** 부모가 처음 한 번 만들어 넘긴다. 버튼 등 지도 밖에서도 Draw에 명령해야 하기 때문이다 */
  draw: MapboxDraw;
  onShapeChange: (shape: TShape) => void;
};

export default function DrawControl({ draw, onShapeChange }: TProps) {
  const syncShape = () => {
    onShapeChange(checkShape(draw));
  };

  // AOI는 하나만: 방금 그린 도형만 남기고 나머지는 지운다
  const handleCreate = (e: DrawCreateEvent) => {
    const keepIds = new Set(e.features.map((feature) => feature.id));
    const removeIds = draw
      .getAll()
      .features.map((feature) => feature.id)
      .filter((id): id is string => typeof id === 'string' && !keepIds.has(id));

    // api.delete는 draw.delete 이벤트를 내지 않으므로 아래에서 직접 다시 맞춘다
    draw.delete(removeIds);
    syncShape();
  };

  useControl(
    () => draw,
    ({ map }) => {
      map.on('draw.create', handleCreate);
      map.on('draw.update', syncShape);
      map.on('draw.delete', syncShape);
    },
    ({ map }) => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', syncShape);
      map.off('draw.delete', syncShape);
    },
    { position: 'top-right' }
  );

  return null;
}

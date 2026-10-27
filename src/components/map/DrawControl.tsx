import { useState } from 'react';
import { useControl } from 'react-map-gl/mapbox';
import MapboxDraw, { type DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import turfArea from '@turf/area';
import kinks from '@turf/kinks';
import type { Feature, Polygon } from 'geojson';

/** 위성 촬영 최소 주문 면적 (㎢) */
const MIN_AREA_KM2 = 25;

/** 쓸 수 없는 도형의 이유. null이면 문제없다 */
export type TDrawError = 'area' | 'geometry' | null;

type TProps = {
  /** 그린 도형의 면적(㎢, 반올림 전 값). 도형이 없으면 0 */
  setArea: (area: number) => void;
  setError: (error: TDrawError) => void;
};

function isPolygonFeature(feature: Feature): feature is Feature<Polygon> {
  return feature.geometry.type === 'Polygon';
}

export default function DrawControl({ setArea, setError }: TProps) {
  // 핸들러가 draw를 읽어야 해서 useControl보다 먼저, 처음 한 번만 만든다
  const [draw] = useState(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      })
  );

  // 도형의 주인은 Draw다. 바뀔 때마다 Draw에서 지금 도형을 읽어 면적과 오류를 다시 계산한다
  const syncShape = () => {
    const feature = draw.getAll().features.at(-1);

    // 마지막 도형을 지웠으면 빈 상태로 돌린다
    if (!feature || !isPolygonFeature(feature)) {
      setArea(0);
      setError(null);
      return;
    }

    const areaKm2 = turfArea(feature) / 1_000_000;
    setArea(areaKm2);

    // 꼬인 도형은 고리끼리 면적이 상쇄돼 면적 값을 믿을 수 없으므로 먼저 본다
    if (kinks(feature).features.length > 0) {
      setError('geometry');
      return;
    }

    // 반올림하지 않은 값으로 비교한다
    if (areaKm2 < MIN_AREA_KM2) {
      setError('area');
      return;
    }

    setError(null);
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

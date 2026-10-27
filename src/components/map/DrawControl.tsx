import { useState } from 'react';
import { useControl } from 'react-map-gl/mapbox';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import turfArea from '@turf/area';
import { Geometry } from 'geojson';
import kinks from '@turf/kinks';

type TProps = {
  /** 그려진 도형 개수가 바뀔 수 있을 때마다 지금 개수를 알려준다 */
  setArea: (area: number) => void;
  setError: (error: 'area' | 'geometry' | null) => void;
};
const km2 = (geometry: Geometry) => turfArea(geometry) / 1_000_000;

export default function DrawControl({ setArea, setError }: TProps) {
  // 핸들러가 draw를 읽어야 해서 useControl보다 먼저, 처음 한 번만 만든다
  const [draw] = useState(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      })
  );

  const deleteAll = () => {
    // Draw에서 방금 그린 id만 남기고 나머지는 지운다
    const features = draw.getAll().features;
    const id = features.slice(0, -1).map((feature) => feature.id);
    draw.delete(id as string[]);

    syncCount();
  };

  // 도형의 주인은 Draw다. 직접 세지 않고, 바뀔 때마다 Draw에게 지금 개수를 물어본다
  const syncCount = () => {
    const features = draw.getAll().features;
    const geometry = features[features.length - 1].geometry;
    const area = Math.round(km2(geometry));
    setArea(area);

    if (area < 25) {
      setError('area');
      return;
    }
    // kinks는 선·다각형만 받는다. Draw는 Geometry를 돌려줘서 Point까지 포함된다.
    if (
      (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') &&
      kinks(geometry).features.length > 0
    ) {
      setError('geometry');
      return;
    }

    setError(null);
  };

  useControl(
    () => draw,
    ({ map }) => {
      map.on('draw.create', deleteAll);
      map.on('draw.update', syncCount);
      map.on('draw.delete', syncCount);
    },
    ({ map }) => {
      map.off('draw.create', deleteAll);
      map.off('draw.update', syncCount);
      map.off('draw.delete', syncCount);
    },
    { position: 'top-right' }
  );

  return null;
}

import MapboxDraw, { DrawMode } from '@mapbox/mapbox-gl-draw';
import { useRef } from 'react';
import { ControlPosition, MapRef, useControl } from 'react-map-gl/mapbox';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  onCreate?: (e: { features: object[] }) => void;
  onUpdate?: (e: { features: object[]; action: string }) => void;
  onDelete?: (e: { features: object[] }) => void;
};

type Geometry = {
  coordinates: [number, number][][];
};

const DrawControl = ({
  onCreate = () => {},
  onUpdate = () => {},
  onDelete = () => {},
  ...props
}: DrawControlProps) => {
  const drawRef = useRef<MapboxDraw>(new MapboxDraw(props));

  const onModeChange = (e: { mode: DrawMode }) => {
    const { features } = drawRef.current.getAll();
    if (
      e.mode === 'draw_polygon' &&
      (features[0].geometry as unknown as Geometry).coordinates[0][0]
    ) {
      drawRef.current.deleteAll().changeMode('draw_polygon');
    }
  };

  useControl<MapboxDraw>(
    () => drawRef.current,
    ({ map }: { map: MapRef }) => {
      map.on('draw.create', onCreate);
      map.on('draw.update', onUpdate);
      map.on('draw.delete', onDelete);
      map.on('draw.modechange', onModeChange);
    },
    ({ map }: { map: MapRef }) => {
      map.off('draw.create', onCreate);
      map.off('draw.update', onUpdate);
      map.off('draw.delete', onDelete);
      map.off('draw.modechange', onModeChange);
    },
    {
      position: props.position,
    }
  );

  return null;
};

export default DrawControl;

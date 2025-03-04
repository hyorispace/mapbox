import MapboxDraw, { DrawMode } from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useCallback } from "react";
import { ControlPosition, MapRef, useControl } from "react-map-gl/mapbox";
import noop from "../../utils/noop";

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
  onCreate = noop,
  onUpdate = noop,
  onDelete = noop,
  ...props
}: DrawControlProps) => {
  const draw = useControl<MapboxDraw>(
    () => new MapboxDraw(props),
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", onCreate);
      map.on("draw.update", onUpdate);
      map.on("draw.delete", onDelete);
      map.on("draw.modechange", onModeChange);
    },
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", onCreate);
      map.off("draw.update", onUpdate);
      map.off("draw.delete", onDelete);
      map.off("draw.modechange", onModeChange);
    },
    {
      position: props.position,
    }
  );

  const onModeChange = useCallback(
    (e: { mode: DrawMode }) => {
      const { features } = draw.getAll();
      if (
        e.mode === "draw_polygon" &&
        (features[0].geometry as unknown as Geometry).coordinates[0][0]
      ) {
        draw.deleteAll().changeMode("draw_polygon");
      }
    },
    [draw]
  );

  return null;
};

export default DrawControl;

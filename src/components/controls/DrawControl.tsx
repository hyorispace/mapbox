import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { ControlPosition, MapRef, useControl } from "react-map-gl/mapbox";
import noop from "../../utils/noop";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  onCreate?: (e: { features: object[] }) => void;
  onUpdate?: (e: { features: object[]; action: string }) => void;
  onDelete?: (e: { features: object[] }) => void;
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
    },
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", onCreate);
      map.off("draw.update", onUpdate);
      map.off("draw.delete", onDelete);
    },
    {
      position: props.position,
    }
  );

  return (
    <div className="absolute top-14 left-[10px] flex gap-[10px]">
      <button
        className="cursor-pointer rounded-[5px] bg-white w-10 h-10 flex justify-center items-center border border-[#bdcfe0]"
        onClick={() => {
          draw.deleteAll().changeMode("draw_polygon");
        }}
      >
        <img src="/rect.svg" className="w-5 h-5" />
      </button>
      <button
        className="cursor-pointer rounded-[5px] bg-white w-10 h-10 flex justify-center items-center border border-[#bdcfe0]"
        onClick={() => {
          draw.deleteAll().changeMode("simple_select");
        }}
      >
        <img src="/trash.svg" className="w-5 h-5" />
      </button>
    </div>
  );
};

export default DrawControl;

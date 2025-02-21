import { Marker as MapMarker } from "react-map-gl/mapbox";
import { Pos } from "../types/map";

type MarkerProps = Pos & {
  onMarkerClick?: ({ longitude, latitude }: Pos) => void;
};

const Marker = ({ onMarkerClick, ...pos }: MarkerProps) => {
  return (
    <MapMarker
      {...pos}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onMarkerClick?.(pos);
      }}
    >
      <span className="bg-orange-400/50 rounded-full p-2 w-fit h-fit block">
        <span className="text-white text-lg p-4 bg-orange-400 rounded-full block">
          마커
        </span>
      </span>
    </MapMarker>
  );
};

export default Marker;

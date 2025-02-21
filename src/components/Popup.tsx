import { Popup as MapPopup } from "react-map-gl/mapbox";
import { Pos } from "../types/map";

type PopupProps = Pos & {
  onClose?: () => void;
};

const Popup = ({ onClose, ...pos }: PopupProps) => {
  return (
    <MapPopup
      {...pos}
      closeButton={false}
      closeOnClick={true}
      onClose={onClose}
      anchor="top"
    >
      <div className="p-4">
        <h4>할룽</h4>
        <p>여기는 팝업입니다!</p>
      </div>
    </MapPopup>
  );
};

export default Popup;

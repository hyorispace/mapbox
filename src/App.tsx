import Map, {
  FullscreenControl,
  GeolocateControl,
  MapRef,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRef } from "react";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import drawOptions from "./constants/drawOptions";
import DrawControl from "./components/controls/DrawControl";

function App() {
  // const [selectedLocation, setSelectedLocation] = useState<{
  //   longitude: number;
  //   latitude: number;
  // } | null>(null);

  const mapRef = useRef<MapRef>(null);

  // const handleMarkerClick = (pos: Pos) => {
  //   setSelectedLocation(
  //     pos.longitude === selectedLocation?.longitude &&
  //       pos.latitude === selectedLocation.latitude
  //       ? null
  //       : pos
  //   );
  // };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 126.978, // 서울 경도
          latitude: 37.5665, // 서울 위도
          zoom: 10,
          bearing: 0, // 회전 각도 (0도)
          pitch: 0, // 기울기 (0도)
        }}
        mapboxAccessToken="pk.eyJ1IjoiaHlvcmlib2dvIiwiYSI6ImNtN2UyNnluZzBhbHAyaXIwcnp2Z20zamIifQ.RHqv-yu6nlFY2aFIHLHh3Q"
        mapStyle="mapbox://styles/mapbox/streets-v12"
        projection="globe"
        style={{ width: "1048px", height: "500px" }}
      >
        <DrawControl position="top-left" {...drawOptions} />
      </Map>
    </div>
  );
}

export default App;

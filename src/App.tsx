import Map, {
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";
import Marker from "./components/Marker";
import Popup from "./components/Popup";
import { Pos } from "./types/map";

function App() {
  const [viewport, setViewport] = useState({
    longitude: 126.978, // 서울 경도
    latitude: 37.5665, // 서울 위도
    zoom: 10,
    bearing: 0, // 회전 각도 (0도)
    pitch: 0, // 기울기 (0도)
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const handleMarkerClick = (pos: Pos) => {
    setSelectedLocation(
      pos.longitude === selectedLocation?.longitude &&
        pos.latitude === selectedLocation.latitude
        ? null
        : pos
    );
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken="pk.eyJ1IjoiaHlvcmlib2dvIiwiYSI6ImNtN2UyNnluZzBhbHAyaXIwcnp2Z20zamIifQ.RHqv-yu6nlFY2aFIHLHh3Q"
        mapStyle="mapbox://styles/mapbox/streets-v12"
        projection="globe"
      >
        {/* 🔹 마커 추가 (서울 시청 위치) */}
        <Marker
          longitude={126.978}
          latitude={37.5665}
          onMarkerClick={handleMarkerClick}
        />

        {/* 🔹 강남역 위치에 마커 추가 */}
        <Marker
          longitude={127.0276}
          latitude={37.4979}
          onMarkerClick={handleMarkerClick}
        />

        {selectedLocation && (
          <Popup
            {...selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        )}

        <NavigationControl position="bottom-left" />
        <FullscreenControl position="bottom-left" />
        <GeolocateControl position="bottom-left" />
      </Map>
    </div>
  );
}

export default App;

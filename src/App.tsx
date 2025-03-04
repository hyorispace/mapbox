import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import drawOptions from "./constants/drawOptions";
import DrawControl from "./components/controls/DrawControl";
import GeocoderControl from "./components/controls/GeocoderControl";

const TOKEN =
  "pk.eyJ1IjoiaHlvcmlib2dvIiwiYSI6ImNtN2UyNnluZzBhbHAyaXIwcnp2Z20zamIifQ.RHqv-yu6nlFY2aFIHLHh3Q";

function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Map
        initialViewState={{
          longitude: 126.978,
          latitude: 37.5665,
          zoom: 10,
          bearing: 0,
          pitch: 0,
        }}
        mapboxAccessToken={TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        projection="globe"
        style={{ width: "1048px", height: "500px" }}
      >
        <GeocoderControl mapboxAccessToken={TOKEN} position="top-left" />
        <DrawControl position="top-left" {...drawOptions} />
      </Map>
    </div>
  );
}

export default App;

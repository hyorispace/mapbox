import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Map
        mapboxAccessToken="pk.eyJ1IjoiaHlvcmlib2dvIiwiYSI6ImNtN2UyNnluZzBhbHAyaXIwcnp2Z20zamIifQ.RHqv-yu6nlFY2aFIHLHh3Q"
        initialViewState={{
          longitude: 126.978,
          latitude: 37.5665,
          zoom: 10,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      />
    </div>
  );
}

export default App;

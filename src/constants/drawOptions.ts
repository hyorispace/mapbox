import { MapboxDrawOptions } from "@mapbox/mapbox-gl-draw";

const drawOptions: MapboxDrawOptions = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true,
  },
  styles: [
    {
      id: "gl-draw-line",
      type: "line",
      filter: ["all", ["==", "$type", "LineString"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "rgba(30, 210, 185, 0.50)",
        "line-width": 1,
      },
    },
    {
      id: "gl-draw-polygon-fill",
      type: "fill",
      filter: ["all", ["==", "$type", "Polygon"]],
      paint: {
        "fill-color": "rgb(30, 210, 185)",
        "fill-outline-color": "rgb(30, 210, 185)",
        "fill-opacity": 0.3,
      },
    },
    {
      id: "gl-draw-polygon-midpoint",
      type: "circle",
      filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
      layout: {
        visibility: "none",
      },
    },
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: ["all", ["==", "$type", "Polygon"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "rgba(30, 210, 185, 0.50)",
        "line-width": 1,
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-halo-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: {
        "circle-radius": 8,
        "circle-color": "rgba(30, 210, 185, 0.50)",
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: {
        "circle-radius": 6,
        "circle-color": "#fff",
      },
    },
  ],
};

export default drawOptions;

import { Layer, Source } from 'react-map-gl/mapbox';
import { TLayerPlacement } from './UrbanAreasLayer';

type TProps = {
  placement: TLayerPlacement;
};

export default function ImageLayer({ placement }: TProps) {
  return (
    <Source
      id="my-image"
      type="image"
      url="https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif"
      coordinates={[
        [-80.425, 46.437], // 왼쪽 위
        [-71.516, 46.437], // 오른쪽 위
        [-71.516, 37.936], // 오른쪽 아래
        [-80.425, 37.936], // 왼쪽 아래
      ]}
    >
      <Layer
        id="my-image-layer"
        type="raster"
        paint={{ 'raster-opacity': 0.8 }}
        {...placement}
      />
    </Source>
  );
}

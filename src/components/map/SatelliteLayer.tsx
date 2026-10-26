import { Layer, Source } from 'react-map-gl/mapbox';
import type { TLayerPlacement } from './UrbanAreasLayer';

type TProps = {
  placement: TLayerPlacement;
  /** 0(투명) ~ 1(불투명) */
  opacity: number;
  isGrayscale: boolean;
  /**
   * 위성사진을 보여줄 범위 [서, 남, 동, 북]. 이 밖의 타일은 요청하지 않는다.
   * 생성 후에는 바꿀 수 없으므로(react-map-gl이 갱신을 지원하지 않는다) 바꾸려면 key로 다시 마운트한다.
   */
  bounds?: [number, number, number, number];
};

export default function SatelliteLayer({
  placement,
  opacity,
  isGrayscale,
  bounds,
}: TProps) {
  return (
    <Source
      id="satellite"
      type="raster"
      url="mapbox://mapbox.satellite"
      tileSize={256}
      bounds={bounds}
    >
      <Layer
        id="satellite-layer"
        type="raster"
        paint={{
          'raster-opacity': opacity,
          // -1이면 채도를 모두 빼서 흑백, 0이면 원래 색
          'raster-saturation': isGrayscale ? -1 : 0,
        }}
        {...placement}
      />
    </Source>
  );
}

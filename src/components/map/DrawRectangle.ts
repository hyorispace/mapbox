import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { DrawCustomMode, DrawPolygon } from '@mapbox/mapbox-gl-draw';
import type { LngLat } from 'mapbox-gl';
import type { Position } from 'geojson';

type TState = {
  /** 그리는 중인 사각형. 모드가 켜질 때 빈 도형으로 만들어 둔다 */
  rectangle: DrawPolygon;
  /** 첫 클릭한 모서리. 아직 안 찍었으면 null */
  start: LngLat | null;
};

/**
 * 마주 보는 두 모서리로 사각형의 네 꼭짓점을 만든다.
 * 어느 방향으로 끌었는지 모르니 min/max로 서·동·남·북을 정리한다.
 * Draw의 setCoordinates는 닫는 점을 넣지 않은 고리를 받는다.
 */
function toCorners(a: LngLat, b: LngLat): Position[][] {
  const west = Math.min(a.lng, b.lng);
  const east = Math.max(a.lng, b.lng);
  const south = Math.min(a.lat, b.lat);
  const north = Math.max(a.lat, b.lat);

  return [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ],
  ];
}

/** 클릭 두 번(마주 보는 두 모서리)으로 사각형을 그리는 모드 */
const DrawRectangle: DrawCustomMode<TState> = {
  onSetup() {
    const rectangle = this.newFeature({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[]] },
    }) as DrawPolygon;

    this.addFeature(rectangle);
    this.clearSelectedFeatures();
    // 두 번째 클릭을 빨리 하면 더블클릭 줌이 되므로 그리는 동안 끈다
    MapboxDraw.lib.doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: 'add' });

    return { rectangle, start: null };
  },

  onClick(state, e) {
    if (!state.start) {
      state.start = e.lngLat;
      return;
    }

    // 마우스를 움직이지 않고 바로 클릭할 수도 있으니 여기서도 좌표를 맞춘다
    state.rectangle.setCoordinates(toCorners(state.start, e.lngLat));
    this.changeMode('simple_select', { featureIds: [state.rectangle.id] });
  },

  onMouseMove(state, e) {
    // 첫 클릭 전에는 따라 그릴 사각형이 없다
    if (!state.start) return;

    state.rectangle.setCoordinates(toCorners(state.start, e.lngLat));
  },

  onKeyUp(_, e) {
    // 모드만 바꾸면 onStop이 미완성 도형을 지운다
    if (e.key === 'Escape') {
      this.changeMode('simple_select');
    }
  },

  onStop(state) {
    this.updateUIClasses({ mouse: 'none' });
    MapboxDraw.lib.doubleClickZoom.enable(this);

    // 기본 그리기 모드처럼 완성된 도형은 draw.create로 알린다. 직접 내지 않으면 아무도 모른다
    if (state.rectangle.isValid()) {
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()],
      });
    } else {
      this.deleteFeature(String(state.rectangle.id), { silent: true });
    }
  },

  toDisplayFeatures(state, geojson, display) {
    const isRectangle =
      geojson.type === 'Feature' && geojson.properties?.id === state.rectangle.id;

    // 첫 클릭 전의 빈 고리는 Draw가 [null]로 닫아 내보내 지도 워커가 깨지므로, 꼭짓점이 생기기 전엔 그리지 않는다
    if (isRectangle && !state.rectangle.isValid()) return;

    display(geojson);
  },
};

export default DrawRectangle;

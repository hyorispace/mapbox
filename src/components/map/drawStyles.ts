import MapboxDraw from '@mapbox/mapbox-gl-draw';

/** 잘못된 도형에 붙이는 속성 이름. userProperties가 켜져 있으면 스타일에서는 user_ 접두사가 붙는다 */
export const INVALID_PROPERTY = 'invalid';

const MINT = '#35d9c0';
const RED = '#ef4444';
/** Draw 기본 선택 색 */
const ORANGE = '#fbb03b';

/** 잘못된 도형은 선택 중이어도 빨강, 선택 중이면 주황, 나머지는 민트 */
const DRAW_COLOR = [
  'case',
  ['==', ['get', `user_${INVALID_PROPERTY}`], true],
  RED,
  ['==', ['get', 'active'], 'true'],
  ORANGE,
  MINT,
];

/** Draw 기본 스타일을 복사해서 도형 색만 바꾼다. 통째로 새로 쓰면 꼭짓점 등이 사라진다 */
export const DRAW_STYLES = MapboxDraw.lib.theme.map((layer) => {
  // @types의 id 목록이 1.5.1보다 옛날 거라서 string으로 넓혀서 비교한다
  const id: string = layer.id;

  if (id === 'gl-draw-polygon-fill') {
    return { ...layer, paint: { ...layer.paint, 'fill-color': DRAW_COLOR } };
  }
  if (id === 'gl-draw-lines') {
    return { ...layer, paint: { ...layer.paint, 'line-color': DRAW_COLOR } };
  }
  return layer;
});

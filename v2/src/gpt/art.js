/** Presentation only: no event creation, store writes, or changes to plot coordinates. */
export const PLACES = {
  hoian: { name: 'Hội An', subtitle: 'Một chiều bên sông', wall: '#dfb95f', roof: '#9c503c', wood: '#49382b', water: '#427f79', flower: '#b6537e', leaf: '#537c48' },
  kyoto: { name: 'Kyoto', subtitle: 'Những ngày thật chậm', wall: '#e6ddbd', roof: '#465755', wood: '#523f31', water: '#618d86', flower: '#e5abc0', leaf: '#71915a' },
  paris: { name: 'Paris', subtitle: 'Hẹn ở quán cà phê', wall: '#e1d4b7', roof: '#536270', wood: '#45534d', water: '#68868b', flower: '#bc645e', leaf: '#8c8b48' },
  colmar: { name: 'Colmar', subtitle: 'Ánh đèn bên ô cửa', wall: '#dfb5a3', roof: '#89564c', wood: '#584237', water: '#638a8d', flower: '#c58091', leaf: '#557a65' },
};
export const SEASONS = { spring: 'Mùa xuân', summer: 'Mùa hạ', autumn: 'Mùa thu', winter: 'Mùa đông' };
export const DEFAULT_APPEARANCE = { place: 'hoian', season: 'summer', weather: 'clear', light: 'golden', motion: true };
export function readAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem('dc-gpt-appearance') || '{}');
    return {
      place: PLACES[saved.place] ? saved.place : 'hoian',
      season: SEASONS[saved.season] ? saved.season : 'summer',
      weather: ['clear', 'rain'].includes(saved.weather) ? saved.weather : 'clear',
      light: ['golden', 'night', 'live'].includes(saved.light) ? saved.light : 'golden',
      motion: typeof saved.motion === 'boolean' ? saved.motion : true,
    };
  } catch { return { ...DEFAULT_APPEARANCE }; }
}
export function snowIn(a) { return a.season === 'winter' && a.place !== 'hoian'; }
export function architectureOf(building) {
  const floors = building.shape === 'tower' ? 3 : building.shape === 'house' ? 1 : 2;
  const width = building.shape === 'tower' ? 1.25 : building.shape === 'house' ? 1.7 : 2.25;
  return { floors, width, depth: 1.7, height: floors * 0.9, progress: Math.min(1, building.bricks.length / building.size) };
}
/** A labelled, read-only postcard. These objects NEVER enter buildCity or the event log. */
export function postcardCity(city) {
  const spots = [[-1, 0], [0, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [0, 1], [-1, 1]];
  const shapes = ['house', 'market', 'hall', 'house', 'temple', 'house', 'tower', 'market'];
  return { ...city, candidates: [], pile: [], residents: [], lanterns: [], statues: [], bricks: [],
    buildings: spots.map(([x, y], i) => ({ planId: `postcard-${i}`, plot: { x, y }, shape: shapes[i], style: 5, size: 8, bricks: Array.from({ length: 8 }, (_, j) => ({ id: `postcard-${i}-${j}`, sid: '', kind: 'plain' })) })),
  };
}

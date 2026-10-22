import CityCanvas from '../ui/CityCanvas.jsx';
import { GptScene } from './GptScene.js';

export default function GptCanvas(props) {
  return <CityCanvas {...props} Scene={GptScene} />;
}

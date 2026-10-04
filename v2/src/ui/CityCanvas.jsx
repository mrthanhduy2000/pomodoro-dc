import { useEffect, useMemo, useRef } from 'react';

import { CityScene } from '../city/CityScene.js';

/**
 * CityCanvas — mounts one CityScene and feeds it the model. The scene decides for itself whether a
 * new model needs a rebuild (it compares a signature), so passing the model on every render is cheap.
 */
export default function CityCanvas({
  city, categories, now, picking = false, selectedPlan = null, focusSid = null, dropSound = false, onPick, interactive = true,
  className = '', onScene = null, label = 'Thành phố',
}) {
  const canvasRef = useRef(null);
  const sceneLocal = useRef(null);
  const pickRef = useRef(onPick);
  const modelRef = useRef(null);

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    const scene = new CityScene(canvasRef.current, { onPick: (p) => pickRef.current?.(p), interactive });
    sceneLocal.current = scene;
    if (import.meta.env?.DEV) window.__cityScene = scene; // dev-only handle for measuring
    if (modelRef.current) scene.setModel(modelRef.current); // a re-created scene gets the last model
    onScene?.(scene);
    return () => {
      onScene?.(null);
      scene.dispose();
      sceneLocal.current = null;
    };
  }, [interactive, onScene]);

  const categoriesKey = useMemo(() => [...categories.values()].map((c) => `${c.id}${c.color}`).join('|'), [categories]);

  useEffect(() => {
    modelRef.current = { city, categories, categoriesKey, now, picking, selectedPlan, focusSid, dropSound };
    sceneLocal.current?.setModel(modelRef.current);
  }, [city, categories, categoriesKey, now, picking, selectedPlan, focusSid, dropSound]);

  return <canvas ref={canvasRef} className={`city-canvas ${className}`} role="img" aria-label={label} />;
}

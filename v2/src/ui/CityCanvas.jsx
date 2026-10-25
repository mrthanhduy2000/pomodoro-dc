import { useEffect, useMemo, useRef, useState } from 'react';

import { CityScene } from '../city/CityScene.js';

/**
 * CityCanvas — mounts one CityScene and feeds it the model. The scene decides for itself whether a
 * new model needs a rebuild (it compares a signature), so passing the model on every render is cheap.
 */
export default function CityCanvas({
  city, categories, now, picking = false, selectedPlan = null, focusSid = null, dropSound = false, onPick, interactive = true,
  className = '', onScene = null, label = 'Thành phố', Scene = CityScene, appearance = null, placementBlueprint = null, placementSites = null,
}) {
  const [measurements,setMeasurements]=useState([]);
  const [measuring,setMeasuring]=useState(false);
  const benchmark=import.meta.env.DEV && interactive && appearance && new URLSearchParams(location.search).get('bench')==='gpt';
  const canvasRef = useRef(null);
  const sceneLocal = useRef(null);
  const pickRef = useRef(onPick);
  const modelRef = useRef(null);
  const measure=mode=>{setMeasuring(true);sceneLocal.current?.startBenchmark?.(mode,result=>{setMeasurements(old=>[...old,result]);setMeasuring(false);});};


  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    const scene = new Scene(canvasRef.current, { onPick: (p) => pickRef.current?.(p), interactive });
    sceneLocal.current = scene;
    if (import.meta.env?.DEV) window.__cityScene = scene; // dev-only handle for measuring
    if (modelRef.current) scene.setModel(modelRef.current); // a re-created scene gets the last model
    onScene?.(scene);
    return () => {
      onScene?.(null);
      scene.dispose();
      sceneLocal.current = null;
    };
  }, [interactive, onScene, Scene]);

  const categoriesKey = useMemo(() => [...categories.values()].map((c) => `${c.id}${c.color}`).join('|'), [categories]);

  useEffect(() => {
    modelRef.current = { city, categories, categoriesKey, now, picking, selectedPlan, focusSid, dropSound, appearance, placementBlueprint, placementSites };
    sceneLocal.current?.setModel(modelRef.current);
  }, [city, categories, categoriesKey, now, picking, selectedPlan, focusSid, dropSound, appearance, placementBlueprint, placementSites]);

  return <><canvas ref={canvasRef} className={`city-canvas ${className}`} role="img" aria-label={label} />{benchmark && <div style={{position:'absolute',left:12,bottom:52,zIndex:20,background:'#fff',color:'#142c25',padding:10,maxWidth:'90%',fontSize:11}}>
    <button type="button" disabled={measuring} onClick={()=>measure('orbit')}>Đo xoay 12 giây</button><button type="button" disabled={measuring} onClick={()=>measure('zoom')}>Đo thu phóng 12 giây</button>
    <output aria-label="Kết quả FPS">{measuring?'Đang đo — giữ nguyên cửa sổ':JSON.stringify(measurements)}</output>
  </div>}</>;
}

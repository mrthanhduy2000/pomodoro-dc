import { lazy, Suspense } from 'react';

// three.js is ~70% of the bundle; the timer must open instantly on a phone, so the city loads
// only when a view first shows it (its own chunk, cached by the service worker afterwards).
const CityCanvas = lazy(() => import('./CityCanvas.jsx'));

export default function LazyCityCanvas(props) {
  return (
    <Suspense fallback={<div className={`city-canvas city-canvas--loading ${props.className ?? ''}`} aria-busy="true" />}>
      <CityCanvas {...props} />
    </Suspense>
  );
}

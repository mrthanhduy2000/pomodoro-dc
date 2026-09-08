import { useMemo } from 'react';

import useGameStore from '../store/gameStore';
import { listVisitableEras } from '../engine/cityArchive';
import { summarizeMuseum, withEraCompletion } from '../engine/cityCompletion';
import { getEraStage, medianSessionEP } from '../engine/eraStage';
import { describeJourney, describeRailProgress } from '../engine/journey';

/**
 * useJourney — the destination, read once and shared by every screen that shows it.
 *
 * ⚠️ WHY A HOOK AND NOT A LINE OF JSX. The journey number (`38/75 công trình`) has to appear on the
 * top rail of every tab AND inside the city screen, and those two live in different component trees
 * with different props. The wrong fix is to compute `builtTotal` in both places; the project has
 * already paid for that class of bug — a bar in `EraStageBar` once carried the label "XP" over a
 * number that was EP, for months, because two screens each did their own arithmetic.
 *
 * ⚠️ THIS IS THE ONLY PLACE THAT TURNS STORE STATE INTO THE DESTINATION. `engine/journey.js` stays
 * pure (no store, no `Date`); this file is the single seam between them.
 *
 * COST: `listVisitableEras` + `withEraCompletion` walk 15 eras × 5 blueprints = 75 entries. That is
 * cheap, but it is not free and the top rail re-renders on every store nudge, so the memo keys are
 * CONTENT keys (`buildings.join`), not array identity — the store hands back a new array each
 * render and an identity key would rebuild all 75 entries on every tick of the clock.
 */
export default function useJourney() {
  const activeBook = useGameStore((state) => state.progress.activeBook);
  const totalEP = useGameStore((state) => state.progress.totalEP);
  const cityArchive = useGameStore((state) => state.cityArchive);
  const buildings = useGameStore((state) => state.buildings);
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const history = useGameStore((state) => state.history);

  const builtKey = Array.isArray(buildings) ? buildings.join(',') : '';
  const pendingKey = (Array.isArray(craftingQueue) ? craftingQueue : [])
    .map((item) => item?.bpId).join(',');

  const journey = useMemo(
    () => describeJourney({
      museum: summarizeMuseum(withEraCompletion(
        listVisitableEras(cityArchive, activeBook),
        { built: buildings, pending: craftingQueue },
      )),
      activeBook,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cityArchive, activeBook, builtKey, pendingKey],
  );

  const rail = useMemo(
    () => describeRailProgress({
      stage: getEraStage(activeBook, totalEP),
      epPerSession: medianSessionEP(history),
      journey,
    }),
    [activeBook, totalEP, history, journey],
  );

  return { journey, rail };
}

/**
 * cityPostcard.test.js — the Focus-screen postcard's two decisions (ADR-078), without WebGL.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { planPostcardLayout, planPostcardFocus, postcardSelection } from './cityPostcard.js';
import { listNextProjects, describeProject } from '../../engine/buildChoices.js';
import { computeCityLayout } from '../../engine/cityLayout.js';

const firstEra1 = listNextProjects({ activeBook: 1, buildings: [], craftingQueue: [] })[0];

test('empty queue ⇒ a PHANTOM scaffold for the auto-pick, appended after the real queue', () => {
  const plan = planPostcardLayout({ activeBook: 1, buildings: [], craftingQueue: [] });
  assert.equal(plan.pending.length, 1, 'session 1 must already show where the first brick goes');
  assert.equal(plan.pending[0].bpId, firstEra1.bpId, 'the phantom is the same project the strip names');
  assert.equal(plan.pending[0].sessionsRemaining, firstEra1.sessions, 'no brick laid yet');
  assert.equal(plan.pending[0].phantom, true);

  // With a real queue there is no phantom — the head of the queue IS the brick.
  const queued = [{ bpId: firstEra1.bpId, sessionsRemaining: 2, startedAt: 1 }];
  const plan2 = planPostcardLayout({ activeBook: 1, buildings: [], craftingQueue: queued });
  assert.deepEqual(plan2.pending, queued);
});

test('the phantom lands on the SAME plot the real item gets when the session ends (ADR-007 story)', () => {
  const phantom = planPostcardLayout({ activeBook: 1, buildings: [], craftingQueue: [] });
  const before = computeCityLayout(phantom);
  const after = computeCityLayout({
    ...phantom,
    pending: [{ bpId: firstEra1.bpId, sessionsRemaining: firstEra1.sessions, startedAt: 1 }],
  });
  const a = before.scaffolds.find((s) => s.bpId === firstEra1.bpId);
  const b = after.scaffolds.find((s) => s.bpId === firstEra1.bpId);
  assert.ok(a && b, 'both layouts must carry the scaffold');
  assert.deepEqual([a.x, a.y], [b.x, b.y], 'the plot must not move between "planned" and "queued"');
});

test('focus: the brick site while idle or running; the just-built building only while idle', () => {
  const built = [firstEra1.bpId];
  const next = listNextProjects({ activeBook: 1, buildings: built, craftingQueue: [] })[0];
  assert.deepEqual(
    planPostcardFocus({ activeBook: 1, buildings: built, craftingQueue: [], landedBpId: firstEra1.bpId }),
    { kind: 'building', bpId: firstEra1.bpId },
    'after the ending the camera stays on what was just built',
  );
  assert.deepEqual(
    planPostcardFocus({ activeBook: 1, buildings: built, craftingQueue: [], landedBpId: firstEra1.bpId, sessionRunning: true }),
    { kind: 'scaffold', bpId: next.bpId },
    'a running session looks at the brick being laid, never backwards',
  );
  assert.deepEqual(
    planPostcardFocus({ activeBook: 1, buildings: [], craftingQueue: [], landedBpId: 'not-standing' }),
    { kind: 'scaffold', bpId: firstEra1.bpId },
    'a landed id that is not in the city is ignored',
  );
  assert.equal(describeProject(next.bpId)?.bpId, next.bpId);
});

test('postcardSelection resolves to the layout entry and survives the scaffold→building flip', () => {
  const layout = computeCityLayout(planPostcardLayout({ activeBook: 1, buildings: [], craftingQueue: [] }));
  const sel = postcardSelection(layout, { kind: 'scaffold', bpId: firstEra1.bpId });
  assert.equal(sel?.kind, 'scaffold');
  assert.equal(sel?.bpId, firstEra1.bpId);
  assert.ok(Number.isFinite(sel?.x) && Number.isFinite(sel?.y), 'the entry carries its plot');

  // One render after the building completes the focus still says "scaffold" — resolve it anyway.
  const builtLayout = computeCityLayout({ built: [firstEra1.bpId], levels: {}, era: 1, stats: { sessionCount: 3, streakLength: 1 }, pending: [] });
  const flipped = postcardSelection(builtLayout, { kind: 'scaffold', bpId: firstEra1.bpId });
  assert.equal(flipped?.kind, 'building');
  assert.equal(postcardSelection(builtLayout, null), null);
  assert.equal(postcardSelection(null, { kind: 'building', bpId: 'x' }), null);
});

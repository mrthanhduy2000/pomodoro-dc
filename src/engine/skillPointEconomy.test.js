/**
 * skillPointEconomy.test.js — the ledger that pays the skill tree.
 *
 * Every case answers *"red when you remove WHAT?"* (project law #3) and each was checked by
 * actually removing that thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { SKILL_TREE, BLUEPRINT_META, SP_PER_LEVEL } from './constants.js';
import { SP_PER_BUILDING, cityEarnedSP, settleCitySP, nextSkillPointETA } from './skillPointEconomy.js';
import { TOTAL_BUILDINGS } from './journey.js';

// ─── THE BALANCE IS THE ARGUMENT ─────────────────────────────────────────────────────────────
// RED WHEN: someone "rounds up" SP_PER_BUILDING to 2 because one point feels stingy. That doubles
// the city's payout to 150 SP against a 138 SP tree, which covers the whole tree from one source
// and makes the weekly chain and the level ladder decorative — the exact failure this round was
// called to fix, only pointed the other way.
test('one building pays exactly one skill point, and the city alone cannot buy the whole tree', () => {
  const treeCost = Object.values(SKILL_TREE)
    .flatMap((branch) => branch.nodes)
    .reduce((sum, node) => sum + node.spCost, 0);

  assert.equal(SP_PER_BUILDING, 1);
  assert.equal(treeCost, 138, 'the tree changed size — re-derive SP_PER_BUILDING before touching it');
  const cityTotal = cityEarnedSP(TOTAL_BUILDINGS);
  assert.equal(cityTotal, 75);
  assert.ok(cityTotal < treeCost,
    'the city now covers the entire tree by itself; the weekly chain and levels have become decoration');
  assert.ok(cityTotal > treeCost / 2,
    'the city is no longer the main source of skill points — the 155-session wall is back in a new shape');
});

// RED WHEN: the ratio the round exists for is quietly lost. 420 build-sessions across 75 buildings
// is ~5,6 sessions per point, down from ~86. This pins the ORDER OF MAGNITUDE, not the decimals.
test('a skill point costs on the order of five sessions, not eighty-five', () => {
  const buildSessions = Object.values(BLUEPRINT_META)
    .reduce((sum, meta) => sum + (meta.sessionsToComplete || 0), 0);
  const sessionsPerSP = buildSessions / cityEarnedSP(TOTAL_BUILDINGS);
  assert.ok(sessionsPerSP > 3 && sessionsPerSP < 10,
    `a skill point now costs ${sessionsPerSP.toFixed(1)} sessions — outside the 3–10 band this round was balanced in`);
});

// ─── THE LEDGER ──────────────────────────────────────────────────────────────────────────────
// ⚠️ THE TEST THIS FILE EXISTS FOR. A save made before this rule has 38 buildings and an empty
// ledger; it must be paid for all of them, exactly once, with no migration step.
test('a save that predates the rule is paid in full on its first settle, and never again', () => {
  const first = settleCitySP({ builtTotal: 38, credited: 0 });
  assert.equal(first.owed, 38);
  assert.equal(first.credited, 38);

  const second = settleCitySP({ builtTotal: 38, credited: first.credited });
  assert.equal(second.owed, 0, 'settling twice paid twice — the ledger is not being written back');
});

test('settling after one more building pays exactly one more point', () => {
  const after = settleCitySP({ builtTotal: 39, credited: 38 });
  assert.equal(after.owed, 1);
  assert.equal(after.credited, 39);
});

// RED WHEN: the `Math.max(0, …)` clamp is dropped. A city can shrink — a cloud pull from a device
// that is behind, an import of an older save. Clawing points back would remove skills Đàm has
// already spent and already feels, which is the one thing an economy must never do.
test('a city that shrinks never claws points back', () => {
  const shrunk = settleCitySP({ builtTotal: 30, credited: 38 });
  assert.equal(shrunk.owed, 0);
  assert.equal(shrunk.credited, 38, 'the ledger was rewound, so the next growth would be paid twice');
});

test('garbage in the ledger or the count is read as zero, never as NaN', () => {
  assert.equal(settleCitySP({ builtTotal: NaN, credited: 5 }).owed, 0);
  assert.equal(settleCitySP({ builtTotal: 5, credited: NaN }).owed, 5);
  assert.equal(settleCitySP({ builtTotal: -3, credited: -3 }).owed, 0);
  assert.equal(settleCitySP().owed, 0);
  assert.equal(cityEarnedSP(undefined), 0);
});

// ═══ ROUND 45 (ADR-085) — "WHEN DO I GET TO OPEN ANOTHER ONE?" ══════════════════════════════════
// The header this feeds printed NOTHING on a real save, because the only distance it knew — the
// next level — was ~155 sessions away, over `STAGE_COUNTDOWN_MAX_SESSIONS`. Meanwhile the city was
// three sessions from paying a point. These cases hold the two properties that make the new line
// worth trusting: it picks the NEARER tap, and it stays silent rather than inventing a number.
// THỬ-CHO-ĐỎ: đổi `a.sessions - b.sessions` thành `b.sessions - a.sessions` ⇒ bài 1 đỏ.
test('the nearer tap wins, whichever kind it is', () => {
  const gan = nextSkillPointETA({
    craftingQueue: [{ bpId: 'x', sessionsRemaining: 3 }],
    sessionsToNextLevel: 155,
  });
  assert.equal(gan.source, 'building', 'công trình còn 3 phiên mà vẫn đi kể cấp cách 155 phiên');
  assert.equal(gan.sessions, 3);
  assert.equal(gan.sp, SP_PER_BUILDING);

  const capGan = nextSkillPointETA({
    craftingQueue: [{ bpId: 'x', sessionsRemaining: 20 }],
    sessionsToNextLevel: 4,
    nextLevel: 12,
  });
  assert.equal(capGan.source, 'level');
  assert.equal(capGan.sessions, 4);
  assert.equal(capGan.sp, SP_PER_LEVEL, 'một cấp trả SP_PER_LEVEL, không phải 1');
  assert.equal(capGan.label, 'cấp 12');
});

// ⚠️ THE CASE THE OLD LINE COULD NOT HANDLE, AND THE REASON THIS FUNCTION EXISTS.
// THỬ-CHO-ĐỎ: xoá nhánh `if (head)` ⇒ bài 2 đỏ (về lại đúng màn hình trống của vòng 44).
test('a level over the printable ceiling no longer means an empty line', () => {
  const chiCoCongTrinh = nextSkillPointETA({
    craftingQueue: [{ bpId: 'x', sessionsRemaining: 2 }],
    sessionsToNextLevel: null,
  });
  assert.ok(chiCoCongTrinh, 'cấp quá xa để in ⇒ dòng lại trống, đúng lỗi vòng 45 đi sửa');
  assert.equal(chiCoCongTrinh.source, 'building');
});

// THỬ-CHO-ĐỎ: bỏ `if (options.length === 0) return null` ⇒ bài 3 đỏ.
test('no honest answer means no answer — never a made-up distance', () => {
  assert.equal(nextSkillPointETA({}), null);
  assert.equal(nextSkillPointETA({ craftingQueue: [], sessionsToNextLevel: null }), null);
  // Rác không được biến thành một lời hứa: hàng chờ đã xong, số phiên âm, dữ liệu hỏng.
  assert.equal(nextSkillPointETA({ craftingQueue: [{ bpId: 'x', sessionsRemaining: 0 }] }), null);
  assert.equal(nextSkillPointETA({ craftingQueue: [{ bpId: 'x', sessionsRemaining: -3 }] }), null);
  assert.equal(nextSkillPointETA({ craftingQueue: 'hỏng', sessionsToNextLevel: 'hỏng' }), null);
  assert.equal(nextSkillPointETA({ sessionsToNextLevel: 0 }), null);
});

// THỬ-CHO-ĐỎ: đổi `(a.source === 'building' ? -1 : 1)` thành `0` — bài 4 KHÔNG đỏ ngay (sort ổn
// định), nên nó khoá cả hai thứ tự đầu vào để bắt được sự phụ thuộc vào thứ tự mảng.
test('at an equal distance the building is named — it is the one he can watch fill', () => {
  for (const queue of [[{ bpId: 'x', sessionsRemaining: 5 }], [{ bpId: 'x', sessionsRemaining: 5.0 }]]) {
    const hoa = nextSkillPointETA({ craftingQueue: queue, sessionsToNextLevel: 5, nextLevel: 9 });
    assert.equal(hoa.source, 'building', 'hoà thì phải kể thứ nhìn thấy được, không kể thứ trả nhiều hơn');
  }
});

// THỬ-CHO-ĐỎ: bỏ `.sort` trên hàng chờ ⇒ bài 5 đỏ.
test('the queue reports its NEAREST building, not its first', () => {
  const eta = nextSkillPointETA({
    craftingQueue: [
      { bpId: 'xa', sessionsRemaining: 9 },
      { bpId: 'gan', sessionsRemaining: 2 },
    ],
    projectLabel: (id) => (id === 'gan' ? 'Đền Nhỏ' : 'Đại Điện'),
  });
  assert.equal(eta.sessions, 2);
  assert.equal(eta.label, 'Đền Nhỏ');
  // Không có người dịch tên ⇒ trả null để màn hình tự chọn câu chữ, chứ không in ra id thô.
  assert.equal(nextSkillPointETA({ craftingQueue: [{ bpId: 'gan', sessionsRemaining: 2 }] }).label, null);
});

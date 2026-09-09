import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, gestation } from '../src/lib/validation.ts';
test('login returns only to allowed internal destinations', () => {
  for (const target of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/today\r\nLocation:x',
    '/other',
    '/todayevil',
  ])
    assert.equal(safeNext(target), '/today');
  assert.equal(safeNext('/join?token=abc'), '/join?token=abc');
});
test('gestation includes weeks 0–4 without inventing a fetus image', () => {
  assert.deepEqual(gestation('2027-06-16', new Date('2026-09-09T12:00:00Z')), {
    weeks: 0,
    days: 0,
    remaining: 280,
  });
  assert.deepEqual(gestation('2027-06-09', new Date('2026-09-09T12:00:00Z')), {
    weeks: 1,
    days: 0,
    remaining: 273,
  });
  assert.equal(gestation('invalid'), null);
});

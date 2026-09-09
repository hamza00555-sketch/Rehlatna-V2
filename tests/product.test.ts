import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalNumbers, permissions } from '../src/lib/product.ts';
test('funding math includes calendar endpoints, actual zero and overdue months', () => {
  const g = {
    expected_cents: 100000,
    actual_cents: null,
    initial_cents: 10000,
    funding_date: '2027-01-01',
  };
  assert.deepEqual(goalNumbers(g, 0, '2026-12-31').months, 2);
  assert.equal(goalNumbers(g, 10000, '2026-12-31').monthly, 40000);
  assert.equal(goalNumbers({ ...g, actual_cents: 0 }, 0, '2026-12-31').remaining, 0);
  assert.equal(goalNumbers(g, 0, '2027-02-01').status, 'تجاوز تاريخ التمويل');
  assert.equal(goalNumbers({ ...g, funding_date: '2026-12-01' }, 0, '2026-12-31').months, 1);
});
test('role union and explicit overrides match product capabilities', () => {
  assert.equal(permissions({ role: 'owner', roles: ['mother'] }).has('finance.view'), false);
  const p = permissions({ role: 'viewer', roles: ['finance'] });
  assert(p.has('preparation.view'));
  assert(!p.has('preparation.edit'));
  assert(!p.has('appointments.view'));
  assert(
    !permissions({
      role: 'owner',
      roles: ['mother', 'finance'],
      permission_overrides: { 'finance.view': false },
    }).has('finance.view'),
  );
});

import { careWindows, windowState } from '../src/lib/care-windows.ts';
test('care windows preserve manual decisions and do not infer a test from generic completed appointment', () => {
  const w = careWindows.find((w) => w.key === 'anatomy')!,
    due = '2027-01-01';
  const generic = {
    id: '1',
    kind: 'ultrasound',
    starts_at: '2026-08-20T12:00:00Z',
    status: 'completed',
    window_key: null,
  };
  assert.notEqual(windowState(w, 20, undefined, [generic], due).label, 'مسجَّل');
  assert.equal(windowState(w, 20, 'done', [], due).label, 'مسجَّل');
  assert.equal(
    windowState(w, 20, 'discussed', [{ ...generic, window_key: w.key }], due).label,
    'نوقش مع الطبيب',
  );
  assert.equal(
    windowState(
      careWindows.find((w) => w.key === 'nipt')!,
      23,
      undefined,
      [],
      due,
    ).hidden,
    true,
  );
});

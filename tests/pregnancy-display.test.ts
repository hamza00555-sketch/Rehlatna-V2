import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pregnancyDisplay, weeklyMedia } from '../src/lib/pregnancy-display.ts';
test('trimester boundaries follow approved specification and progress counts days', () => {
  assert.equal(pregnancyDisplay(13, 6).trimester, 1);
  assert.equal(pregnancyDisplay(14).trimester, 2);
  assert.equal(pregnancyDisplay(27, 6).trimester, 2);
  assert.equal(pregnancyDisplay(28).trimester, 3);
  assert.equal(pregnancyDisplay(20, 3).elapsed, 143);
  assert.equal(pregnancyDisplay(20, 3).dayOfWeek, 4);
  assert.equal(pregnancyDisplay(40).progress, 100);
  assert.match(pregnancyDisplay(40, 1).remainingText, /تجاوزنا/);
});
test('media never substitutes another week or exposes unreviewed assets outside demo', () => {
  for (let week = 0; week <= 4; week++) {
    assert.equal(weeklyMedia(week, true).poster, undefined);
    assert.equal(weeklyMedia(week, true).length, undefined);
  }
  assert.equal(weeklyMedia(24).poster, undefined);
  assert.ok(weeklyMedia(24, true).poster);
  assert.equal(weeklyMedia(23, true).poster, undefined);
  assert.equal(weeklyMedia(25, true).poster, undefined);
  assert.equal(weeklyMedia(41, true).poster, undefined);
  assert.equal(weeklyMedia(24.5, true).poster, undefined);
});

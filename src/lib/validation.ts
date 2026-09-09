import { z } from 'zod';
export const shortText = z.string().trim().min(1).max(80);
export const uuid = z.string().uuid();
export const familySchema = z.object({ familyName: shortText, memberName: shortText });
export const inviteSchema = z.object({
  householdId: uuid,
  email: z.string().trim().email().max(254),
  role: z.enum(['editor', 'viewer']),
});
export const safeNext = (value: unknown): string =>
  typeof value === 'string' &&
  /^\/(?:today|family|setup|join)(?:[/?]|$)/.test(value) &&
  !value.includes('\\') &&
  !/[\r\n]/.test(value)
    ? value
    : '/today';
export function gestation(due: string, today = new Date()) {
  const end = Date.parse(due + 'T12:00:00Z');
  if (!Number.isFinite(end)) return null;
  const date = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  const elapsed = 280 - Math.round((end - date) / 86400000);
  if (elapsed < 0 || elapsed > 294) return null;
  return {
    weeks: Math.floor(elapsed / 7),
    days: elapsed % 7,
    remaining: Math.max(0, 280 - elapsed),
  };
}

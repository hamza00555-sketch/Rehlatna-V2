'use client';
import { useState } from 'react';
import {
  permissions,
  permissionNames,
  roleNames,
  memberRoles,
  type Role,
  type Permission,
} from '@/lib/product';
import { ActionForm } from './form';
import { productAction } from '@/app/product-actions';
export function PermissionEditor({
  id,
  member,
  self,
  financeOwner,
}: {
  id: string;
  member: { role: string; roles: string[]; permission_overrides: Record<string, boolean> };
  self: boolean;
  financeOwner: boolean;
}) {
  const [roles, setRoles] = useState<Role[]>(memberRoles(member)),
    [overrides, setOverrides] = useState(member.permission_overrides);
  const allowed = permissions({ ...member, roles, permission_overrides: overrides });
  return (
    <ActionForm action={productAction} label="حفظ الصلاحيات">
      <input type="hidden" name="action" value="member" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="overrides" value={JSON.stringify(overrides)} />
      <h3>الأدوار</h3>
      <p>تُشتق الصلاحيات من الأدوار ويمكن تعديلها لكل عضو على حدة.</p>
      {Object.entries(roleNames).map(([k, v]) => (
        <label className="toggle-row" key={k}>
          {v}
          <input
            type="checkbox"
            name="roles"
            value={k}
            checked={roles.includes(k as Role)}
            disabled={k === 'finance' && !financeOwner}
            onChange={(e) => {
              if (e.target.checked) setRoles([...roles, k as Role]);
              else if (roles.length > 1) setRoles(roles.filter((r) => r !== k));
            }}
          />
          {k === 'finance' && !financeOwner && roles.includes('finance') && (
            <input type="hidden" name="roles" value="finance" />
          )}
        </label>
      ))}
      <h3>الصلاحيات</h3>
      {Object.entries(permissionNames).map(([k, v]) => (
        <label className="toggle-row" key={k}>
          {v}
          <input
            type="checkbox"
            checked={allowed.has(k as Permission)}
            disabled={
              (self && k === 'family.manage') || (k.startsWith('finance.') && !financeOwner)
            }
            onChange={(e) => setOverrides({ ...overrides, [k]: e.target.checked })}
          />
        </label>
      ))}
      {!financeOwner && <small>يتحكم صاحب الخطة المالية في منح صلاحياتها.</small>}
    </ActionForm>
  );
}

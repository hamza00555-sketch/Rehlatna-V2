export const dynamic = 'force-dynamic';
import { requireUser } from '@/lib/supabase';
import { Onboarding } from '@/components/onboarding';
export default async function Setup() {
  await requireUser();
  return <Onboarding />;
}

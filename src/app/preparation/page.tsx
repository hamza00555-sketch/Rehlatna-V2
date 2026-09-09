export const dynamic = 'force-dynamic';
import { PreparationPages } from '@/components/preparation-pages';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return <PreparationPages filter={(await searchParams).status} />;
}

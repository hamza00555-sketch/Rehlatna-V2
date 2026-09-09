export const dynamic = 'force-dynamic';
import { PreparationPages } from '@/components/preparation-pages';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  return (
    <PreparationPages
      path={(await params).path}
      filter={(await searchParams).status}
      categoryQuery={(await searchParams).category}
    />
  );
}

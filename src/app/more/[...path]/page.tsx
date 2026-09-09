export const dynamic = 'force-dynamic';
import { MorePages } from '@/components/more-pages';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MorePages path={(await params).path} query={await searchParams} />;
}

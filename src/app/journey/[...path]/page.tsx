export const dynamic = 'force-dynamic';
import { JourneyPages } from '@/components/journey-pages';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <JourneyPages path={(await params).path} query={await searchParams} />;
}

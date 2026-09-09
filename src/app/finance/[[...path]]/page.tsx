export const dynamic = 'force-dynamic';
import { FinancePages } from '@/components/finance-pages';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ item?: string }>;
}) {
  return <FinancePages path={(await params).path} itemId={(await searchParams).item} />;
}

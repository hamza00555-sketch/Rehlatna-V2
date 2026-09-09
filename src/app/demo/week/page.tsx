import { notFound } from 'next/navigation';
import { WeekPage } from '@/components/week-page';
export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const q = await searchParams;
  const week = q.week === undefined ? 24 : Number(q.week);
  if (!Number.isInteger(week) || week < 0 || week > 40) notFound();
  return <WeekPage week={week} current={24} demo />;
}

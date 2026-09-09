import { NextResponse, type NextRequest } from 'next/server';
import { appOrigin, db } from '@/lib/supabase';
import { safeNext } from '@/lib/validation';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const client = await db();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeNext(request.nextUrl.searchParams.get('next')), appOrigin()),
      );
  }
  return NextResponse.redirect(new URL('/auth?error=callback', appOrigin()));
}

import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!process.env.GOOGLE_GENKIT_API_KEY;
  return NextResponse.json({ isConfigured });
}

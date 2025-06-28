import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const { prompt, age } = await req.json();
  // Simplified: return mock story
  return NextResponse.json({ id: 'mock-id', title: 'História Gerada', content: `Era uma vez... ${prompt}` });
} 
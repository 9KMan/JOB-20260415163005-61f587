import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GOLF_TRIP_QUESTIONS } from '@/lib/types';

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
    }

    const shareCode = generateShareCode();

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        admin_id: user.id,
        name,
        description,
        share_code: shareCode,
        status: 'draft',
      })
      .select()
      .single();

    if (tripError) {
      console.error('Trip creation error:', tripError);
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
    }

    const questionsToInsert = GOLF_TRIP_QUESTIONS.map((q, index) => ({
      trip_id: trip.id,
      text: q.text,
      options: q.options,
      question_order: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Questions creation error:', questionsError);
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (tripsError) {
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
    }

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Trips fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

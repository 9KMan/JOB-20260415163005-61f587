import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, name, description, status, share_code')
      .eq('share_code', shareCode)
      .eq('status', 'active')
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ trip });

  } catch (error) {
    console.error('Trip by code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
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

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('admin_id', user.id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('trip_id', tripId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const totalQuestions = questions?.length || 0;
    const participantStats = {
      not_started: participants?.filter(p => p.status === 'not_started').length || 0,
      in_progress: participants?.filter(p => p.status === 'in_progress').length || 0,
      completed: participants?.filter(p => p.status === 'completed').length || 0,
      abandoned: participants?.filter(p => p.status === 'abandoned').length || 0,
    };

    return NextResponse.json({
      trip,
      participants: participants || [],
      questions: questions || [],
      stats: {
        total: participants?.length || 0,
        ...participantStats,
        progress: totalQuestions > 0 
          ? Math.round((participantStats.completed / participants!.length) * 100) 
          : 0,
      },
    });

  } catch (error) {
    console.error('Trip details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTripSummary } from '@/lib/openai';

interface AggregatedResponses {
  question: string;
  options: { [key: string]: number };
  totalResponses: number;
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

    const { tripId } = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
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

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('trip_id', tripId)
      .order('question_order', { ascending: true });

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'completed');

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ error: 'No completed responses to analyze' }, { status: 400 });
    }

    const { data: allResponses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .in('participant_id', participants.map(p => p.id));

    if (responsesError) {
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    const aggregatedResponses: AggregatedResponses[] = questions.map(question => {
      const questionResponses = allResponses?.filter(r => r.question_id === question.id) || [];
      const optionCounts: { [key: string]: number } = {};
      
      (question.options as string[]).forEach((opt: string) => {
        optionCounts[opt] = 0;
      });

      questionResponses.forEach((r: { answer: string }) => {
        if (optionCounts[r.answer] !== undefined) {
          optionCounts[r.answer]++;
        }
      });

      return {
        question: question.text,
        options: optionCounts,
        totalResponses: questionResponses.length,
      };
    });

    const summaries = await generateTripSummary(trip.name, aggregatedResponses);

    await supabase
      .from('trips')
      .update({ 
        status: 'completed',
        results: summaries,
      })
      .eq('id', tripId);

    return NextResponse.json({ summaries });

  } catch (error) {
    console.error('Generate results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

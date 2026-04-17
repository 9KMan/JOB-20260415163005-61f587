import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatPhoneNumber, validatePhoneNumber, sendQuestion } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tripId, name, phone, consentTerms, consentPrivacy } = await request.json();

    if (!tripId || !name || !phone || !consentTerms || !consentPrivacy) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!validatePhoneNumber(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('status', 'active')
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found or not active' }, { status: 404 });
    }

    const formattedPhone = formatPhoneNumber(phone);

    const { data: existingParticipant, error: _duplicateError } = await supabase
      .from('participants')
      .select('*')
      .eq('trip_id', tripId)
      .ilike('phone', `%${formattedPhone.replace('+1', '')}`)
      .single();

    if (existingParticipant) {
      return NextResponse.json({ error: 'This phone number is already registered for this trip' }, { status: 409 });
    }

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        trip_id: tripId,
        name,
        phone: formattedPhone,
        consent_terms: consentTerms,
        consent_privacy: consentPrivacy,
        status: 'not_started',
        current_question_index: 0,
        reminder_count: 0,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Participant creation error:', participantError);
      return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('trip_id', tripId)
      .order('question_order', { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      console.error('Questions fetch error:', questionsError);
      return NextResponse.json({ error: 'Survey not available' }, { status: 500 });
    }

    const firstQuestion = questions[0];
    
    try {
      await sendQuestion(
        formattedPhone,
        1,
        questions.length,
        firstQuestion.text,
        firstQuestion.options
      );
    } catch (smsError) {
      console.error('SMS send error:', smsError);
    }

    return NextResponse.json({ 
      message: 'Registration successful',
      participant 
    });

  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

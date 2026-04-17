import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendQuestion } from '@/lib/twilio';

function xmlResponse(content: string): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

function buildTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = (formData.get('Body') as string)?.trim();

    if (!from || !body) {
      return xmlResponse(buildTwiml('Missing data'));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*, trips(*)')
      .ilike('phone', `%${from.replace('+1', '')}`)
      .single();

    if (participantError || !participant) {
      console.error('Participant not found for phone:', from);
      return xmlResponse(buildTwiml('You are not registered for any active trip.'));
    }

    if (participant.status === 'completed') {
      return xmlResponse(buildTwiml(`Thank you! You have already completed the survey for ${participant.trips.name}.`));
    }

    if (participant.status === 'abandoned') {
      return xmlResponse(buildTwiml('Your session has expired. Please contact your trip administrator for a new invitation.'));
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('trip_id', participant.trip_id)
      .order('question_order', { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      console.error('Questions not found');
      return xmlResponse(buildTwiml('There was an error loading the survey. Please try again later.'));
    }

    let currentIndex = participant.current_question_index;
    const answer = body.toLowerCase().trim();

    if (participant.status === 'not_started') {
      await supabase
        .from('participants')
        .update({ 
          status: 'in_progress',
          last_response_at: new Date().toISOString()
        })
        .eq('id', participant.id);
    }

    const currentQuestion = questions[currentIndex];
    const isValidAnswer = /^[1-9]$/.test(answer);
    
    if (!isValidAnswer) {
      await supabase
        .from('participants')
        .update({ 
          reminder_count: participant.reminder_count,
          last_response_at: new Date().toISOString()
        })
        .eq('id', participant.id);

      const retryQuestion = questions[Math.min(currentIndex, questions.length - 1)];
      const retryOptionsText = retryQuestion.options
        .map((opt: string, i: number) => `${i + 1}. ${opt}`)
        .join('\n');
      
      return xmlResponse(buildTwiml(`Invalid response. Please reply with a number between 1 and ${retryQuestion.options.length}.\n\n${retryQuestion.text}\n\n${retryOptionsText}`));
    }

    const selectedOption = parseInt(answer) - 1;
    const selectedAnswer = currentQuestion.options[selectedOption];

    const { error: responseError } = await supabase
      .from('responses')
      .upsert({
        participant_id: participant.id,
        question_id: currentQuestion.id,
        answer: selectedAnswer,
      }, {
        onConflict: 'participant_id,question_id'
      });

    if (responseError) {
      console.error('Response save error:', responseError);
    }

    currentIndex++;

    if (currentIndex >= questions.length) {
      await supabase
        .from('participants')
        .update({ 
          status: 'completed',
          current_question_index: currentIndex,
          completed_at: new Date().toISOString(),
          last_response_at: new Date().toISOString()
        })
        .eq('id', participant.id);

      return xmlResponse(buildTwiml('Thank you for completing the survey! Your responses have been recorded. The trip organizer will share results soon.'));
    }

    await supabase
      .from('participants')
      .update({ 
        current_question_index: currentIndex,
        last_response_at: new Date().toISOString()
      })
      .eq('id', participant.id);

    const nextQuestion = questions[currentIndex];
    await sendQuestion(
      from,
      currentIndex + 1,
      questions.length,
      nextQuestion.text,
      nextQuestion.options
    );

    return xmlResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return xmlResponse(buildTwiml('An error occurred. Please try again.'));
  }
}

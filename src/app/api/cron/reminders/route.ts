import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReminder } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data: notStartedParticipants, error: notStartedError } = await supabase
      .from('participants')
      .select('*, trips(*)')
      .eq('status', 'not_started')
      .lte('created_at', twentyFourHoursAgo);

    if (notStartedError) {
      console.error('Not started participants error:', notStartedError);
    }

    if (notStartedParticipants) {
      for (const participant of notStartedParticipants) {
        if (participant.reminder_count < 2) {
          try {
            await sendReminder(participant.phone, participant.trips.name, 'not_started');
            await supabase
              .from('participants')
              .update({ reminder_count: participant.reminder_count + 1 })
              .eq('id', participant.id);
          } catch (smsError) {
            console.error('Reminder SMS error:', smsError);
          }
        } else {
          await supabase
            .from('participants')
            .update({ status: 'abandoned' })
            .eq('id', participant.id);
        }
      }
    }

    const { data: inProgressParticipants, error: inProgressError } = await supabase
      .from('participants')
      .select('*, trips(*)')
      .eq('status', 'in_progress')
      .lte('last_response_at', sixHoursAgo);

    if (inProgressError) {
      console.error('In progress participants error:', inProgressError);
    }

    if (inProgressParticipants) {
      for (const participant of inProgressParticipants) {
        if (participant.reminder_count < 2) {
          try {
            await sendReminder(participant.phone, participant.trips.name, 'in_progress');
            await supabase
              .from('participants')
              .update({ reminder_count: participant.reminder_count + 1 })
              .eq('id', participant.id);
          } catch (smsError) {
            console.error('Reminder SMS error:', smsError);
          }
        } else {
          await supabase
            .from('participants')
            .update({ status: 'abandoned' })
            .eq('id', participant.id);
        }
      }
    }

    const { data: abandonedParticipants, error: abandonedError } = await supabase
      .from('participants')
      .select('*')
      .eq('status', 'in_progress')
      .lte('last_response_at', fortyEightHoursAgo);

    if (abandonedError) {
      console.error('Abandoned check error:', abandonedError);
    }

    if (abandonedParticipants) {
      for (const participant of abandonedParticipants) {
        await supabase
          .from('participants')
          .update({ status: 'abandoned' })
          .eq('id', participant.id);
      }
    }

    return NextResponse.json({ 
      message: 'Cron job completed',
      processed: {
        notStarted: notStartedParticipants?.length || 0,
        inProgress: inProgressParticipants?.length || 0,
        abandoned: abandonedParticipants?.length || 0,
      }
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

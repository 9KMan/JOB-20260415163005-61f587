import Twilio from 'twilio';

let twilioClientInstance: ReturnType<typeof Twilio> | null = null;
let twilioPhoneNumber: string | null = null;

function getTwilioClient(): ReturnType<typeof Twilio> | null {
  if (twilioClientInstance !== null) {
    return twilioClientInstance;
  }
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || null;
  
  if (accountSid && authToken) {
    twilioClientInstance = Twilio(accountSid, authToken);
  } else {
    twilioClientInstance = null;
  }
  
  return twilioClientInstance;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

export async function sendSMS(to: string, body: string) {
  const twilioClient = getTwilioClient();
  if (!twilioClient || !twilioPhoneNumber) {
    console.error('Twilio not configured');
    return null;
  }

  const formattedTo = formatPhoneNumber(to);
  
  const message = await twilioClient.messages.create({
    body,
    from: twilioPhoneNumber,
    to: formattedTo,
  });

  return message;
}

export async function sendQuestion(
  to: string, 
  questionNumber: number, 
  totalQuestions: number, 
  questionText: string, 
  options: string[]
) {
  const optionsText = options
    .map((opt, i) => `${i + 1}. ${opt}`)
    .join('\n');
  
  const body = `Question ${questionNumber}/${totalQuestions}:\n${questionText}\n\nReply with a number (1-${options.length})\n\n${optionsText}`;
  
  return sendSMS(to, body);
}

export async function sendReminder(
  to: string,
  tripName: string,
  status: 'not_started' | 'in_progress'
) {
  const message = status === 'not_started'
    ? `Hi! Just a reminder about the group trip "${tripName}" you were invited to. Click your unique link to start the survey!`
    : `Hi! We noticed you started but didn't finish the survey for "${tripName}". Resume where you left off!`;

  return sendSMS(to, message);
}

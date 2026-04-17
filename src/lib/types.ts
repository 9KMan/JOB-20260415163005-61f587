export interface Trip {
  id: string;
  admin_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'abandoned';
  stripe_session_id?: string;
  stripe_payment_status?: string;
  share_code: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
  phone: string;
  consent_terms: boolean;
  consent_privacy: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  current_question_index: number;
  reminder_count: number;
  last_response_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  trip_id: string;
  text: string;
  options: string[];
  order: number;
}

export interface Response {
  id: string;
  participant_id: string;
  question_id: string;
  answer: string;
  answered_at: string;
}

export interface TripResult {
  id: string;
  trip_id: string;
  summary: string;
  created_at: string;
}

export type ParticipantStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export const GOLF_TRIP_QUESTIONS = [
  {
    text: "What is your preferred trip destination?",
    options: ["Pinehurst, NC", "St. Andrews, Scotland", "Bandon Dunes, OR", "Pebble Beach, CA", "Myrtle Beach, SC"]
  },
  {
    text: "What is your budget range per person?",
    options: ["$1,000 - $2,000", "$2,000 - $3,500", "$3,500 - $5,000", "$5,000+"]
  },
  {
    text: "How many days would you like to play?",
    options: ["2-3 days", "4-5 days", "6-7 days", "8+ days"]
  },
  {
    text: "What is your skill level?",
    options: ["Beginner (20+ handicap)", "Intermediate (10-20)", "Advanced (5-10)", "Expert (under 5)"]
  },
  {
    text: "Preferred accommodation type?",
    options: ["On-site golf resort", "Nearby hotel", "Vacation rental", "No preference"]
  },
  {
    text: "When do you prefer to travel?",
    options: ["Spring (Mar-May)", "Summer (Jun-Aug)", "Fall (Sep-Nov)", "Winter (Dec-Feb)"]
  },
  {
    text: "Do you need golf equipment rental?",
    options: ["Yes, full rental", "Yes, clubs only", "No, I have my own"]
  },
  {
    text: "Are you interested in spa services?",
    options: ["Yes, essential", "Yes, occasionally", "No preference"]
  },
  {
    text: "Preferred dining style?",
    options: ["Fine dining", "Casual/Pub", "Mix of both", "No preference"]
  },
  {
    text: "Are you bringing non-golfing guests?",
    options: ["Yes, regularly", "Possibly", "No, golf only trips"]
  },
  {
    text: "Transportation preference at destination?",
    options: ["Golf cart (included)", "Walking with caddies", "Self-transport", "No preference"]
  },
  {
    text: "How did you hear about this trip?",
    options: ["Friend recommendation", "Social media", "Travel agent", "Previous trip"]
  }
];

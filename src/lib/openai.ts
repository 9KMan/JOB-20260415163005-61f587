import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiInstance) {
    return openaiInstance;
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  
  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

interface AggregatedResponses {
  question: string;
  options: { [key: string]: number };
  totalResponses: number;
}

interface TripSummary {
  title: string;
  description: string;
  highlights: string[];
  recommendation: string;
}

export async function generateTripSummary(
  tripName: string,
  aggregatedResponses: AggregatedResponses[]
): Promise<TripSummary[]> {
  const openai = getOpenAIClient();
  
  const prompt = `Analyze the following survey responses for a group golf trip called "${tripName}" and generate 1-3 distinct trip options that would best suit the group.

Survey Data:
${aggregatedResponses.map((r, i) => `
Question ${i + 1}: ${r.question}
Responses: ${Object.entries(r.options).map(([opt, count]) => `${opt}: ${count} votes`).join(', ')}
Total responses: ${r.totalResponses}
`).join('\n')}

Based on this data, generate 1-3 trip options. Each option should include:
- A creative title
- A description of the destination and experience
- Key highlights based on group preferences
- Why this option suits the group

Return your response as a JSON array with this structure:
[{
  "title": "Trip Option Title",
  "description": "Description of the trip",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "recommendation": "Why this suits the group"
}]

Return ONLY the JSON array, no other text.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a travel planning expert specializing in golf trips. Analyze group survey data to suggest optimal trip options.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content;
  
  if (!response) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed.trip_options)) {
      return parsed.trip_options;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [parsed];
  } catch {
    throw new Error('Failed to parse OpenAI response');
  }
}

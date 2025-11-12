/**
 * OpenRouter AI Integration - Server-Side Only
 * 
 * This file contains server-side functions that can access OPENROUTER_API_KEY
 * without exposing it to the client.
 */

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API (server-side only)
 */
async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'minimax/minimax-m2:free'
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env.local file and restart the server.');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Bridge The Gap',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. The free model is temporarily unavailable. Please wait a few minutes and try again, or use the manual form to add your schedule.');
      }
      
      // Handle other errors
      const errorMessage = errorData?.error?.message || errorText;
      throw new Error(`OpenRouter API error: ${response.status} - ${errorMessage}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';

  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

/**
 * Parse natural language schedule text into structured schedule entries
 */
export async function parseScheduleFromText(text: string): Promise<Array<{
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  type: 'class' | 'work' | 'other';
}>> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a schedule parser. Convert natural language schedule descriptions into structured JSON format.

CRITICAL RULES - ALL FIELDS ARE REQUIRED:
- day_of_week: MUST be a number 0-6 (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
- start_time: MUST be "HH:MM:SS" format in 24-hour time (e.g., "17:00:00" for 5pm, "09:00:00" for 9am)
- end_time: MUST be "HH:MM:SS" format in 24-hour time
- title: Course name or activity title (required string)
- type: MUST be exactly "class", "work", or "other" (default to "class" for courses)

IMPORTANT: Every entry MUST have all 5 fields: day_of_week, start_time, end_time, title, type

Time conversion guide:
- 9am = 09:00:00
- 10am = 10:00:00
- 12pm (noon) = 12:00:00
- 1pm = 13:00:00
- 5pm = 17:00:00
- 9pm = 21:00:00
- 12am (midnight) = 00:00:00

Examples:
Input: "CS 101 on Monday and Wednesday from 9am to 10:30am"
Output: [{"day_of_week": 1, "start_time": "09:00:00", "end_time": "10:30:00", "title": "CS 101", "type": "class"}, {"day_of_week": 3, "start_time": "09:00:00", "end_time": "10:30:00", "title": "CS 101", "type": "class"}]

Input: "cs on monday and friday 5pm to 9pm"
Output: [{"day_of_week": 1, "start_time": "17:00:00", "end_time": "21:00:00", "title": "CS", "type": "class"}, {"day_of_week": 5, "start_time": "17:00:00", "end_time": "21:00:00", "title": "CS", "type": "class"}]

Input: "math on tuesday and wednesday 9am to 10am"
Output: [{"day_of_week": 2, "start_time": "09:00:00", "end_time": "10:00:00", "title": "Math", "type": "class"}, {"day_of_week": 3, "start_time": "09:00:00", "end_time": "10:00:00", "title": "Math", "type": "class"}]

Input: "cs on monday and friday 5pm to 9pm, math on tuesday and wednesday 9am to 10am"
Output: [{"day_of_week": 1, "start_time": "17:00:00", "end_time": "21:00:00", "title": "CS", "type": "class"}, {"day_of_week": 5, "start_time": "17:00:00", "end_time": "21:00:00", "title": "CS", "type": "class"}, {"day_of_week": 2, "start_time": "09:00:00", "end_time": "10:00:00", "title": "Math", "type": "class"}, {"day_of_week": 3, "start_time": "09:00:00", "end_time": "10:00:00", "title": "Math", "type": "class"}]

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.`,
    },
    {
      role: 'user',
      content: `Parse this schedule: ${text}`,
    },
  ];

  try {
    const response = await callOpenRouter(messages, 'minimax/minimax-m2:free');
    
    // Check if response is an error message (not JSON)
    if (!response.trim().startsWith('[') && !response.trim().startsWith('{')) {
      if (response.includes('API key') || response.includes('not available') || response.includes('not configured')) {
        throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env.local file and restart the server.');
      }
      throw new Error('AI service returned an unexpected response. Please try again or use the manual form.');
    }
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = response.trim();
    
    // Remove markdown code blocks
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      } else {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
    }
    
    // Try to extract JSON array if there's extra text
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Validate it looks like JSON before parsing
    if (!jsonText.startsWith('[') && !jsonText.startsWith('{')) {
      throw new Error('AI response was not in the expected format. Please try rephrasing your schedule description.');
    }
    
    const parsed = JSON.parse(jsonText);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected an array of schedule entries');
    }
    
    // Validate and normalize the entries
    return parsed.map((entry: any, index: number) => {
      // Try to extract day_of_week if it's missing or invalid
      let dayOfWeek = entry.day_of_week;
      if (dayOfWeek === undefined || dayOfWeek === null) {
        // Try to infer from day name in title or other fields
        const dayNames: { [key: string]: number } = {
          'sunday': 0, 'sun': 0,
          'monday': 1, 'mon': 1,
          'tuesday': 2, 'tue': 2, 'tues': 2,
          'wednesday': 3, 'wed': 3,
          'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
          'friday': 5, 'fri': 5,
          'saturday': 6, 'sat': 6
        };
        
        const entryStr = JSON.stringify(entry).toLowerCase();
        for (const [dayName, dayNum] of Object.entries(dayNames)) {
          if (entryStr.includes(dayName)) {
            dayOfWeek = dayNum;
            break;
          }
        }
      }
      
      if (dayOfWeek === undefined || dayOfWeek === null || isNaN(parseInt(dayOfWeek))) {
        throw new Error(`Entry ${index + 1} is missing or has invalid day_of_week. Please specify the day clearly (e.g., "Monday", "Tuesday").`);
      }
      
      const parsedDay = parseInt(dayOfWeek);
      if (parsedDay < 0 || parsedDay > 6) {
        throw new Error(`Entry ${index + 1} has invalid day_of_week: ${dayOfWeek}. Must be 0-6.`);
      }
      
      if (!entry.start_time) {
        throw new Error(`Entry ${index + 1} is missing start_time`);
      }
      if (!entry.end_time) {
        throw new Error(`Entry ${index + 1} is missing end_time`);
      }
      
      return {
        day_of_week: parsedDay,
        start_time: normalizeTime(entry.start_time),
        end_time: normalizeTime(entry.end_time),
        title: entry.title || 'Untitled',
        type: (entry.type === 'work' || entry.type === 'other') ? entry.type : 'class',
      };
    });
  } catch (error: any) {
    console.error('Error parsing schedule:', error);
    throw new Error(error.message || 'Failed to parse schedule. Please try rephrasing or use the manual form.');
  }
}

/**
 * Normalize time format to HH:MM:SS
 */
function normalizeTime(time: string): string {
  if (!time) return '00:00:00';
  
  let normalized = time.toString().trim();
  
  const isPM = /pm/i.test(normalized);
  const isAM = /am/i.test(normalized);
  normalized = normalized.replace(/[ap]m/gi, '').trim();
  
  const parts = normalized.split(':');
  let hours = parseInt(parts[0]);
  
  if (isNaN(hours)) {
    console.warn(`Invalid time format: ${time}, defaulting to 00:00:00`);
    return '00:00:00';
  }
  
  const minutes = parts[1] ? parseInt(parts[1]) : 0;
  const seconds = parts[2] ? parseInt(parts[2]) : 0;
  
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
  if (hours < 0 || hours > 23) {
    console.warn(`Invalid hours: ${hours}, defaulting to 00:00:00`);
    return '00:00:00';
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


/**
 * Google Gemini AI Integration - Server-Side Only
 * 
 * This file contains server-side functions for Google Gemini API
 * Better free tier: 1,500 requests/day (vs 50 on OpenRouter)
 */

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
}

/**
 * Call Google Gemini API (server-side only)
 * Includes retry logic for 503 errors (service overloaded)
 */
export async function callGemini(
  messages: Array<{ role: 'user' | 'model' | 'system'; content: string }>,
  model: string = 'gemini-2.5-flash',
  retries: number = 3
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file and restart the server.');
  }

  // Convert messages to Gemini format
  // Gemini doesn't support system messages, so we'll prepend it to the first user message
  const geminiMessages: GeminiMessage[] = [];
  let systemPrompt = '';

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else if (msg.role === 'user') {
      const content = systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content;
      geminiMessages.push({
        role: 'user',
        parts: [{ text: content }]
      });
      systemPrompt = ''; // Clear after first use
    } else if (msg.role === 'model') {
      geminiMessages.push({
        role: 'model',
        parts: [{ text: msg.content }]
      });
    }
  }

  // Retry logic for 503 errors
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Exponential backoff: wait 1s, 2s, 4s between retries
      if (attempt > 0) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`Retrying Gemini API call (attempt ${attempt + 1}/${retries}) after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Use v1beta API for gemini-pro (more stable)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
              temperature: 0.1, // Low temperature for structured outputs
              topP: 0.8,
              topK: 40,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        const errorMessage = errorData?.error?.message || errorText;
        
        // Handle 503 errors with retry
        if (response.status === 503) {
          if (attempt < retries - 1) {
            // Will retry on next iteration
            lastError = new Error(`Gemini API is temporarily overloaded. Retrying... (attempt ${attempt + 1}/${retries})`);
            continue;
          } else {
            // Last attempt failed
            throw new Error('Gemini API is temporarily overloaded. Please try again in a few moments.');
          }
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a few minutes and try again, or use the manual form to add your schedule.');
        }
        
        // Handle quota exceeded
        if (response.status === 429 || errorText.includes('quota')) {
          throw new Error('Daily quota exceeded. Please wait until tomorrow or use the manual form to add your schedule.');
        }
        
        // Handle other errors (don't retry)
        throw new Error(`Gemini API error: ${response.status} - ${errorMessage}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      return text;

    } catch (error: any) {
      // If it's a 503-related error and we have retries left, continue to retry
      // (This handles cases where fetch itself throws, though unlikely)
      if ((error.message?.includes('overloaded') || error.message?.includes('503')) && attempt < retries - 1) {
        lastError = error;
        continue;
      }
      
      // For other errors or last attempt, throw immediately
      console.error(`Error calling Gemini (attempt ${attempt + 1}/${retries}):`, error);
      throw error;
    }
  }

  // If we exhausted all retries
  throw lastError || new Error('Failed to call Gemini API after multiple attempts');
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
  const messages = [
    {
      role: 'system' as const,
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
      role: 'user' as const,
      content: `Parse this schedule: ${text}`,
    },
  ];

  try {
    const response = await callGemini(messages, 'gemini-2.5-flash');
    
    // Check if response is an error message (not JSON)
    if (!response.trim().startsWith('[') && !response.trim().startsWith('{')) {
      if (response.includes('API key') || response.includes('not available') || response.includes('not configured')) {
        throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file and restart the server.');
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


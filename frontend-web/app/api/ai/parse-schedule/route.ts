import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  
  return user;
}

// POST /api/ai/parse-schedule
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await getUserFromToken(request);
    
    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Schedule text is required' },
        { status: 400 }
      );
    }

    // Import and call the Gemini function server-side
    const { parseScheduleFromText } = await import('@/lib/gemini');
    const entries = await parseScheduleFromText(text);

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('Error parsing schedule:', error);
    const errorMessage = error.message || 'Failed to parse schedule';
    
    // Provide more helpful error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('Rate limit') || errorMessage.includes('429') || errorMessage.includes('rate-limited')) {
      userMessage = '⚠️ The free AI model is temporarily rate-limited. Please wait a few minutes and try again, or use the manual form to add your schedule.';
    } else if (errorMessage.includes('day_of_week')) {
      userMessage = 'The AI had trouble identifying the days. Please try being more explicit (e.g., "Monday", "Tuesday") or use the manual form.';
    } else if (errorMessage.includes('start_time') || errorMessage.includes('end_time')) {
      userMessage = 'The AI had trouble identifying the times. Please try a clearer format (e.g., "9am to 10am" or "5pm to 9pm").';
    } else if (errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY')) {
      userMessage = 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file and restart the server.';
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

// POST /api/ai/estimate-travel-costs
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await getUserFromToken(request);
    
    const body = await request.json();
    const { requests } = body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { error: 'Travel requests array is required' },
        { status: 400 }
      );
    }

    // Import and call the travel AI function server-side
    const { estimateTravelCostsServer } = await import('@/lib/travel-ai');
    const estimates = await estimateTravelCostsServer(requests);

    return NextResponse.json({ estimates });
  } catch (error: any) {
    console.error('Error estimating travel costs:', error);
    const errorMessage = error.message || 'Failed to estimate travel costs';
    
    // Provide user-friendly error messages
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
      statusCode = 503;
      userMessage = 'The AI service is temporarily overloaded. Please try again in a few moments.';
    } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      statusCode = 429;
      userMessage = errorMessage;
    } else if (errorMessage.includes('quota')) {
      statusCode = 429;
      userMessage = errorMessage;
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}


/**
 * Travel AI Cost Estimation
 * 
 * Uses Gemini AI to estimate travel costs with rate limiting
 */

interface TravelEstimateRequest {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  mode: 'flight' | 'train' | 'bus';
}

interface TravelEstimate {
  mode: string;
  estimatedCost: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

// Rate limiting: Store last call time
let lastCallTime: number = 0;
const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Check if enough time has passed since last call
 */
function canMakeCall(): boolean {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  return timeSinceLastCall >= RATE_LIMIT_MS;
}

/**
 * Get time remaining until next call is allowed
 */
export function getTimeUntilNextCall(): number {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  const remaining = RATE_LIMIT_MS - timeSinceLastCall;
  return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
}

/**
 * Estimate travel costs using AI
 * Rate limited to once every 2 minutes
 */
export async function estimateTravelCosts(
  requests: TravelEstimateRequest[]
): Promise<TravelEstimate[]> {
  // Check rate limit
  if (!canMakeCall()) {
    const secondsRemaining = getTimeUntilNextCall();
    throw new Error(`Rate limit: Please wait ${secondsRemaining} seconds before requesting cost estimates again.`);
  }

  // Update last call time
  lastCallTime = Date.now();

  try {
    // Get auth token for the API call
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to use AI features');
    }

    // Call server-side API route
    const response = await fetch('/api/ai/estimate-travel-costs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to estimate travel costs');
    }

    const data = await response.json();
    return data.estimates;
  } catch (error: any) {
    console.error('Error estimating travel costs:', error);
    throw error;
  }
}

// Server-side function (used by API route)
export async function estimateTravelCostsServer(
  requests: TravelEstimateRequest[]
): Promise<TravelEstimate[]> {
  try {
    // Import Gemini function
    const { callGemini } = await import('./gemini');

    // Build prompt for cost estimation
    const prompt = `Estimate travel costs for the following trips. Return ONLY a valid JSON array with cost estimates.

For each trip, provide:
- estimatedCost: { min, max, average } in USD
- confidence: "high", "medium", or "low" based on route popularity and data availability
- notes: brief explanation if needed

Trips to estimate:
${requests.map((req, idx) => {
  const returnInfo = req.returnDate ? `Return date: ${req.returnDate}` : 'One-way trip';
  return `${idx + 1}. ${req.mode.toUpperCase()}: ${req.origin} to ${req.destination} on ${req.date}. ${returnInfo}`;
}).join('\n')}

Consider:
- Flight costs vary by route popularity, time of year, advance booking
- Train costs are usually more stable
- Bus costs are typically the cheapest
- Return trips are usually cheaper per leg than two one-way tickets

Return format:
[
  {
    "mode": "flight",
    "estimatedCost": {
      "min": 150,
      "max": 400,
      "average": 275,
      "currency": "USD"
    },
    "confidence": "high",
    "notes": "Popular route, prices vary by booking time"
  }
]

Return ONLY valid JSON array, no markdown, no explanation.`;

    const messages = [
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const response = await callGemini(messages, 'gemini-2.5-flash');
    
    // Parse JSON response
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      } else {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
    }
    
    // Extract JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    const estimates: TravelEstimate[] = JSON.parse(jsonText);
    
    // Validate and return
    return estimates.map((est, idx) => ({
      mode: requests[idx]?.mode || est.mode,
      estimatedCost: {
        min: est.estimatedCost?.min || 0,
        max: est.estimatedCost?.max || 0,
        average: est.estimatedCost?.average || 0,
        currency: est.estimatedCost?.currency || 'USD',
      },
      confidence: est.confidence || 'medium',
      notes: est.notes,
    }));

  } catch (error: any) {
    console.error('Error estimating travel costs:', error);
    throw new Error(error.message || 'Failed to estimate travel costs');
  }
}


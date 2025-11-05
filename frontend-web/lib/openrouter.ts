/**
 * OpenRouter AI Integration
 * 
 * This utility provides easy access to OpenRouter's AI models
 * for features like smart recommendations, chat, and more.
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
 * Call OpenRouter API with a prompt
 * 
 * @param messages - Array of messages for the conversation
 * @param model - Model to use (default: gpt-3.5-turbo)
 * @returns Response from the AI model
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'openai/gpt-3.5-turbo'
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OpenRouter API key not found. Set OPENROUTER_API_KEY in your .env.local');
    return 'AI features are not available. Please configure your OpenRouter API key.';
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
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';

  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

/**
 * Generate smart travel recommendations
 * 
 * @param origin - Starting location
 * @param destination - Destination location
 * @param budget - User's budget (optional)
 * @returns AI-generated recommendations
 */
export async function getTravelRecommendations(
  origin: string,
  destination: string,
  budget?: number
): Promise<string> {
  const budgetText = budget ? ` with a budget of $${budget}` : '';
  
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful travel assistant for college students in long-distance relationships. Provide practical, budget-friendly advice.',
    },
    {
      role: 'user',
      content: `I need to travel from ${origin} to ${destination}${budgetText}. What are some tips and recommendations for this trip?`,
    },
  ];

  return await callOpenRouter(messages);
}

/**
 * Generate conversation starters for couples
 * 
 * @param context - Optional context about the couple (hobbies, interests, etc.)
 * @returns AI-generated conversation starters
 */
export async function getConversationStarters(context?: string): Promise<string> {
  const contextText = context ? ` They are interested in: ${context}.` : '';
  
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a relationship assistant helping long-distance couples stay connected. Generate thoughtful, engaging conversation starters.',
    },
    {
      role: 'user',
      content: `Generate 5 fun and meaningful conversation starters for a long-distance couple.${contextText}`,
    },
  ];

  return await callOpenRouter(messages);
}

/**
 * Generate date ideas for when couples meet
 * 
 * @param location - Where they're meeting
 * @param budget - Budget for the date (optional)
 * @param interests - Their shared interests (optional)
 * @returns AI-generated date ideas
 */
export async function getDateIdeas(
  location: string,
  budget?: number,
  interests?: string
): Promise<string> {
  const budgetText = budget ? ` with a budget of $${budget}` : '';
  const interestsText = interests ? ` They enjoy: ${interests}.` : '';
  
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a date planning assistant for couples. Suggest creative, memorable date ideas.',
    },
    {
      role: 'user',
      content: `Suggest 5 date ideas for a couple meeting in ${location}${budgetText}.${interestsText}`,
    },
  ];

  return await callOpenRouter(messages);
}

/**
 * Analyze schedules and suggest best meeting times
 * 
 * @param schedule1 - First person's schedule
 * @param schedule2 - Second person's schedule
 * @returns AI analysis and recommendations
 */
export async function analyzeSchedules(
  schedule1: string,
  schedule2: string
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a scheduling assistant. Analyze two schedules and suggest optimal times for video calls or visits.',
    },
    {
      role: 'user',
      content: `Here are two schedules:\n\nPerson 1: ${schedule1}\n\nPerson 2: ${schedule2}\n\nWhat are the best times for them to connect?`,
    },
  ];

  return await callOpenRouter(messages);
}

// Available models on OpenRouter (some popular ones)
export const AVAILABLE_MODELS = {
  GPT_3_5_TURBO: 'openai/gpt-3.5-turbo',
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  GPT_4: 'openai/gpt-4',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  LLAMA_3_70B: 'meta-llama/llama-3-70b-instruct',
  GEMINI_PRO: 'google/gemini-pro',
} as const;



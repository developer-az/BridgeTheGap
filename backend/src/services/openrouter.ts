/**
 * OpenRouter AI Integration - Backend
 * 
 * This service provides AI functionality for the backend API
 */

import axios from 'axios';

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
 * Call OpenRouter API
 * Uses FREE models by default to avoid costs
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'minimax/minimax-m2:free'
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OpenRouter API key not configured');
    throw new Error('OpenRouter API key not configured');
  }

  try {
    const response = await axios.post<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Bridge The Gap',
        },
      }
    );

    return response.data.choices[0]?.message?.content || 'No response';
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

/**
 * Generate travel recommendations
 */
export async function generateTravelRecommendations(
  origin: string,
  destination: string,
  budget?: number
): Promise<string> {
  const budgetText = budget ? ` with a budget of $${budget}` : '';
  
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful travel assistant for college students. Provide practical, budget-friendly advice.',
    },
    {
      role: 'user',
      content: `Travel recommendations from ${origin} to ${destination}${budgetText}. Include tips on best times to book, what to pack, and how to save money.`,
    },
  ];

  return await callOpenRouter(messages);
}

/**
 * Analyze mutual availability between two schedules
 */
export async function analyzeMutualAvailability(
  schedule1: any[],
  schedule2: any[]
): Promise<string> {
  const schedule1Text = schedule1.map(s => 
    `${s.day}: ${s.start_time}-${s.end_time} (${s.title})`
  ).join('\n');

  const schedule2Text = schedule2.map(s => 
    `${s.day}: ${s.start_time}-${s.end_time} (${s.title})`
  ).join('\n');

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a scheduling assistant. Analyze two weekly schedules and identify the best times for video calls.',
    },
    {
      role: 'user',
      content: `Schedule 1:\n${schedule1Text}\n\nSchedule 2:\n${schedule2Text}\n\nWhen are the best times for them to video call?`,
    },
  ];

  return await callOpenRouter(messages);
}

/**
 * Generate date ideas
 */
export async function generateDateIdeas(
  location: string,
  interests?: string[]
): Promise<string> {
  const interestsText = interests?.length 
    ? ` They enjoy: ${interests.join(', ')}.` 
    : '';

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a date planning expert. Suggest creative, memorable activities for couples.',
    },
    {
      role: 'user',
      content: `Suggest 5 date ideas in ${location}.${interestsText} Include both indoor and outdoor options.`,
    },
  ];

  return await callOpenRouter(messages);
}



# 🤖 OpenRouter AI Integration - Location Guide

## 📍 Where the AI Integration Files Are

### Frontend (Client-Side)
**Location:** `frontend-web/lib/openrouter.ts`

**Available Functions:**
- `callOpenRouter()` - Direct API call
- `getTravelRecommendations()` - AI travel tips
- `getDateIdeas()` - Date planning suggestions
- `getConversationStarters()` - Relationship conversation prompts
- `analyzeSchedules()` - Schedule optimization

### Backend (Server-Side)
**Location:** `backend/src/services/openrouter.ts`

**Available Functions:**
- `callOpenRouter()` - Direct API call
- `generateTravelRecommendations()` - Server-side travel tips
- `analyzeMutualAvailability()` - Schedule analysis
- `generateDateIdeas()` - Date planning

---

## 🚨 Current Status

**⚠️ The AI integration is SET UP but NOT YET USED in any pages!**

The code is ready, but you need to:
1. Import the functions in your pages/components
2. Call them when needed
3. Display the results

---

## 💡 How to Use It

### Example 1: Add AI Travel Tips to Travel Page

**File:** `frontend-web/app/travel/page.tsx`

```typescript
import { getTravelRecommendations } from '@/lib/openrouter';

// Add state
const [aiTips, setAiTips] = useState<string>('');
const [loadingTips, setLoadingTips] = useState(false);

// Add function
const fetchAITips = async () => {
  if (!origin || !destination) return;
  
  setLoadingTips(true);
  try {
    const tips = await getTravelRecommendations(origin, destination);
    setAiTips(tips);
  } catch (error) {
    console.error('Error getting AI tips:', error);
  }
  setLoadingTips(false);
};

// Call after search
useEffect(() => {
  if (results) {
    fetchAITips();
  }
}, [results]);

// Display in UI
{aiTips && (
  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
    <h3 className="font-bold mb-2">🤖 AI Travel Tips</h3>
    <p className="text-sm">{aiTips}</p>
  </div>
)}
```

### Example 2: Add Date Ideas to Dashboard

**File:** `frontend-web/app/dashboard/page.tsx`

```typescript
import { getDateIdeas } from '@/lib/openrouter';

// Add to a partner card
const handleGetDateIdeas = async (partner: User) => {
  const location = `${partner.location_city}, ${partner.location_state}`;
  const ideas = await getDateIdeas(location, 50);
  alert(ideas); // Or show in a modal
};
```

### Example 3: Add Schedule Analysis

**File:** `frontend-web/app/schedule/page.tsx`

```typescript
import { analyzeSchedules } from '@/lib/openrouter';

// When viewing mutual availability
const analyzeWithAI = async () => {
  const schedule1 = formatSchedule(yourSchedule);
  const schedule2 = formatSchedule(partnerSchedule);
  const analysis = await analyzeSchedules(schedule1, schedule2);
  // Display analysis
};
```

---

## 🎯 Quick Integration Ideas

### 1. Travel Page (`/travel`)
- Add "Get AI Tips" button after search
- Show AI recommendations below results
- Suggest best times to book

### 2. Dashboard (`/dashboard`)
- "AI Date Ideas" button for each partner
- "Conversation Starters" section
- "Schedule Analysis" for mutual availability

### 3. Schedule Page (`/schedule`)
- "AI Schedule Optimizer" button
- Analyze best video call times
- Suggest visit windows

### 4. Connections Page (`/connections`)
- "Get Conversation Starters" for new connections
- AI-powered icebreakers

---

## 📝 Environment Setup

**Required:** `OPENROUTER_API_KEY` in `.env.local`

**Current Status:** ✅ Already configured!

Your key is in:
- `frontend-web/.env.local`
- `backend/.env`

---

## 🔧 Available Models

You can use different AI models:

```typescript
import { AVAILABLE_MODELS, callOpenRouter } from '@/lib/openrouter';

// Use GPT-4
const response = await callOpenRouter(messages, AVAILABLE_MODELS.GPT_4);

// Use Claude
const response = await callOpenRouter(messages, AVAILABLE_MODELS.CLAUDE_3_SONNET);

// Use cheapest (Claude Haiku)
const response = await callOpenRouter(messages, AVAILABLE_MODELS.CLAUDE_3_HAIKU);
```

---

## 📚 Full Function Reference

### Frontend (`frontend-web/lib/openrouter.ts`)

```typescript
// Basic call
callOpenRouter(messages, model?)

// Travel
getTravelRecommendations(origin, destination, budget?)

// Dates
getDateIdeas(location, budget?, interests?)

// Conversations
getConversationStarters(context?)

// Schedules
analyzeSchedules(schedule1, schedule2)
```

### Backend (`backend/src/services/openrouter.ts`)

```typescript
// Basic call
callOpenRouter(messages, model?)

// Travel
generateTravelRecommendations(origin, destination, budget?)

// Schedules
analyzeMutualAvailability(schedule1, schedule2)

// Dates
generateDateIdeas(location, interests?)
```

---

## 🚀 Next Steps

1. **Choose a page** to add AI features
2. **Import** the function you need
3. **Add UI** to trigger and display results
4. **Test** with your OpenRouter key

**Recommended:** Start with the Travel page - add AI tips after a search!

---

## 📖 Documentation

- **Setup Guide:** `OPENROUTER_SETUP_COMPLETE.md`
- **Quick Start:** `QUICK_START_OPENROUTER.md`
- **Security:** `SECURITY_NOTICE.md`

---

**The AI integration is ready - just needs to be connected to your UI!** 🎉




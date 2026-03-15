export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Prompt {
  id: number;
  title: string;
  description: string;
  content: string;
  category_id: number;
  category_name: string;
  tags: string;
  created_at: string;
  updated_at: string;
  views: number;
  copies: number;
  is_public: number;
}

export interface AdminStats {
  totalPrompts: number;
  totalViews: number;
  totalCopies: number;
  recentPrompts: Prompt[];
}

// ─── New: AI Provider Types ────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'cohere' | 'mistral';

export const AI_PROVIDERS: { value: AIProvider; label: string; defaultModel: string }[] = [
  { value: 'openai',     label: 'OpenAI',     defaultModel: 'gpt-4o-mini' },
  { value: 'anthropic',  label: 'Anthropic',  defaultModel: 'claude-3-5-haiku-20241022' },
  { value: 'gemini',     label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' },
  { value: 'groq',       label: 'Groq',       defaultModel: 'llama-3.1-8b-instant' },
  { value: 'cohere',     label: 'Cohere',     defaultModel: 'command-r-plus-08-2024' },
  { value: 'mistral',    label: 'Mistral',    defaultModel: 'mistral-small-latest' },
];

export interface ApiKey {
  id: number;
  label: string;
  provider: AIProvider;
  masked_key: string;   // e.g. "sk-abc1••••••••9xyz"
  default_model: string | null;
  is_active: number;
  created_at: string;
}

export interface TestHistoryEntry {
  id: number;
  prompt_id: number;
  prompt_title: string;
  api_key_id: number;
  key_label: string;
  provider: AIProvider;
  model_used: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

export interface PromptTestResult {
  response: string;
  tokens_used: number;
  model: string;
}

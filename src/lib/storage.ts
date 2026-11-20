export type Provider = 'openrouter' | 'google';

export const GOOGLE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];

export interface Settings {
  provider: Provider;
  googleKey: string;
  googleModel: string;
  openRouterKey: string;
  selectedModel: string;
  enabled: boolean;
  debounceSeconds: number;
  aggressiveness: number;
  mode: 'casual' | 'professional' | 'academic';
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'openrouter',
  googleKey: '',
  googleModel: 'gemini-3.5-flash-lite',
  openRouterKey: '',
  selectedModel: 'openrouter/free',
  enabled: true,
  debounceSeconds: 5,
  aggressiveness: 0.5,
  mode: 'professional',
};

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  const storedSettings = result.settings || {};
  const merged = { ...DEFAULT_SETTINGS, ...storedSettings };
  // Retired models: migrate existing users to a replacement
  if (!GOOGLE_MODELS.includes(merged.googleModel)) {
    merged.googleModel = DEFAULT_SETTINGS.googleModel;
  }
  return merged;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    settings: { ...current, ...settings },
  });
}

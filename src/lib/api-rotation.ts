'use client';

/**
 * API Key utilities for Gemini.
 * Now uses a single API key - no rotation needed.
 */
export function getCurrentApiKeyIndex(): number {
  return 0;
}

export function getApiKeyDisplayName(index: number): string {
  return 'Gemini API';
}

export function getTimeUntilNextRotation(): string {
  return '--:--';
}

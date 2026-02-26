'use client';

/**
 * Utility to get the current API key based on the hour.
 * There are 7 keys, rotating every hour.
 */
export function getCurrentApiKeyIndex(): number {
  const now = new Date();
  const utcHours = now.getUTCHours();
  // We have 7 keys, so we cycle through 0-6
  return utcHours % 7;
}

export function getApiKeyDisplayName(index: number): string {
  return `Key ${index + 1}`;
}

export function getTimeUntilNextRotation(): string {
  const now = new Date();
  const minutes = 59 - now.getUTCMinutes();
  const seconds = 59 - now.getUTCSeconds();
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

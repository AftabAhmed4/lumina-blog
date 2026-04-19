import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: number | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function estimateReadingTime(text: string) {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Ensures that URLs don't point to localhost:3000 if we are in a production/cloud environment.
 * Also handles relative paths correctly.
 */
export function cleanURL(url: string | undefined | null) {
  if (!url) return '';
  
  // If the URL is already absolute but not pointing to this origin, keep it (like external images)
  // But if it points to localhost:3000 specifically, and we are not on localhost, strip it.
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return url.replace(/^https?:\/\/localhost:3000/, '');
  }
  
  return url;
}

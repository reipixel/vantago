const DEFAULT_API_URL = 'https://vantago-api.onrender.com';

export function getCleanApiUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  url = url.replace(/[\[\]\(\)\s]/g, '');
  if (url.startsWith('https:/') && !url.startsWith('https://')) {
    url = url.replace('https:/', 'https://');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

export const API_URL = getCleanApiUrl();
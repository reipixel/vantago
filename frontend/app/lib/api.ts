export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://vantago-api.onrender.com';
  url = url.replace(/[\[\]\(\)\s]/g, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

export const API_URL = getApiBaseUrl();
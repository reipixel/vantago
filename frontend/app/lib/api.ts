// Função que limpa e valida a URL base da API
export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://vantago-api.onrender.com';

  // Remove caracteres de Markdown (colchetes e parenteses) e espacos
  url = url.replace(/[\[\]\(\)\s]/g, '');

  // Se a string contiver duas URLs concatenadas por Markdown, pega apenas a primeira ocorrencia limpa
  if (url.includes('http')) {
    const match = url.match(/(https?:\/\/[^\/\s]+)/);
    if (match) {
      url = match[1];
    }
  }

  // Garante o protocolo https:// correto
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/+$/, ''); // Remove barra no final se houver
}

export const API_URL = getApiBaseUrl();
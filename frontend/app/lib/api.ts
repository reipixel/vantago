// Define a URL base da API a partir de variável de ambiente ou fallback de produção da Hostinger
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com';

/**
 * Utilitário para formatar URLs trocando 'http://localhost:3000' pela URL de produção
 */
export function getApiUrl(endpoint: string): string {
  if (!endpoint) return API_URL;
  
  // Se for uma URL absoluta apontando para localhost, substitui pela URL da API na Hostinger
  if (endpoint.startsWith('http://localhost:3000') || endpoint.startsWith('http://127.0.0.1:3000')) {
    return endpoint.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, API_URL);
  }

  // Se for um caminho relativo (ex: /planos ou /uploads/imagem.jpg)
  if (endpoint.startsWith('/')) {
    return `${API_URL}${endpoint}`;
  }

  return endpoint;
}
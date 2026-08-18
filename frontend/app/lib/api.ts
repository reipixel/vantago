// ============================================================================
// CENTRALIZADOR DA API
// Se amanhã o servidor mudar, você altera a URL apenas na variável de ambiente
// ou neste único fallback padrão abaixo.
// ============================================================================

export function getCleanApiUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://vantago-api.onrender.com';
  
  // Limpa caracteres indesejados (colchetes, parênteses, espaços)
  url = url.replace(/[\[\]\(\)\s]/g, '');

  // Garante a formatação do protocolo https://
  if (url.startsWith('https:/') && !url.startsWith('https://')) {
    url = url.replace('https:/', 'https://');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Remove barra no final se houver
  return url.replace(/\/+$/, '');
}

export const API_URL = getCleanApiUrl();

// Interceptor Global de Fetch para redirecionar requisições para a API em Produção
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const targetApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com';

  window.fetch = async function (...args) {
    let [resource, config] = args;
    if (typeof resource === 'string') {
      if (resource.includes('localhost:3000') || resource.includes('127.0.0.1:3000')) {
        resource = resource.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, targetApiUrl);
      }
    }
    return originalFetch(resource, config);
  };
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga dos Associados",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
import { redirect } from 'next/navigation'

export default async function PaginaLiga({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Redireciona diretamente para a tela de login do portal passando a liga como contexto
  redirect(`/portal/login?liga=${slug}`)
}
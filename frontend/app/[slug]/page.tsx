import { use } from 'react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function PainelAssociado({ params }: PageProps) {
  // No Next.js 15+, o 'params' deve ser desembrulhado com React.use() ou await
  const { slug } = use(params)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Painel da Liga</h1>
      <p className="mt-2 text-slate-500">
        Acessando contexto da liga: <span className="text-yellow-500 font-mono font-bold">{slug}</span>
      </p>
    </div>
  )
}
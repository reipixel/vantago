'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ListaAtividadesPortal() {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  const [atividades, setAtividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<any>(null)

  useEffect(() => {
    // Constrói a URL passando a liga como parâmetro e nos cabeçalhos multi-tenant
    const url = slug 
      ? `http://localhost:3000/atividades?liga=${slug}` 
      : process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/atividades'

    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(slug ? { 'X-Organization-Slug': slug } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        const apenasAtivas = Array.isArray(data) 
          ? data.filter((at: any) => at.status === 'ativa') 
          : []
        setAtividades(apenasAtivas)
      })
      .catch(err => console.error("Erro ao carregar atividades:", err))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="animate-in fade-in duration-700 pb-28">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Ações Disponíveis</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">
          Como acumular pontos na Liga {slug ? `(${slug})` : ''}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-slate-50 animate-pulse rounded-[40px] border border-slate-100"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {atividades.map((acao: any) => (
            <div key={acao.id} className="bg-white p-0 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all group relative overflow-hidden flex flex-col">
              
              {/* Imagem e Pontos */}
              <div className="h-48 w-full relative overflow-hidden">
                {acao.imagem_p ? (
                  <img 
                    src={`http://localhost:3000${acao.imagem_p}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={acao.nome} 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-5xl">
                    <i className="fas fa-tasks"></i>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 bg-indigo-600 text-white px-5 py-2 rounded-2xl font-black italic shadow-xl z-10">
                  +{acao.pontos} <span className="text-[10px] not-italic opacity-70">PTS</span>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-black text-slate-800 uppercase italic text-xl leading-tight mb-2">
                    {acao.nome}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                      <i className="fas fa-map-marker-alt"></i> {acao.local}
                    </span>
                    {acao.dataHora && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="far fa-calendar-alt"></i> 
                        {new Date(acao.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Disponível
                  </span>
                  
                  <button 
                    onClick={() => setAtividadeSelecionada(acao)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-slate-200"
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {atividadeSelecionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAtividadeSelecionada(null)}></div>
          
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setAtividadeSelecionada(null)} className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
              <i className="fas fa-times"></i>
            </button>

            <div className="h-64 w-full relative">
              {atividadeSelecionada.imagem_p ? (
                <img src={`http://localhost:3000${atividadeSelecionada.imagem_p}`} className="w-full h-full object-cover" alt={atividadeSelecionada.nome} />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-5xl"><i className="fas fa-tasks"></i></div>
              )}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
            </div>

            <div className="p-8 md:p-12 -mt-10 relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black italic text-sm">+{atividadeSelecionada.pontos} PTS</span>
                <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest"><i className="fas fa-map-marker-alt mr-2"></i> {atividadeSelecionada.local}</span>
                {atividadeSelecionada.dataHora && (
                  <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest"><i className="far fa-calendar-alt mr-2"></i> {new Date(atividadeSelecionada.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic leading-none mb-8">{atividadeSelecionada.nome}</h2>

              <div className="prose prose-slate max-w-none">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mb-4">Descrição da Atividade</h4>
                <div className="text-slate-500 text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: atividadeSelecionada.descricao }} />
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setAtividadeSelecionada(null)} 
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Fechar Janela
                </button>
                
                {/* BOTÃO DE AÇÃO PARAMETRIZADO */}
                { (atividadeSelecionada.exibirBotaoAcao === true || atividadeSelecionada.exibirBotaoAcao === "true") && atividadeSelecionada.linkBotao && (
                  <a 
                    href={atividadeSelecionada.linkBotao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-external-link-alt text-[10px]"></i>
                    {atividadeSelecionada.textoBotao || 'Participar'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {atividades.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
           <i className="fas fa-ghost text-4xl text-slate-200 mb-4"></i>
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma atividade ativa no momento para esta liga.</p>
        </div>
      )}
    </div>
  )
}
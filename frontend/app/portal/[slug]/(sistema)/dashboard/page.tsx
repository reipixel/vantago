'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PortalDashboard() {
  const params = useParams()
  const slug = (params?.slug as string) || 'liga-fiel'

  const [nome, setNome] = useState('Associado')
  const [saldo, setSaldo] = useState(0)
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para as Trocas Sugeridas Dinâmicas
  const [destaquePrincipal, setDestaquePrincipal] = useState<any>(null)
  const [outrasSugestoes, setOutrasSugestoes] = useState([])

  useEffect(() => {
    // 1. Busca primeiro no storage multi-tenant da liga
    const sessionKey = `@associado_session_${slug}`
    const userData = localStorage.getItem(sessionKey) || localStorage.getItem('associado_data')
    
    if (userData) {
      const user = JSON.parse(userData)
      const userObj = user.user || user
      
      if (userObj) {
        setNome(userObj.nome ? userObj.nome.split(' ')[0] : 'Associado')
        setSaldo(userObj.saldo_pontos || 0)
        carregarDados(userObj.id)
      }
    }
  }, [slug])

  const carregarDados = async (userId: number) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Organization-Slug': slug
      }

      // 2. Busca Histórico, Configurações Isoladas por Liga e Catálogo
      const [resHist, resConfig, resProdutos] = await Promise.all([
        fetch(`http://127.0.0.1:3000/usuarios/${userId}/historico`, { headers }),
        fetch(`http://127.0.0.1:3000/configuracoes/1?liga=${slug}`, { headers }),
        fetch(`http://127.0.0.1:3000/produtos?liga=${slug}`, { headers })
      ])

      if (resHist.ok) {
        setHistorico(await resHist.json())
      }
      
      if (resConfig.ok && resProdutos.ok) {
        const config = await resConfig.json()
        const produtos = await resProdutos.json()

        const listaProdutos = Array.isArray(produtos) ? produtos : []

        // Mapeia o item principal definido na configuração da liga
        if (config?.troca_principal_id) {
          const principal = listaProdutos.find((p: any) => p.id === Number(config.troca_principal_id))
          if (principal) setDestaquePrincipal(principal)
        }

        // Mapeia as outras 3 sugestões
        const sugestoesIds = [
          Number(config?.sugestao_1_id), 
          Number(config?.sugestao_2_id), 
          Number(config?.sugestao_3_id)
        ].filter(Boolean)

        if (sugestoesIds.length > 0) {
          const listaSugestoes = listaProdutos.filter((p: any) => sugestoesIds.includes(p.id))
          setOutrasSugestoes(listaSugestoes)
        }
      }

    } catch (err) { 
      console.error("Erro ao carregar dados do portal:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  const calcularProgresso = (preco: number) => {
    if (!preco) return { percent: 0, faltam: 0 }
    const percent = Math.min(Math.round((saldo / preco) * 100), 100)
    const faltam = Math.max(preco - saldo, 0)
    return { percent, faltam }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
      
      {/* Banner Boas-vindas */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2 italic uppercase">Fala, {nome}! 👋</h2>
          <p className="text-indigo-100 font-medium opacity-80 max-w-sm text-sm leading-relaxed">
            Seu saldo de <span className="font-black text-white">{saldo} pts</span> está crescendo! Confira as trocas sugeridas para você hoje.
          </p>
        </div>
        <i className="fas fa-rocket absolute -right-6 -bottom-6 text-9xl text-white/10 rotate-12"></i>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUNA 1: HISTÓRICO DE PONTOS */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[3px]">Histórico de Pontos</h3>
            <Link href={`/portal/${slug}/extrato`} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">
              Ver extrato
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-3xl w-full"></div>)}
              </div>
            ) : historico.length > 0 ? (
              historico.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[24px] border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.valor > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'} rounded-2xl flex items-center justify-center`}>
                      <i className={`fas ${item.valor > 0 ? 'fa-plus-circle' : 'fa-shopping-cart'} text-xs`}></i>
                    </div>
                    <div>
                      <p className="font-black text-slate-700 text-sm italic leading-tight">{item.motivo}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${item.valor > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {item.valor > 0 ? `+${item.valor}` : item.valor}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase italic">Nenhuma atividade recente registrada.</p>
            )}
          </div>
        </div>

        {/* COLUNA 2: TROCAS SUGERIDAS */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[3px] mb-8">Trocas Sugeridas</h3>
            
            {destaquePrincipal ? (
              <Link href={`/portal/${slug}/trocas`} className="group block">
                {/* Visual do Destaque Principal */}
                <div className="bg-slate-50 rounded-[35px] p-2 mb-6 border border-slate-100 overflow-hidden group-hover:border-indigo-200 transition-all">
                  <div className="bg-white h-48 rounded-[30px] flex items-center justify-center shadow-inner shadow-slate-100 relative overflow-hidden">
                    {destaquePrincipal.imagem_p ? (
                      <img 
                        src={`http://127.0.0.1:3000${destaquePrincipal.imagem_p}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={destaquePrincipal.nome} 
                      />
                    ) : (
                      <span className="text-6xl text-slate-200"><i className="fas fa-gift"></i></span>
                    )}
                  </div>
                </div>

                <div className="px-2">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h4 className="font-black text-slate-800 text-xl italic leading-tight uppercase group-hover:text-indigo-600 transition-colors">
                      {destaquePrincipal.nome}
                    </h4>
                    <span className="bg-amber-100 text-amber-600 text-[10px] px-3 py-1 rounded-full font-black uppercase shrink-0">
                      {destaquePrincipal.preco_pontos} pts
                    </span>
                  </div>
                  
                  {/* Barra de Progresso Real */}
                  <div className="space-y-2 mt-6 mb-8">
                    {(() => {
                      const { percent, faltam } = calcularProgresso(destaquePrincipal.preco_pontos);
                      return (
                        <>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{percent}% Alcançado</span>
                            <span className="text-[9px] font-bold text-slate-400">
                              {faltam > 0 ? `Faltam ${faltam} pts` : 'Disponível para troca!'}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-48 bg-slate-50 rounded-[35px] flex items-center justify-center text-slate-300 font-bold uppercase text-[10px] italic mb-6 border border-dashed border-slate-200">
                Aguardando indicação da liga...
              </div>
            )}

            {/* Lista das 3 Sugestões Adicionais */}
            {outrasSugestoes.length > 0 && (
              <div className="space-y-3 mb-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Outras Opções para você</p>
                {outrasSugestoes.map((item: any) => (
                  <Link key={item.id} href={`/portal/${slug}/trocas`} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border border-slate-100 shrink-0">
                        {item.imagem_p ? (
                          <img src={`http://127.0.0.1:3000${item.imagem_p}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200 text-xs"><i className="fas fa-box"></i></div>
                        )}
                      </div>
                      <span className="font-black text-slate-700 text-xs truncate uppercase italic">{item.nome}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 italic whitespace-nowrap ml-2">
                      {item.preco_pontos} pts
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <Link 
              href={`/portal/${slug}/trocas`} 
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
              <i className="fas fa-th-large text-[10px]"></i>
              Explorar Catálogo Completo
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ListaAtividades() {
  const router = useRouter()
  const [atividades, setAtividades] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  // Captura de forma segura o slug de contexto da URL atual do navegador
  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    carregarAtividades()
  }, [])

  const carregarAtividades = async () => {
    setLoading(true)
    try {
      const liga = obterSlugLigaContexto()
      // BLINDAGEM DO F5: Envia explicitamente o contexto da liga para o filtro no NestJS
      const url = liga 
        ? `http://localhost:3000/atividades?liga=${liga}` 
        : process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/atividades'

      const res = await fetch(url)
      const data = await res.json()
      setAtividades(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Erro ao carregar atividades")
    } finally {
      setLoading(false)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta atividade? Isso não afetará os pontos já distribuídos.")) return
    
    try {
      const res = await fetch(`http://localhost:3000/atividades/${id}`, { method: 'DELETE' })
      if (res.ok) carregarAtividades()
    } catch (err) {
      alert("Erro ao excluir atividade.")
    }
  }

  const atividadesFiltradas = atividades.filter((at: any) => 
    at.nome.toLowerCase().includes(busca.toLowerCase()) ||
    at.status.toLowerCase().includes(busca.toLowerCase())
  )

  const liga = obterSlugLigaContexto()

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* HEADER E AÇÕES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">Atividades</h1>
          <p className="text-slate-400 font-medium">Configure as ações que bonificam seus associados.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
            <input 
              type="text"
              placeholder="Filtrar atividades..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Link 
            href={liga ? `/admin/dashboard/atividades/novo?liga=${liga}` : "/admin/dashboard/atividades/novo"}
            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg whitespace-nowrap uppercase tracking-widest"
          >
            + Nova Atividade
          </Link>
        </div>
      </div>

      {/* TABELA DE ATIVIDADES */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
            <tr>
              <th className="px-10 py-5">Atividade</th>
              <th className="px-10 py-5">Status</th>
              <th className="px-10 py-5 text-center">Valor</th>
              <th className="px-10 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {!loading && atividadesFiltradas.map((ativ: any) => (
              <tr key={ativ.id} className="hover:bg-slate-50/30 transition-all group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    {/* MINIATURA DA IMAGEM */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 shadow-inner">
                      {ativ.imagem_p ? (
                        <img 
                          src={`http://localhost:3000${ativ.imagem_p}`} 
                          className="w-full h-full object-cover"
                          alt={ativ.nome}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase italic">{ativ.nome}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 flex items-center gap-3">
                        <span><i className="far fa-calendar-alt mr-1"></i> {ativ.dataHora ? new Date(ativ.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data Flexível'}</span>
                        <span><i className="fas fa-map-marker-alt mr-1"></i> {ativ.local}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ativ.status === 'ativa' ? 'bg-emerald-100 text-emerald-600' : 
                    ativ.status === 'encerrada' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {ativ.status}
                  </span>
                </td>
                <td className="px-10 py-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-black border border-slate-100 text-sm italic">
                    {ativ.pontos} <span className="text-[10px] text-slate-300 not-italic">PTS</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        const urlEdicao = liga 
                          ? `/admin/dashboard/atividades/novo?id=${ativ.id}&liga=${liga}` 
                          : `/admin/dashboard/atividades/novo?id=${ativ.id}`;
                        router.push(urlEdicao);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all"
                      title="Editar"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleExcluir(ativ.id)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      title="Excluir"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase text-xs tracking-widest">Buscando atividades...</div>
        ) : atividadesFiltradas.length === 0 && (
          <div className="py-20 text-center">
            <i className="fas fa-tasks text-4xl text-slate-100 mb-4"></i>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma atividade encontrada para esta liga.</p>
          </div>
        )}
      </div>
    </div>
  )
}
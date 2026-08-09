'use client'
import { useEffect, useState } from 'react'

interface LogItem {
  id: string
  tipo: 'cadastro' | 'pontos' | 'troca'
  categoria: string
  titulo: string
  descricao: string
  liga: string
  slug: string
  data: string
  badgeColor: string
}

export default function LogsSistema() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  useEffect(() => {
    carregarLogs()
  }, [])

  const carregarLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error("Erro ao carregar logs:", err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const logsFiltrados = logs.filter(log => {
    const matchBusca = 
      log.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      log.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      log.liga.toLowerCase().includes(busca.toLowerCase())
    
    const matchTipo = filtroTipo === 'todos' || log.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'cadastro':
        return <i className="fas fa-user-plus text-emerald-600"></i>
      case 'pontos':
        return <i className="fas fa-coins text-amber-500"></i>
      case 'troca':
        return <i className="fas fa-gift text-purple-600"></i>
      default:
        return <i className="fas fa-list text-slate-400"></i>
    }
  }

  const getCorBadge = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
            Logs do Sistema
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">
            Histórico em tempo real de cadastros, movimentações e resgates
          </p>
        </div>

        <button
          onClick={carregarLogs}
          className="bg-white border border-slate-100 text-slate-700 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
        >
          <i className="fas fa-sync-alt text-slate-400"></i>
          Atualizar
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input
            type="text"
            placeholder="Filtrar por associado, ação ou liga..."
            className="w-full pl-12 pr-4 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <select
          className="bg-white px-6 rounded-[24px] border border-slate-100 shadow-sm outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer appearance-none"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="todos">Todos os Eventos</option>
          <option value="cadastro">Cadastros</option>
          <option value="pontos">Pontuações</option>
          <option value="troca">Trocas / Resgates</option>
        </select>
      </div>

      {/* LISTA DE LOGS */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
            Carregando registros de auditoria...
          </div>
        ) : logsFiltrados.length > 0 ? (
          <div className="space-y-4">
            {logsFiltrados.map(log => (
              <div
                key={log.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-lg mt-0.5">
                    {getIconeTipo(log.tipo)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCorBadge(log.badgeColor)}`}>
                        {log.categoria}
                      </span>
                      {log.liga && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          • {log.liga}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-800 text-sm italic">{log.titulo}</h4>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{log.descricao}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">
                    {new Date(log.data).toLocaleDateString('pt-BR')} às {new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <i className="fas fa-history text-4xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
              Nenhuma movimentação encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
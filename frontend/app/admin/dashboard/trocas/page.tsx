'use client'
import { useEffect, useState } from 'react'

export default function AdminGerenciarTrocas() {
  const [trocas, setTrocas] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados dos Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  useEffect(() => {
    carregarTrocas()
  }, [])

  // Lógica de Filtragem em Tempo Real
  useEffect(() => {
    let resultado = trocas.filter((t: any) => {
      const nomeAssociado = t.usuario?.nome?.toLowerCase() || ''
      const nomeProduto = t.produto?.nome?.toLowerCase() || ''
      const termo = busca.toLowerCase()
      
      return nomeAssociado.includes(termo) || nomeProduto.includes(termo)
    })

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter((t: any) => t.status === filtroStatus)
    }

    setFiltrados(resultado)
  }, [busca, filtroStatus, trocas])

  const carregarTrocas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/produtos/admin/pedidos?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setTrocas(data)
        setFiltrados(data)
      }
    } catch (err) { 
      console.error("Erro ao carregar trocas:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  const mudarStatus = async (id: number, novoStatus: string) => {
    const msg = novoStatus === 'cancelado' ? 'CANCELAR e ESTORNAR PONTOS' : novoStatus.toUpperCase()
    if (!confirm(`Deseja alterar o status para ${msg}?`)) return

    try {
      const res = await fetch(`http://localhost:3000/produtos/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      if (res.ok) carregarTrocas()
    } catch (err) { 
      alert("Erro ao atualizar status") 
    }
  }

  return (
    <div className="animate-in fade-in duration-500 p-4">
      
      {/* HEADER E CONTADORES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">
            Gestão de Trocas
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mt-2 italic">
            Controle Operacional de Resgates
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-amber-50 border border-amber-100 px-5 py-2 rounded-2xl shadow-sm">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Pendentes</span>
            <span className="text-xl font-black text-amber-700 leading-none">
              {trocas.filter((t: any) => t.status === 'pendente').length}
            </span>
          </div>
          <div className="bg-indigo-600 px-5 py-2 rounded-2xl shadow-lg shadow-indigo-100">
            <span className="text-[9px] font-black text-indigo-100 uppercase tracking-widest block">Total</span>
            <span className="text-xl font-black text-white leading-none">{trocas.length}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-3 relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Buscar por Associado ou Produto..." 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-[24px] border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-600 transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        <div className="relative">
           <select 
            className="w-full bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-sm outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer appearance-none"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos Status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associado</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center animate-pulse font-black text-slate-200 uppercase tracking-[4px]">Sincronizando...</td></tr>
            ) : filtrados.length > 0 ? (
              filtrados.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-700 text-sm italic uppercase leading-none mb-1">{t.usuario?.nome}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{t.usuario?.id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-indigo-600 text-sm italic uppercase">{t.produto?.nome}</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase">Resgatado em {new Date(t.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-700 text-sm bg-slate-100 px-3 py-1 rounded-lg">
                      {t.pontos_utilizados} <span className="text-[8px] opacity-50">PTS</span>
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-[8px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest inline-block shadow-sm ${
                      t.status === 'pendente' ? 'bg-amber-100 text-amber-600' :
                      t.status === 'aprovado' ? 'bg-emerald-100 text-emerald-600' :
                      t.status === 'entregue' ? 'bg-indigo-600 text-white shadow-indigo-100' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {t.status === 'pendente' && (
                        <button onClick={() => mudarStatus(t.id, 'aprovado')} className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/btn">
                          <i className="fas fa-check group-hover/btn:scale-110 transition-transform"></i>
                        </button>
                      )}
                      {t.status === 'aprovado' && (
                        <button onClick={() => mudarStatus(t.id, 'entregue')} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/btn">
                          <i className="fas fa-box-open group-hover/btn:scale-110 transition-transform"></i>
                        </button>
                      )}
                      {(t.status === 'pendente' || t.status === 'aprovado') && (
                        <button onClick={() => mudarStatus(t.id, 'cancelado')} className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/btn">
                          <i className="fas fa-ban group-hover/btn:scale-110 transition-transform"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-[4px] italic">
                     Nenhuma troca corresponde aos filtros aplicados.
                   </p>
                   <button 
                    onClick={() => {setBusca(''); setFiltroStatus('todos')}}
                    className="mt-4 text-[9px] font-black text-indigo-600 uppercase border-b border-indigo-200"
                   >
                     Limpar busca
                   </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
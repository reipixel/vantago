'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function ExtratoPontos() {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  const [historico, setHistorico] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('associado_data') || '{}')
    if (userData.id) carregarExtrato(userData.id)
  }, [slug])

  useEffect(() => {
    let resultado = historico.filter((item: any) => 
      item.motivo?.toLowerCase().includes(busca.toLowerCase())
    )

    if (filtroTipo === 'ganho') resultado = resultado.filter((item: any) => Number(item.valor) > 0)
    if (filtroTipo === 'gasto') resultado = resultado.filter((item: any) => Number(item.valor) < 0)

    setFiltrados(resultado)
  }, [busca, filtroTipo, historico])

  const carregarExtrato = async (userId: number) => {
    setLoading(true)
    try {
      let url = `${API_URL}/usuarios/${userId}/extrato-completo?t=${Date.now()}`
      if (slug) {
        url += `&liga=${slug}`
      }

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(slug ? { 'X-Organization-Slug': slug } : {})
        }
      })

      if (res.ok) {
        const data = await res.json()
        setHistorico(data)
        setFiltrados(data)
      }
    } catch (err) { 
      console.error("Erro ao carregar extrato:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="animate-in fade-in duration-700 pb-28">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Extrato de Pontos</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">
            Confira toda sua movimentação na liga {slug ? `(${slug})` : ''}
          </p>
        </div>
        <button 
          onClick={() => {
            const userData = JSON.parse(localStorage.getItem('associado_data') || '{}')
            if (userData.id) carregarExtrato(userData.id)
          }}
          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
          title="Atualizar"
        >
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Buscar por motivo..." 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-[24px] border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-600 transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="relative">
          <select 
            className="w-full bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-sm outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 appearance-none cursor-pointer"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="todos">Todas as Entradas</option>
            <option value="ganho">Apenas Ganhos (+)</option>
            <option value="gasto">Apenas Trocas (-)</option>
          </select>
          <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse font-black text-slate-200 uppercase tracking-[4px]">Sincronizando...</div>
        ) : filtrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Lançamento</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor (PTS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-8 py-6 text-xs font-bold text-slate-400 italic">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${item.valor > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          <i className={`fas ${item.valor > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                        </div>
                        <p className="text-sm font-black text-slate-700 italic uppercase tracking-tight">
                          {item.motivo}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-mono">
                      <span className={`text-base font-black px-4 py-1 rounded-xl ${item.valor > 0 ? 'text-emerald-600 bg-emerald-50/50' : 'text-red-600 bg-red-50/50'}`}>
                        {item.valor > 0 ? `+${item.valor}` : item.valor}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <i className="fas fa-receipt text-slate-200 text-3xl"></i>
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[4px]">Nenhum lançamento no radar</p>
          </div>
        )}
      </div>
    </div>
  )
}
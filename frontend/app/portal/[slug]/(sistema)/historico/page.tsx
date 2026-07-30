'use client'
import { useEffect, useState } from 'react'

export default function HistoricoTrocas() {
  const [pedidos, setPedidos] = useState([])
  const [pedidosFiltrados, setPedidosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados dos Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('associado_data') || '{}')
    if (userData.id) carregarPedidos(userData.id)
  }, [])

  // Lógica de Filtragem em tempo real
  useEffect(() => {
    let resultado = pedidos.filter(p => 
      p.produto?.nome.toLowerCase().includes(busca.toLowerCase())
    )

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(p => p.status === filtroStatus)
    }

    setPedidosFiltrados(resultado)
  }, [busca, filtroStatus, pedidos])

  const carregarPedidos = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/produtos/pedidos/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setPedidos(data)
        setPedidosFiltrados(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-700'
      case 'aprovado': return 'bg-emerald-100 text-emerald-700'
      case 'entregue': return 'bg-indigo-100 text-indigo-700'
      case 'cancelado': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Minhas Trocas</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">Gerencie e acompanhe seus resgates</p>
      </div>

      {/* ÁREA DE FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            type="text" 
            placeholder="Buscar por nome do produto..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-600 transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        <select 
          className="py-4 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-black text-[10px] uppercase tracking-widest text-slate-600 appearance-none cursor-pointer"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* LISTA DE RESULTADOS */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-[35px] animate-pulse border border-slate-50"></div>)}
        </div>
      ) : pedidosFiltrados.length > 0 ? (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido: any) => (
            <div key={pedido.id} className="bg-white p-5 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center text-2xl overflow-hidden border border-slate-100 shadow-inner">
                  {pedido.produto?.imagem_p ? (
                    <img src={`http://localhost:3000${pedido.produto.imagem_p}`} className="w-full h-full object-cover" alt="Produto" />
                  ) : <i className="fas fa-gift text-slate-200 text-sm"></i>}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 italic uppercase text-[13px] leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                    {pedido.produto?.nome}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {new Date(pedido.data_solicitacao).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">ID: #{pedido.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs font-black text-slate-800 mb-2 leading-none">-{pedido.pontos_utilizados} PTS</p>
                <span className={`text-[8px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-sm ${getStatusColor(pedido.status)}`}>
                  {pedido.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-white rounded-[50px] border border-dashed border-slate-200 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-search text-slate-200 text-xl"></i>
          </div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[4px]">Nenhum resultado encontrado</p>
          <button onClick={() => {setBusca(''); setFiltroStatus('todos')}} className="mt-4 text-[9px] font-black text-indigo-600 uppercase border-b border-indigo-200">Limpar filtros</button>
        </div>
      )}
    </div>
  )
}
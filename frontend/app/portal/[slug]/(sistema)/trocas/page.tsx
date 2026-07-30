'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function CatalogoTrocas() {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  const [itens, setItens] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [saldo, setSaldo] = useState(0)
  
  const [busca, setBusca] = useState('')
  const [categoriaSel, setCategoriaSel] = useState('todos')
  const [modalItem, setModalItem] = useState<any>(null)

  useEffect(() => {
    // 1. Busca os dados da sessão isolada da liga
    const sessionKey = slug ? `@associado_session_${slug}` : 'associado_data'
    const rawData = localStorage.getItem(sessionKey) || localStorage.getItem('associado_data')
    const userData = rawData ? JSON.parse(rawData) : {}
    const userObj = userData.user || userData

    if (userObj && userObj.id) {
      setSaldo(userObj.saldo_pontos || 0)
      carregarDados(userObj.id)
    } else {
      setLoading(false)
    }
  }, [slug])

  const carregarDados = async (userId: number) => {
    setLoading(true)
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(slug ? { 'X-Organization-Slug': slug } : {})
      }

      // Parâmetros de tenant para isolamento do catálogo por liga
      const queryLiga = slug ? `&liga=${slug}` : ''

      const [resProd, resCat, resPed] = await Promise.all([
        fetch(`http://localhost:3000/produtos?ativos=true${queryLiga}&t=${new Date().getTime()}`, { headers }),
        fetch(`http://localhost:3000/produtos/categorias?t=${new Date().getTime()}${queryLiga}`, { headers }),
        fetch(`http://localhost:3000/produtos/pedidos/${userId}`, { headers })
      ])

      if (resProd.ok) {
        const data = await resProd.json()
        setItens(Array.isArray(data) ? data : [])
      }
      if (resCat.ok) {
        const catData = await resCat.json()
        setCategorias(Array.isArray(catData) ? catData : [])
      }
      if (resPed.ok) {
        const pedData = await resPed.json()
        setPedidos(Array.isArray(pedData) ? pedData : [])
      }
    } catch (err) {
      console.error("Erro no fetch do catálogo:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTrocar = async (item: any) => {
    if (saldo < item.preco_pontos) {
      alert("Saldo insuficiente.")
      return
    }

    if (!confirm(`Confirmar resgate de ${item.nome}?`)) {
      return
    }

    try {
      const sessionKey = slug ? `@associado_session_${slug}` : 'associado_data'
      const rawData = localStorage.getItem(sessionKey) || localStorage.getItem('associado_data')
      const userData = rawData ? JSON.parse(rawData) : {}
      const userObj = userData.user || userData

      if (!userObj?.id) {
        alert("Sessão inválida. Por favor, faça login novamente.")
        return
      }

      const payload = {
        usuarioId: userObj.id,
        produtoId: item.id
      }

      const res = await fetch('http://localhost:3000/produtos/resgatar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(slug ? { 'X-Organization-Slug': slug } : {})
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        alert("✨ Solicitação de troca enviada com sucesso!")
        
        // Atualiza o saldo localmente
        setSaldo(prev => prev - item.preco_pontos)
        setModalItem(null)

        // Adiciona a nova troca no estado local para feedback instantâneo no card
        setPedidos((prev: any) => [
          ...prev, 
          { id: data.id, status: data.status || 'pendente', produto: { id: item.id } }
        ])
        
        // Recarrega os dados completos do servidor
        await carregarDados(userObj.id)
      } else {
        alert(data.message || "Erro ao processar o resgate.")
      }
    } catch (err) {
      console.error("Erro no resgate:", err)
      alert("Erro de conexão ao processar o resgate.")
    }
  }

  const itensFiltrados = itens.filter((item: any) => {
    const matchBusca = item.nome ? item.nome.toLowerCase().includes(busca.toLowerCase()) : false
    const matchCat = categoriaSel === 'todos' || item.categoria?.id === Number(categoriaSel)
    return matchBusca && matchCat
  })

  const getPedidoExistente = (produtoId: number) => {
    return pedidos.find((p: any) => p.produto?.id === produtoId)
  }

  return (
    <div className="animate-in fade-in duration-700 pb-28">
      
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Catálogo</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">
            Escolha sua próxima conquista {slug ? `na Liga (${slug})` : ''}
          </p>
        </div>
        <Link href={`/portal/${slug}/historico`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:bg-indigo-600 transition-all">
          <i className="fas fa-history text-indigo-600 group-hover:text-white transition-colors"></i>
          <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-white tracking-widest">Minhas Trocas</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="md:col-span-2 relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="O que você está procurando?" 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-[24px] border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        <select 
          className="bg-white px-6 rounded-[24px] border border-slate-100 shadow-sm outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer appearance-none"
          value={categoriaSel}
          onChange={(e) => setCategoriaSel(e.target.value)}
        >
          <option value="todos">Todas Categorias</option>
          {categorias.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-white rounded-[40px] animate-pulse shadow-sm border border-slate-50"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {itensFiltrados.map((item: any) => {
            const pedido = getPedidoExistente(item.id);
            const isEsgotado = item.estoque <= 0;

            return (
              <div key={item.id} className={`bg-white rounded-[40px] p-5 border border-slate-100 shadow-sm flex flex-col group transition-all hover:shadow-xl relative overflow-hidden ${isEsgotado ? 'opacity-75' : ''}`}>
                
                {pedido && (
                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-center py-2 z-20">
                    <span className="text-[9px] font-black uppercase tracking-widest italic">
                        Troca Solicitada: {pedido.status}
                    </span>
                  </div>
                )}

                {!pedido && isEsgotado && (
                  <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-20">
                    <span className="text-[9px] font-black uppercase tracking-widest italic">
                        Produto Esgotado
                    </span>
                  </div>
                )}

                <div className={`bg-slate-50 h-56 rounded-[32px] mb-6 flex items-center justify-center text-6xl relative overflow-hidden mt-4 ${isEsgotado ? 'grayscale bg-slate-200' : ''}`}>
                  <div className={`absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm z-10 font-black text-xs ${isEsgotado ? 'text-slate-400' : 'text-indigo-600'}`}>
                    {item.preco_pontos} PTS
                  </div>
                  {item.imagem_p ? (
                    <img src={`http://localhost:3000${item.imagem_p}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={item.nome} />
                  ) : <span className="group-hover:rotate-12 transition-all duration-500">🎁</span>}
                </div>

                <h3 className={`font-black text-slate-800 text-lg italic uppercase leading-tight mb-6 px-2 ${isEsgotado ? 'text-slate-400' : ''}`}>{item.nome}</h3>
                
                <button 
                  onClick={() => setModalItem(item)}
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${isEsgotado ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'}`}
                >
                  {isEsgotado ? 'Indisponível' : 'Saiba Mais'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE DETALHES E SOLICITAÇÃO */}
      {modalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalItem(null)}></div>
          
          <div className="bg-white w-full max-w-xl rounded-[45px] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setModalItem(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all z-20"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className={`h-64 bg-slate-100 relative ${modalItem.estoque <= 0 ? 'grayscale' : ''}`}>
              {modalItem.imagem_g ? (
                <img src={`http://localhost:3000${modalItem.imagem_g}`} className="w-full h-full object-cover" alt={modalItem.nome} />
              ) : <div className="w-full h-full flex items-center justify-center text-8xl">🎁</div>}
            </div>

            <div className="p-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">
                    {modalItem.categoria?.nome || 'Geral'}
                  </span>
                  <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none">{modalItem.nome}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600">{modalItem.preco_pontos}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pontos Necessários</p>
                </div>
              </div>

              <div 
                className="text-slate-500 font-medium text-sm leading-relaxed mb-10 overflow-y-auto max-h-40 pr-2 custom-scrollbar"
                dangerouslySetInnerHTML={{ __html: modalItem.descricao }}
              />

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleTrocar(modalItem)}
                  disabled={
                    saldo < modalItem.preco_pontos || 
                    getPedidoExistente(modalItem.id) || 
                    modalItem.estoque <= 0
                  }
                  className={`flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] transition-all shadow-xl ${
                    saldo >= modalItem.preco_pontos && !getPedidoExistente(modalItem.id) && modalItem.estoque > 0
                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {getPedidoExistente(modalItem.id) 
                    ? `Status: ${getPedidoExistente(modalItem.id).status}` 
                    : modalItem.estoque <= 0 
                      ? 'Produto Esgotado' 
                      : saldo >= modalItem.preco_pontos 
                        ? 'Confirmar Troca' 
                        : 'Saldo Insuficiente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itensFiltrados.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
           <i className="fas fa-box-open text-4xl text-slate-200 mb-4"></i>
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum produto cadastrado no catálogo desta liga.</p>
        </div>
      )}
    </div>
  )
}
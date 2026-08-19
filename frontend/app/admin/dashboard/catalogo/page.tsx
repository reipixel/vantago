'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_URL } from '../../../../lib/api'

export default function ListagemCatalogo() {
  const [itens, setItens] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null)
  
  const [busca, setBusca] = useState('')
  const [categoriaFiltrada, setCategoriaFiltrada] = useState('todas')
  
  // SOLUÇÃO HYDRATION: Mantém a liga em estado para sincronizar o HTML do Servidor com o Cliente
  const [liga, setLiga] = useState<string | null>(null)

  // Captura de forma segura o slug de contexto da URL atual do navegador
  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    // Sincroniza a liga no cliente primeiro para evitar quebras visuais no build
    const slugDetectado = obterSlugLigaContexto()
    setLiga(slugDetectado)
    carregarDados(slugDetectado)
  }, [])

  const carregarDados = async (slugLiga?: string | null) => {
    setLoading(true)
    try {
      const contextoLiga = slugLiga !== undefined ? slugLiga : obterSlugLigaContexto()
      
      const urlProdutos = contextoLiga 
        ? `${API_URL}/produtos?t=${Date.now()}&liga=${contextoLiga}`
        : `${API_URL}/produtos?t=${Date.now()}`
        
      const urlCategorias = contextoLiga
        ? `${API_URL}/produtos/categorias?liga=${contextoLiga}`
        : `${API_URL}/produtos/categorias`

      const [resItens, resCats] = await Promise.all([
        fetch(urlProdutos),
        fetch(urlCategorias)
      ])
      
      const dadosProdutos = await resItens.json()
      const dadosCategorias = await resCats.json()

      // BLINDAGEM CONTRA CRASH: Se a API não devolver um Array válido, define como lista vazia []
      setItens(Array.isArray(dadosProdutos) ? dadosProdutos : [])
      setCategorias(Array.isArray(dadosCategorias) ? dadosCategorias : [])
    } catch (err) { 
      console.error(err)
      setItens([])
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  // Edição Rápida inline para STATUS (com persistência multi-tenant)
  const handleStatusUpdate = async (id: number, novoStatus: string) => {
    setAtualizandoId(id)
    try {
      const contextoLiga = obterSlugLigaContexto()
      let url = `${API_URL}/produtos/${id}`
      if (contextoLiga) url += `?liga=${contextoLiga}`

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      if (res.ok) {
        setItens(itens.map((i: any) => i.id === id ? { ...i, status: novoStatus } : i))
      }
    } catch (err) {
      alert("Erro ao atualizar status")
    } finally {
      setAtualizandoId(null)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!confirm('Remover permanentemente?')) return
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' })
    if (res.ok) setItens(itens.filter((i: any) => i.id !== id))
  }

  // Estatísticas baseadas no estado local já filtrado
  const totalCadastrados = itens.length
  const totalAtivos = itens.filter((i: any) => i.status === 'ativo' || !i.status).length
  const totalCategorias = categorias.length

  const itensFiltrados = itens.filter((item: any) => {
    const matchesBusca = item.nome?.toLowerCase().includes(busca.toLowerCase())
    const matchesCategoria = categoriaFiltrada === 'todas' || item.categoria?.id === Number(categoriaFiltrada)
    return matchesBusca && matchesCategoria
  })

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Catálogo</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">Administração de Inventário</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* PROPAGAÇÃO DE LINKS: Passa adiante o parâmetro multi-tenant nas sub-rotas usando o estado seguro */}
          <Link 
            href={liga ? `/admin/dashboard/catalogo/categorias?liga=${liga}` : "/admin/dashboard/catalogo/categorias"} 
            className="px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <i className="fas fa-tags text-sm"></i> 
            <span>Categorias</span>
          </Link>

          <Link 
            href={liga ? `/admin/dashboard/catalogo/novo?liga=${liga}` : "/admin/dashboard/catalogo/novo"} 
            className="px-8 py-4 rounded-2xl bg-amber-500 text-white font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> 
            <span>Novo Item</span>
          </Link>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Cadastrados</p>
          <div className="text-3xl font-black text-slate-800 italic">{loading ? '...' : totalCadastrados}</div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Ativos no Portal</p>
          <div className="text-3xl font-black text-slate-800 italic">{loading ? '...' : totalAtivos}</div>
        </div>
        
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Total Categorias</p>
          <div className="text-3xl font-black text-slate-800 italic">{loading ? '...' : totalCategorias}</div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text"
            placeholder="Buscar por nome..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-600 text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer outline-none appearance-none min-w-[200px]"
          value={categoriaFiltrada}
          onChange={(e) => setCategoriaFiltrada(e.target.value)}
        >
          <option value="todas">Todas Categorias</option>
          {categorias.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
        </select>
      </div>

      {/* TABELA DE GESTÃO */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estoque</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Preço</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                  Carregando catálogo de produtos...
                </td>
              </tr>
            ) : itensFiltrados.length > 0 ? (
              itensFiltrados.map((item: any) => (
                <tr key={item.id} className={`hover:bg-slate-50/40 transition-colors ${atualizandoId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                        <img 
                          src={item.imagem_p ? (item.imagem_p.startsWith('http') ? item.imagem_p : `${API_URL}${item.imagem_p}`) : '/placeholder.png'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                      <div>
                        <p className="font-black text-slate-700 uppercase italic text-sm leading-tight truncate max-w-[200px]">{item.nome}</p>
                        <p className="text-[9px] font-black text-amber-500 mt-1 uppercase tracking-widest">{item.categoria?.nome || 'Sem Categoria'}</p>
                      </div>
                    </div>
                  </td>

                  {/* STATUS EDITÁVEL INLINE */}
                  <td className="px-6 py-5 text-center">
                    <select 
                      value={item.status || 'ativo'}
                      onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${
                        item.status === 'inativo' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </td>

                  {/* ESTOQUE */}
                  <td className="px-6 py-5 text-center">
                    <span className={`text-sm font-bold ${item.estoque <= 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                      {item.estoque} <span className="text-[10px] font-black opacity-30">UN</span>
                    </span>
                  </td>

                  {/* PREÇO */}
                  <td className="px-6 py-5 text-center">
                    <span className="font-black text-slate-800 text-sm">
                      {item.preco_pontos} <span className="text-[10px] text-amber-500">PTS</span>
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={liga ? `/admin/dashboard/catalogo/editar/${item.id}?liga=${liga}` : `/admin/dashboard/catalogo/editar/${item.id}`} 
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <i className="fas fa-pencil-alt text-xs"></i>
                      </Link>
                      <button onClick={() => handleExcluir(item.id)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                  Nenhum produto cadastrado para esta liga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
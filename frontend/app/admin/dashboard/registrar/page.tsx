'use client'
import { useState, useEffect } from 'react'
import { API_URL } from '@/app/lib/api'

export default function RegistrarPontos() {
  const [associados, setAssociados] = useState([])
  const [atividades, setAtividades] = useState([])
  const [buscaAssoc, setBuscaAssoc] = useState('')
  const [buscaAtiv, setBuscaAtiv] = useState('')
  const [idsSelecionados, setIdsSelecionados] = useState<number[]>([])
  const [atividadeId, setAtividadeId] = useState('')
  const [loading, setLoading] = useState(false)

  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const liga = obterSlugLigaContexto()
      const urlAssoc = liga ? `${API_URL}/usuarios/associados?liga=${liga}` : `${API_URL}/usuarios/associados`
      const urlAtiv = liga ? `${API_URL}/atividades?liga=${liga}` : `${API_URL}/atividades`

      const [resAssoc, resAtiv] = await Promise.all([
        fetch(urlAssoc),
        fetch(urlAtiv)
      ])

      const dataAssoc = await resAssoc.json()
      const dataAtiv = await resAtiv.json()

      setAssociados(Array.isArray(dataAssoc) ? dataAssoc : [])
      setAtividades(Array.isArray(dataAtiv) ? dataAtiv : [])
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setAssociados([])
      setAtividades([])
    }
  }

  // Filtragem Associados
  const filtradosAssoc = associados.filter((a: any) => 
    a.nome?.toLowerCase().includes(buscaAssoc.toLowerCase()) || 
    a.email?.toLowerCase().includes(buscaAssoc.toLowerCase())
  )

  // Filtragem Atividades
  const filtradasAtiv = atividades.filter((at: any) => 
    at.nome?.toLowerCase().includes(buscaAtiv.toLowerCase())
  )

  const handleToggleUsuario = (id: number) => {
    setIdsSelecionados(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelecionarFiltrados = () => {
    const novosIds = filtradosAssoc.map((a: any) => a.id)
    setIdsSelecionados(prev => Array.from(new Set([...prev, ...novosIds])))
  }

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (idsSelecionados.length === 0 || !atividadeId) return alert("Selecione os membros e a atividade.")

    setLoading(true)
    try {
      const liga = obterSlugLigaContexto()
      let url = `${API_URL}/atividades/registrar`
      if (liga) url += `?liga=${liga}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(liga ? { 'X-Organization-Slug': liga } : {})
        },
        body: JSON.stringify({
          usuariosIds: idsSelecionados,
          atividadeId: Number(atividadeId)
        })
      })

      if (res.ok) {
        alert(`✨ Sucesso! Pontos registrados para ${idsSelecionados.length} associados.`)
        setIdsSelecionados([])
        setAtividadeId('')
        setBuscaAssoc('')
        fetchData() // Atualiza os saldos na tela
      } else {
        const errData = await res.json()
        alert(errData.message || "Erro ao registrar pontos.")
      }
    } catch (err) {
      alert("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Registrar Participação</h1>
        <p className="text-slate-400 font-medium mt-1 text-designer uppercase text-[10px] tracking-[3px]">Gestão de Pontuação em Massa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA 1: ASSOCIADOS (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                1. Associados Selecionados: <span className="text-amber-500">{idsSelecionados.length}</span>
              </h2>
              <div className="flex gap-4">
                <button onClick={handleSelecionarFiltrados} className="text-[10px] font-black text-indigo-600 uppercase hover:opacity-70 transition-all">Selecionar Filtrados</button>
                <button onClick={() => setIdsSelecionados([])} className="text-[10px] font-black text-red-500 uppercase hover:opacity-70 transition-all">Limpar Tudo</button>
              </div>
            </div>

            <div className="relative mb-6">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="text" placeholder="Filtrar membros por nome ou e-mail..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                value={buscaAssoc} onChange={(e) => setBuscaAssoc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filtradosAssoc.map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => handleToggleUsuario(a.id)}
                  className={`flex items-center justify-between p-5 rounded-[28px] border-2 transition-all text-left ${
                    idsSelecionados.includes(a.id) ? 'border-amber-500 bg-amber-50' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`min-w-[24px] h-6 rounded-lg border-2 flex items-center justify-center ${idsSelecionados.includes(a.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-200 bg-white'}`}>
                      {idsSelecionados.includes(a.id) && <i className="fas fa-check text-[10px] text-white"></i>}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-black text-slate-700 truncate">{a.nome}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-tighter">{a.email}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col items-end min-w-[70px]">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Saldo</span>
                    <span className="text-xs font-black text-slate-600">{Number(a.saldo_pontos || 0).toLocaleString('pt-BR')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: ATIVIDADES (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full flex flex-col">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 text-center">2. Atividade Realizada</h2>
            
            <div className="relative mb-4">
              <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <input 
                type="text" placeholder="Filtrar atividades..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                value={buscaAtiv} onChange={(e) => setBuscaAtiv(e.target.value)}
              />
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
              {filtradasAtiv.map((ativ: any) => (
                <label 
                  key={ativ.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    Number(atividadeId) === ativ.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'
                  }`}
                >
                  <input type="radio" name="ativ" className="hidden" value={ativ.id} onChange={e => setAtividadeId(e.target.value)} />
                  <div className="flex flex-col pr-2">
                    <span className="text-xs font-black text-slate-700 leading-tight">{ativ.nome}</span>
                    <span className="text-[10px] font-bold text-amber-600 mt-1">+{ativ.pontos} pts</span>
                  </div>
                  {Number(atividadeId) === ativ.id && <i className="fas fa-check-circle text-amber-500"></i>}
                </label>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
                 <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2">Total Estimado</div>
                 <div className="text-3xl font-black text-amber-400 mb-6">
                    {idsSelecionados.length * (atividades.find((a: any) => a.id === Number(atividadeId))?.pontos || 0)}
                 </div>
                 <button 
                  onClick={handleRegistrar}
                  disabled={loading || idsSelecionados.length === 0 || !atividadeId}
                  className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-20"
                >
                  {loading ? 'Gravando...' : 'Confirmar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
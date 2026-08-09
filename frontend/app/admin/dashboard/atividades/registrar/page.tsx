'use client'
import { useState, useEffect } from 'react'

export default function RegistrarPontos() {
  const [usuarios, setUsuarios] = useState([])
  const [atividades, setAtividades] = useState([])
  const [busca, setBusca] = useState('')
  const [atividadeId, setAtividadeId] = useState('')
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/usuarios').then(res => res.json()),
      fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/atividades').then(res => res.json())
    ]).then(([userData, ativData]) => {
      setUsuarios(userData)
      setAtividades(ativData.filter((a: any) => a.status === 'ativa'))
    })
  }, [])

  // Filtra os usuários conforme a busca (nome ou email)
  const usuariosFiltrados = usuarios.filter((u: any) =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  const toggleUsuario = (id: number) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selecionados.length === 0) return alert("Selecione ao menos um associado.")
    
    setLoading(true)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/atividades/registrar-multiplo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atividadeId, usuariosIds: selecionados }),
      })

      if (res.ok) {
        alert(`🎉 Sucesso! Pontos creditados para ${selecionados.length} associados.`)
        setSelecionados([])
        setBusca('')
      }
    } catch (error) {
      alert('Erro ao processar pontos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700 pb-20">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Registro em Lote</h1>
      <p className="text-slate-500 mb-8 italic">Selecione a atividade e marque os participantes.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: ATIVIDADE */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4">1. Atividade Realizada</label>
            <div className="space-y-3">
              {atividades.map((a: any) => (
                <label key={a.id} className={`flex items-center p-3 rounded-2xl border cursor-pointer transition-all ${atividadeId === String(a.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="ativ" 
                    className="hidden" 
                    value={a.id} 
                    onChange={(e) => setAtividadeId(e.target.value)} 
                  />
                  <div>
                    <p className={`text-sm font-bold ${atividadeId === String(a.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{a.nome}</p>
                    <p className="text-[10px] font-mono text-indigo-400">+{a.pontos} pontos</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || !atividadeId || selecionados.length === 0}
            className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-30 disabled:shadow-none"
          >
            {loading ? 'Creditando...' : `Confirmar (${selecionados.length})`}
          </button>
        </div>

        {/* COLUNA DIREITA: BUSCA E LISTA DE USUÁRIOS */}
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-4 text-slate-300"></i>
            <input 
              type="text"
              placeholder="Pesquisar por nome ou e-mail..."
              className="w-full p-4 pl-12 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Associado</th>
                  <th className="px-6 py-4 text-right">Selecionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuariosFiltrados.map((u: any) => (
                  <tr 
                    key={u.id} 
                    onClick={() => toggleUsuario(u.id)}
                    className={`cursor-pointer transition-colors ${selecionados.includes(u.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 text-sm">{u.nome}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-all ${selecionados.includes(u.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
                        {selecionados.includes(u.id) && <i className="fas fa-check text-white text-[10px]"></i>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
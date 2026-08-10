'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com'

export default function GestaoPlanos() {
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ id: null, nome: '', descricao: '', limiteAssociados: 0, precoMensal: 0 })

  const carregarPlanos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/planos`)
      const data = await res.json()
      setPlanos(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error('Erro ao carregar planos:', err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { carregarPlanos() }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = form.id ? 'PATCH' : 'POST'
    const url = form.id ? `${API_URL}/planos/${form.id}` : `${API_URL}/planos`

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        carregarPlanos()
      } else {
        console.error('Erro na resposta da API ao salvar plano:', res.status)
      }
    } catch (err) {
      console.error('Erro ao conectar com a API:', err)
    }
  }

  const handleDeletar = async (id: number) => {
    if (confirm("Excluir este plano?")) {
      try {
        const res = await fetch(`${API_URL}/planos/${id}`, { method: 'DELETE' })
        if (res.ok) carregarPlanos()
      } catch (err) {
        console.error('Erro ao excluir plano:', err)
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic leading-none">Planos e Assinaturas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-2">Gestão de Tiers e Limites</p>
        </div>
        <button 
          onClick={() => {
            setForm({ id: null, nome: '', descricao: '', limiteAssociados: 0, precoMensal: 0 })
            setShowModal(true)
          }}
          className="bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition shadow-lg active:scale-95"
        >
          + Novo Plano
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-[40px] border border-slate-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/80 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-slate-700">
            <tr>
              <th className="px-8 py-5">Nome do Plano</th>
              <th className="px-8 py-5">Limite de Sócios</th>
              <th className="px-8 py-5">Preço Mensal</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center animate-pulse uppercase text-xs font-black text-slate-500">Sincronizando...</td></tr>
            ) : planos.map((plano: any) => (
              <tr key={plano.id} className="hover:bg-slate-800/40 transition group">
                <td className="px-8 py-6">
                  <div className="font-black text-slate-200 uppercase italic text-lg">{plano.nome}</div>
                  <div className="text-[10px] text-slate-500">ID: #{plano.id}</div>
                </td>
                <td className="px-8 py-6 font-bold text-slate-400">
                  <span className="text-white">{plano.limiteAssociados}</span> usuários
                </td>
                <td className="px-8 py-6 font-black text-yellow-500 italic text-xl">
                  R$ {plano.precoMensal}
                </td>
                <td className="px-8 py-6 text-right space-x-2">
                  <button 
                    onClick={() => { setForm(plano); setShowModal(true); }}
                    className="p-3 bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDeletar(plano.id)}
                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleSalvar} className="bg-slate-900 border border-slate-800 w-full max-w-md p-10 rounded-[40px] space-y-6">
            <h2 className="text-2xl font-black text-white uppercase italic mb-8">{form.id ? 'Editar Plano' : 'Novo Plano'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                <input required className="w-full mt-2 p-5 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição (Apenas interna)</label>
                <textarea className="w-full mt-2 p-5 bg-slate-800 border-none rounded-2xl font-medium text-slate-300 outline-none h-24 focus:ring-2 ring-yellow-500" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Limite Sócios</label>
                  <input required type="number" className="w-full mt-2 p-5 bg-slate-800 border-none rounded-2xl font-black text-yellow-500" value={form.limiteAssociados} onChange={e => setForm({...form, limiteAssociados: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço</label>
                  <input required type="number" className="w-full mt-2 p-5 bg-slate-800 border-none rounded-2xl font-black text-yellow-500" value={form.precoMensal} onChange={e => setForm({...form, precoMensal: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">Cancelar</button>
              <button type="submit" className="flex-[2] bg-yellow-500 text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-yellow-500/10">Gravar Plano</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
'use client'
import { useEffect, useState, use } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditarUsuario() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liga, setLiga] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '', 
    perfil: 'associado'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const slug = params.get('liga')
      setLiga(slug)

      let url = `http://localhost:3000/usuarios/${id}`
      if (slug) url += `?liga=${slug}`

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setFormData({ 
            nome: data.nome || '', 
            email: data.email || '', 
            senha: '', 
            perfil: data.perfil || 'associado' 
          })
          setLoading(false)
        }).catch(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let url = `http://localhost:3000/usuarios/${id}`
      if (liga) url += `?liga=${liga}`

      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil,
      }
      if (formData.senha.trim()) {
        payload.senha = formData.senha
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        alert('✅ Dados atualizados!')
        router.push(liga ? `/admin/dashboard/usuarios?liga=${liga}` : '/admin/dashboard/usuarios')
      }
    } catch (error) {
      alert('❌ Erro ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Carregando dados...</div>

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-6">
        <button onClick={() => router.push(liga ? `/admin/dashboard/usuarios?liga=${liga}` : '/admin/dashboard/usuarios')} className="text-slate-400 hover:text-indigo-600 font-bold text-sm mb-2 flex items-center gap-2">
          <i className="fas fa-arrow-left"></i> Cancelar
        </button>
        <h1 className="text-2xl font-black text-slate-800">Editar Associado</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo</label>
          <input type="text" required value={formData.nome} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail</label>
          <input type="email" required value={formData.email} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-xl outline-none font-bold text-slate-700" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>

        {/* CAMPO FORÇADO EM BLOCO VERTICAL */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
          <label className="text-xs font-black text-amber-700 uppercase tracking-wider block mb-1">Nova Senha (Opcional)</label>
          <input type="password" value={formData.senha} className="w-full p-4 bg-white border border-amber-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-amber-500" placeholder="Deixe em branco para manter a atual" onChange={(e) => setFormData({...formData, senha: e.target.value})} />
        </div>

        <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase text-xs tracking-wider hover:bg-indigo-700 transition-all">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NovoUsuario() {
  const [enviando, setEnviando] = useState(false)
  const [liga, setLiga] = useState<string | null>(null)
  const router = useRouter()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '', 
    perfil: 'associado',
    saldo_pontos: 0
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setLiga(params.get('liga'))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senha.trim()) return alert('Defina uma senha de acesso para o associado.')
    setEnviando(true);
    
    try {
      let url = 'http://localhost:3000/usuarios'
      if (liga) url += `?liga=${liga}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('✅ Associado cadastrado com sucesso!');
        router.push(liga ? `/admin/dashboard/usuarios?liga=${liga}` : '/admin/dashboard/usuarios');
      } else {
        const erro = await response.json();
        alert(`❌ Erro: ${erro.message || 'Falha ao cadastrar.'}`);
      }
    } catch (error) {
      alert('❌ Erro na conexão com a API.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-indigo-600 font-bold text-sm mb-2 flex items-center gap-2">
          <i className="fas fa-arrow-left"></i> Voltar
        </button>
        <h1 className="text-2xl font-black text-slate-800">Novo Associado</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo</label>
          <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" placeholder="Ex: Reinaldo Santos" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail</label>
          <input type="email" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" placeholder="email@exemplo.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>

        {/* CAMPO FORÇADO EM BLOCO VERTICAL */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
          <label className="text-xs font-black text-amber-700 uppercase tracking-wider block mb-1">Senha de Acesso (Obrigatório)</label>
          <input type="password" required minLength={6} className="w-full p-4 bg-white border border-amber-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-amber-500" placeholder="Mínimo de 6 dígitos" onChange={(e) => setFormData({...formData, senha: e.target.value})} />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Perfil</label>
          <div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-500">Associado</div>
        </div>

        <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase text-xs tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50">
          {enviando ? 'Cadastrando...' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  )
}
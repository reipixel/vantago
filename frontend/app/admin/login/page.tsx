'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function LoginAdmin() {
  const router = useRouter()
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/usuarios/login-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, senha })
      })

      if (res.ok) {
        const data = await res.json()
        // GRAVA O TOKEN QUE O LAYOUT EXIGE
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_nome', data.user.nome)
        
        router.replace('/admin/dashboard')
      } else {
        alert('❌ Acesso negado. Verifique seus dados.')
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <div className="bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40">
            <i className="fas fa-trophy text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">LIGA <span className="font-light text-slate-400">Gestão</span></h1>
          <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[40px] shadow-2xl space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Usuário ou E-mail</label>
            <input 
              required
              type="text"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              placeholder="admin@teste.com"
              value={identificador}
              onChange={e => setIdentificador(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
            <div className="relative">
              <input 
                required
                type={verSenha ? "text" : "password"}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setVerSenha(!verSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors"
              >
                <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black hover:bg-amber-600 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 text-xs font-medium">
          Sistema de Fidelização e Gamificação &copy; 2026
        </p>
      </div>
    </div>
  )
}
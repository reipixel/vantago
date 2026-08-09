'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginAssociado() {
  const router = useRouter()
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  // Se já estiver logado e entrar na tela de login, manda pro dashboard
  useEffect(() => {
    if (localStorage.getItem('associado_token')) {
      router.replace('/portal/dashboard')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/usuarios/login-associado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, senha })
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('associado_token', data.token)
        localStorage.setItem('associado_data', JSON.stringify(data.user))
        router.replace('/portal/dashboard')
      } else {
        alert('❌ Dados incorretos.')
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <i className="fas fa-trophy text-indigo-600 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">LIGA <span className="text-indigo-200 font-light">portal</span></h1>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail ou CPF</label>
            <input 
              required type="text"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              value={identificador} onChange={e => setIdentificador(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
            <div className="relative">
              <input 
                required type={verSenha ? "text" : "password"}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={senha} onChange={e => setSenha(e.target.value)}
              />
              <button type="button" onClick={() => setVerSenha(!verSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
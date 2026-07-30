'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function LoginAssociadoPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const res = await fetch(`http://localhost:3000/usuarios/login-associado?liga=${slug}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Organization-Slug': slug 
        },
        body: JSON.stringify({ email, senha })
      })

      const data = await res.json()

      if (res.ok) {
        // Armazena a sessão do associado
        localStorage.setItem(`@associado_session_${slug}`, JSON.stringify(data))
        router.push(`/portal/${slug}/dashboard`)
      } else {
        setErro(data.message || 'Falha ao realizar login.')
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <span className="bg-amber-100 text-amber-700 font-mono text-[10px] uppercase font-black px-3 py-1 rounded-full border border-amber-200">
            {slug}
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase mt-3">Área do Associado</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Acesse sua conta na Liga</p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail</label>
            <input 
              required 
              type="email" 
              placeholder="seuemail@exemplo.com"
              className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
            <div className="relative mt-1">
              <input 
                required 
                type={verSenha ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full p-4 pr-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-amber-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar na Liga'}
          </button>
        </form>
      </div>
    </div>
  )
}
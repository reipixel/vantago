'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

function LoginConteudo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') || searchParams.get('slug')

  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  // Se já estiver logado, redireciona para a rota correta: /portal/[slug]/dashboard
  useEffect(() => {
    if (localStorage.getItem('associado_token')) {
      const ligaSalva = slugLiga || localStorage.getItem('associado_liga') || 'default'
      router.replace(`/portal/${ligaSalva}/dashboard`)
    }
  }, [router, slugLiga])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let url = `${API_URL}/usuarios/login-associado`
      if (slugLiga) {
        url += `?liga=${slugLiga}`
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(slugLiga ? { 'X-Organization-Slug': slugLiga } : {})
        },
        body: JSON.stringify({ identificador, senha, liga: slugLiga })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Define o slug da liga a ser utilizado na rota
        const ligaDestino = slugLiga || data.user?.liga_slug || data.user?.organizacao_slug || 'default'

        // Salva as credenciais e a sessão isolada para a liga
        localStorage.setItem('associado_token', data.token)
        localStorage.setItem('associado_data', JSON.stringify(data.user))
        localStorage.setItem('associado_liga', ligaDestino)
        localStorage.setItem(`@associado_session_${ligaDestino}`, JSON.stringify(data.user))

        // Redireciona para a rota dinâmica correta das páginas do portal
        router.replace(`/portal/${ligaDestino}/dashboard`)
      } else {
        const errData = await res.json()
        alert(`❌ ${errData.message || 'Dados incorretos.'}`)
      }
    } catch (err) {
      console.error('Erro ao efetuar login:', err)
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
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            LIGA <span className="text-indigo-200 font-light">portal</span>
          </h1>
          {slugLiga && (
            <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest mt-2 bg-indigo-700/50 py-1.5 px-4 rounded-full inline-block">
              Organização: {slugLiga}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail ou CPF</label>
            <input 
              required 
              type="text"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={senha} 
                onChange={e => setSenha(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setVerSenha(!verSenha)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
              >
                <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginAssociado() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-600 flex items-center justify-center text-white font-bold uppercase tracking-widest text-xs animate-pulse">Carregando Login...</div>}>
      <LoginConteudo />
    </Suspense>
  )
}
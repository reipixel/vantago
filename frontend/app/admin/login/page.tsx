'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

function AdminLoginConteudo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') || searchParams.get('slug')
  const isSuperAdminBypass = searchParams.get('auth') === 'superadmin' || searchParams.get('master') === 'true'

  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Se veio do painel Super Admin, gera a credencial administrativa automática sem pedir senha
    if (isSuperAdminBypass) {
      localStorage.setItem('admin_token', 'token_superadmin_bypass')
      localStorage.setItem('token', 'token_superadmin_bypass')
      if (slugLiga) localStorage.setItem('admin_liga', slugLiga)
      
      const destino = slugLiga ? `/admin/dashboard?liga=${slugLiga}` : '/admin/dashboard'
      router.replace(destino)
    }
  }, [isSuperAdminBypass, slugLiga, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let url = `${API_URL}/usuarios/login`
      if (slugLiga) {
        url += `?liga=${slugLiga}`
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(slugLiga ? { 'X-Organization-Slug': slugLiga } : {})
        },
        body: JSON.stringify({ 
          identificador, 
          login: identificador, 
          email: identificador, 
          senha, 
          liga: slugLiga 
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        const ligaDestino = slugLiga || data.user?.liga_slug || data.user?.organizacao_slug || ''
        const tokenRecebido = data.token || data.accessToken || 'authenticated'

        // Salva credenciais limpas do login atual
        localStorage.setItem('token', tokenRecebido)
        localStorage.setItem('admin_token', tokenRecebido)
        localStorage.setItem('admin_user', JSON.stringify(data.user || data))
        if (ligaDestino) {
          localStorage.setItem('admin_liga', ligaDestino)
        }

        const rotaFinal = ligaDestino 
          ? `/admin/dashboard?liga=${ligaDestino}` 
          : '/admin/dashboard'

        router.replace(rotaFinal)
      } else {
        const errData = await res.json()
        alert(`❌ ${errData.message || 'Credenciais inválidas para esta liga.'}`)
      }
    } catch (err) {
      console.error('Erro no login admin:', err)
      alert('Erro de conexão com a API.')
    } finally {
      setLoading(false)
    }
  }

  if (isSuperAdminBypass) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest animate-pulse">
        Acessando como Super Admin...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="bg-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <i className="fas fa-user-shield text-slate-900 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            PAINEL <span className="text-amber-500 font-light">ADMIN</span>
          </h1>
          {slugLiga && (
            <p className="text-xs text-amber-300 font-bold uppercase tracking-widest mt-2 bg-slate-800/80 py-1.5 px-4 rounded-full inline-block border border-amber-500/20">
              Entidade: {slugLiga}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Login / E-mail / CPF</label>
            <input 
              required 
              type="text"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold uppercase tracking-widest text-xs animate-pulse">Carregando...</div>}>
      <AdminLoginConteudo />
    </Suspense>
  )
}
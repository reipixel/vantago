'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  
  // Captura dinamicamente o slug da liga da URL (ex: "liga-fiel")
  const slug = (params?.slug as string) || ''

  const [user, setUser] = useState<any>(null)
  const [notificacoes, setNotificacoes] = useState(0)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    // 1. Isola a sessão por liga para evitar colisão entre associados de ligas diferentes
    const sessionKey = slug ? `@associado_session_${slug}` : 'associado_data'
    const userData = localStorage.getItem(sessionKey) || localStorage.getItem('associado_data')
    
    if (!userData) {
      router.replace(slug ? `/portal/${slug}/login` : '/portal/login')
      return
    }

    const userObj = JSON.parse(userData)
    const userId = userObj.id || userObj.user?.id

    if (!userId) {
      router.replace(slug ? `/portal/${slug}/login` : '/portal/login')
      return
    }

    const buscarDadosAtualizados = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(slug ? { 'X-Organization-Slug': slug } : {})
        }

        // 1. Saldo e Dados do Associado no contexto da Liga
        const resUser = await fetch(`http://localhost:3000/usuarios/${userId}`, { headers })
        if (resUser.ok) {
          const novoUsuario = await resUser.json()
          
          if (!novoUsuario.ativo) {
            localStorage.removeItem(sessionKey)
            router.replace(slug ? `/portal/${slug}/login?erro=inativo` : '/portal/login')
            return
          }

          setUser(novoUsuario)
          localStorage.setItem(sessionKey, JSON.stringify(novoUsuario))
        }

        // 2. Notificações de Trocas Aprovadas
        const resTrocas = await fetch(`http://localhost:3000/produtos/pedidos/${userId}`, { headers })
        if (resTrocas.ok) {
          const trocas = await resTrocas.json()
          const aprovados = Array.isArray(trocas) ? trocas.filter((t: any) => t.status === 'aprovado').length : 0
          
          if (aprovados > 0 && aprovados > notificacoes) {
            setShowToast(true)
            setTimeout(() => setShowToast(false), 6000)
          }
          setNotificacoes(aprovados)
        }
      } catch (err) {
        setUser(userObj)
      }
    }

    buscarDadosAtualizados()
    const interval = setInterval(buscarDadosAtualizados, 30000)
    return () => clearInterval(interval)
  }, [router, pathname, notificacoes, slug])

  if (!user) return null

  // Validador dinâmico de rotas ativas
  const isPathActive = (subpath: string) => {
    const fullPath = `/portal/${slug}/${subpath}`
    return pathname === fullPath || pathname.endsWith(subpath)
  }

  const linkClass = (subpath: string) => 
    `flex flex-col items-center gap-1 transition-all px-2 relative ${
      isPathActive(subpath) ? 'text-white' : 'text-slate-500 hover:text-white'
    }`

  const handleSair = () => {
    if (slug) {
      localStorage.removeItem(`@associado_session_${slug}`)
    }
    localStorage.removeItem('associado_data')
    router.replace(slug ? `/portal/${slug}/login` : '/portal/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* TOAST NOTIFICATION: APROVAÇÃO */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-top-full duration-500">
          <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-[28px] p-4 flex items-center gap-4 ring-1 ring-black/20">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-black italic uppercase text-[11px] leading-none mb-1 tracking-tighter">Resgate Aprovado!</h4>
              <p className="text-slate-400 text-[10px] font-bold leading-tight">Sua troca foi autorizada pela associação. Confira os detalhes.</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-slate-500 hover:text-white p-2">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-trophy text-xs"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 leading-none italic uppercase text-sm tracking-tighter">LIGA</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold uppercase tracking-widest">{slug || 'Portal'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 p-1.5 pr-4 rounded-2xl border border-slate-200/50">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-md border-2 border-white overflow-hidden">
              {user.foto_url ? (
                <img src={`http://localhost:3000${user.foto_url}`} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                user.nome?.substring(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">Saldo Atual</p>
              <p className="text-lg font-black text-indigo-600 leading-none tracking-tighter">
                {user.saldo_pontos || 0} <span className="text-[10px] text-indigo-400">PTS</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 pb-32">
        {children}
      </main>

      {/* MENU INFERIOR DINÂMICO MULTI-TENANT */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900/95 backdrop-blur-xl rounded-[32px] p-4 flex justify-around items-center shadow-2xl z-50 border border-white/10 ring-1 ring-black/20">
        <Link href={`/portal/${slug}/dashboard`} className={linkClass('dashboard')}>
          <i className="fas fa-home text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-[2px]">Início</span>
        </Link>

        <Link href={`/portal/${slug}/atividades`} className={linkClass('atividades')}>
          <i className="fas fa-bolt text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-[2px]">Ações</span>
        </Link>

        <Link href={`/portal/${slug}/trocas`} className={linkClass('trocas')}>
          <i className="fas fa-shopping-bag text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-[2px]">Trocas</span>
          {notificacoes > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce shadow-lg shadow-emerald-500/30">
              {notificacoes}
            </span>
          )}
        </Link>

        <Link href={`/portal/${slug}/perfil`} className={linkClass('perfil')}>
          <i className="fas fa-user-circle text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-[2px]">Perfil</span>
        </Link>

        <button 
          onClick={handleSair}
          className="flex flex-col items-center gap-1 transition-all text-red-400/60 hover:text-red-400 px-2"
        >
          <i className="fas fa-power-off text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-[2px]">Sair</span>
        </button>
      </nav>
    </div>
  )
}
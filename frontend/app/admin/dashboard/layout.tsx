'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function DashboardLayoutConteudo({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') 

  const [pendentes, setPendentes] = useState(0)
  const [nomeLigaExibicao, setNomeLigaExibicao] = useState('Painel Administrativo')

  // INTERCEPTOR GLOBAL DE FETCH (Zera os dados injetando o contexto correto em todas as telas)
  useEffect(() => {
    if (!slugLiga) return;

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      
      // Se a requisição for para o seu backend local e ainda não tiver o parâmetro da liga
      if (url.includes('http://localhost:3000') || url.includes('http://127.0.0.1:3000')) {
        if (!url.includes('liga=')) {
          url += url.includes('?') ? `&liga=${slugLiga}` : `?liga=${slugLiga}`;
        }
        
        // Injeta também o Header customizado para as requisições que usam 'init'
        init = init || {};
        init.headers = {
          ...init.headers,
          'X-Organization-Slug': slugLiga,
        };
      }

      // Define o input modificado de volta dependendo do tipo original
      if (typeof input === 'string') {
        return originalFetch(url, init);
      } else if (input instanceof URL) {
        return originalFetch(new URL(url), init);
      } else {
        // Se for um objeto Request, recria a chamada com a URL modificada
        return originalFetch(new Request(url, input as RequestInit), init);
      }
    };

    // Remove o interceptor ao desmontar o componente para não poluir outras áreas fora do painel
    return () => {
      window.fetch = originalFetch;
    };
  }, [slugLiga]);

  // Função para buscar dados específicos da liga (como o nome real dela)
  const carregarDadosDaLiga = async () => {
    if (!slugLiga) return
    try {
      const res = await fetch(`http://localhost:3000/organizacoes`)
      if (res.ok) {
        const organizacoes = await res.json()
        if (Array.isArray(organizacoes)) {
          const ligaAtual = organizacoes.find((o: any) => o.slug === slugLiga)
          if (ligaAtual) {
            setNomeLigaExibicao(ligaAtual.nomeLiga)
          }
        }
      }
    } catch (err) {
      console.warn("Layout: Não foi possível obter detalhes nominais da liga.")
    }
  }

  const buscarTrocasPendentes = async () => {
    try {
      const res = await fetch('http://localhost:3000/produtos/admin/pedidos')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const total = data.filter((t: any) => t.status === 'pendente').length
          setPendentes(total)
        }
      }
    } catch (err) {
      console.warn("Sidebar: Servidor de pedidos offline ou rota inexistente.")
    }
  }

  useEffect(() => {
    buscarTrocasPendentes()
    carregarDadosDaLiga()
    
    const interval = setInterval(buscarTrocasPendentes, 120000)
    return () => clearInterval(interval)
  }, [slugLiga]) 

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    localStorage.removeItem('user_token')
    sessionStorage.clear()
    router.push('/admin/login')
    router.refresh()
  }

  const linkComContexto = (path: string) => {
    return slugLiga ? `${path}?liga=${slugLiga}` : path
  }

  const obterIniciais = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col min-h-screen shadow-2xl z-20">
        
        {/* Logo */}
        <div className="p-8 flex items-center gap-3 border-b border-slate-800/50">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <i className="fas fa-trophy text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-black tracking-tighter italic text-white uppercase">
            LIGA <span className="font-light text-slate-400">Gestão</span>
          </h1>
        </div>
        
        {/* Navegação */}
        <nav className="p-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          
          <p className="text-[10px] font-black text-slate-500 px-4 py-4 uppercase tracking-[3px]">Início</p>
          <Link href={linkComContexto("/admin/dashboard")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold">
            <i className="fas fa-chart-line w-5"></i> Dashboard
          </Link>
          
          <p className="text-[10px] font-black text-slate-500 px-4 py-4 mt-4 uppercase tracking-[3px]">Operação</p>
          
          <Link href={linkComContexto("/admin/dashboard/associados")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold">
            <i className="fas fa-users w-5"></i> Associados
          </Link>

          <Link href={linkComContexto("/admin/dashboard/atividades")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold">
            <i className="fas fa-tasks w-5"></i> Atividades
          </Link>

          <Link href={linkComContexto("/admin/dashboard/registrar")} className="flex items-center gap-3 p-3.5 hover:bg-emerald-500/10 rounded-2xl transition text-emerald-400 font-bold border border-emerald-500/10">
            <i className="fas fa-medal w-5"></i> Registrar Pontos
          </Link>

          <p className="text-[10px] font-black text-slate-500 px-4 py-4 mt-4 uppercase tracking-[3px]">Recompensas</p>
          
          <Link href={linkComContexto("/admin/dashboard/trocas")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold justify-between">
            <span className="flex items-center gap-3"><i className="fas fa-exchange-alt w-5"></i> Trocas</span>
            {pendentes > 0 && (
              <span className="bg-orange-500 text-[10px] px-2 py-0.5 rounded-lg text-white font-black animate-pulse shadow-lg shadow-orange-500/20">
                {pendentes}
              </span>
            )}
          </Link>

          <Link href={linkComContexto("/admin/dashboard/catalogo")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold">
            <i className="fas fa-gift w-5"></i> Catálogo
          </Link>

          <div className="pt-6 mt-6 border-t border-slate-800/50">
            <Link href={linkComContexto("/admin/dashboard/configuracoes")} className="flex items-center gap-3 p-3.5 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-white font-bold">
              <i className="fas fa-cog w-5"></i> 
              <span>Configurações</span>
            </Link>
          </div>

        </nav>

        {/* Botão Sair */}
        <div className="p-6 border-t border-slate-800/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition font-black uppercase text-[10px] tracking-widest"
          >
            <i className="fas fa-sign-out-alt"></i> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 p-6 px-10 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="font-black text-slate-700 uppercase text-[10px] tracking-[3px]">Console de Administração</h2>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-700 leading-tight">{nomeLigaExibicao}</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Sistema Online</p>
             </div>
             <div className="w-12 h-12 rounded-[18px] bg-slate-900 text-white flex items-center justify-center font-black shadow-lg shadow-slate-200">
                {obterIniciais(nomeLigaExibicao)}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-10 overflow-y-auto bg-slate-50/50 custom-scrollbar">
          {children}
        </div>

      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs font-mono text-slate-400 animate-pulse">Iniciando Estrutura Multi-Tenant...</div>}>
      <DashboardLayoutConteudo children={children} />
    </Suspense>
  )
}
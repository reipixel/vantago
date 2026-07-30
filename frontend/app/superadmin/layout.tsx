'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Visão Geral', icon: 'fa-globe', href: '/superadmin', group: 'Global' },
    { name: 'Gestão de Entidades', icon: 'fa-building', href: '/superadmin/entidades', group: 'Global' },
    { name: 'Planos e Assinaturas', icon: 'fa-file-invoice-dollar', href: '/superadmin/planos', group: 'Monetização' },
    { name: 'Logs do Sistema', icon: 'fa-tools', href: '/superadmin/logs', group: 'Sistema' },
    { name: 'Administradores', icon: 'fa-user-shield', href: '/superadmin/administradores', group: 'Sistema' },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col min-h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-yellow-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <i className="fas fa-crown text-slate-900 text-xl"></i>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Super <span className="text-yellow-500">Liga</span></h1>
        </div>
        
        <nav className="p-4 flex-1 space-y-1">
          {['Global', 'Monetização', 'Sistema'].map((grupo) => (
            <div key={grupo}>
              <p className="text-[10px] font-bold text-slate-500 px-3 py-4 uppercase tracking-widest">{grupo}</p>
              {menuItems.filter(item => item.group === grupo).map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    pathname === item.href 
                    ? 'bg-slate-800 border-l-4 border-yellow-500 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fas ${item.icon} w-5`}></i>
                  <span className="text-sm font-bold uppercase tracking-tight">{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-900 overflow-y-auto">
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center px-8 sticky top-0 z-20">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Console Master</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 uppercase">Server Online</span>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <span className="text-sm font-black text-slate-300 uppercase italic">Admin_Root</span>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
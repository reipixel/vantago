'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Utiliza a variável do Render configurada na Vercel ou fallback local
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    fetch(`${API_URL}/usuarios`)
      .then(res => res.json())
      .then(data => {
        setUsuarios(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Erro ao buscar usuários:", err)
        setLoading(false)
      })
  }, [API_URL])

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header do Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-indigo-900 tracking-tight">
              VANTAGO <span className="font-light">SaaS</span>
            </h1>
            <p className="text-slate-500 text-sm">Plataforma de Gestão de Ligas & Associados</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/superadmin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Super Admin
            </Link>
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status da API</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-700 uppercase">Nuvem Conectada</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
            <i className="fas fa-users"></i>
          </span>
          Lista Global de Associados
        </h2>

        {loading ? (
          <div className="animate-pulse flex space-x-4 bg-white p-6 rounded-2xl border border-slate-100">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {usuarios.map((u: any) => (
              <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.nome}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-slate-900">{u.saldo_pontos || 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pontos Acumulados</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {usuarios.length === 0 && !loading && (
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum associado encontrado na nuvem.</p>
          </div>
        )}

      </div>
    </main>
  )
}
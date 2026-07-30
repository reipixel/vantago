'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Faz a chamada para a sua API NestJS
    fetch('http://localhost:3000/usuarios')
      .then(res => res.json())
      .then(data => {
        setUsuarios(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Erro ao buscar usuários:", err)
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header do Dashboard */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-indigo-900 tracking-tight">LIGA <span className="font-light">Associados</span></h1>
            <p className="text-slate-500 text-sm">Painel de Controle v1.0</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status da API</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs font-bold text-slate-700 uppercase">Conectada ao XAMPP</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
            <i className="fas fa-users"></i>
          </span>
          Lista de Associados
        </h2>

        {loading ? (
          <div className="animate-pulse flex space-x-4 bg-white p-6 rounded-2xl">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {usuarios.map((u: any) => (
              <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-white hover:border-indigo-200 transition-all flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {u.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.nome}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-slate-900">{u.saldo_pontos}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pontos Acumulados</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {usuarios.length === 0 && !loading && (
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum associado encontrado no banco de dados.</p>
          </div>
        )}

      </div>
    </main>
  )
}
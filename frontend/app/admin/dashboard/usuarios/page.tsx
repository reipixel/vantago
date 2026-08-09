'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [liga, setLiga] = useState<string | null>(null)

  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    const slugDetectado = obterSlugLigaContexto()
    setLiga(slugDetectado)

    const url = slugDetectado
      ? `http://localhost:3000/usuarios?liga=${slugDetectado}`
      : process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/usuarios'

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setUsuarios(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Erro ao carregar associados:", err)
        setLoading(false)
      })
  }, [])

  // Lógica de Filtro em memória
  const usuariosFiltrados = usuarios.filter((user: any) => 
    user.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    user.email?.toLowerCase().includes(busca.toLowerCase())
  )

  const excluirUsuario = async (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o associado ${nome}?`)) {
      try {
        let url = `http://localhost:3000/usuarios/${id}`
        if (liga) url += `?liga=${liga}`

        const res = await fetch(url, {
          method: 'DELETE',
        });

        if (res.ok) {
          setUsuarios(usuarios.filter((u: any) => u.id !== id));
        }
      } catch (error) {
        alert("Erro ao excluir usuário.");
      }
    }
  }

  const urlNovoUsuario = liga ? `/admin/dashboard/usuarios/novo?liga=${liga}` : "/admin/dashboard/usuarios/novo"

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Associados</h1>
          <p className="text-slate-500 text-sm italic">{usuariosFiltrados.length} encontrados</p>
        </div>
        <Link href={urlNovoUsuario} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-md">
          + Novo Associado
        </Link>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative group">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <i className="fas fa-search"></i>
        </span>
        <input 
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          className="w-full p-4 pl-12 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-600"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Perfil</th>
              <th className="px-6 py-4">Saldo</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 font-bold text-slate-400 animate-pulse">Carregando associados...</td></tr>
            ) : usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{user.nome}</td>
                  <td className="px-6 py-4 text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 text-slate-400 capitalize">{user.perfil}</td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{user.saldo_pontos || 0} pts</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Link 
                        href={liga ? `/admin/dashboard/usuarios/editar/${user.id}?liga=${liga}` : `/admin/dashboard/usuarios/editar/${user.id}`} 
                        className="text-slate-300 hover:text-indigo-600 transition-colors p-2 inline-block"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => excluirUsuario(user.id, user.nome)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                  Nenhum associado encontrado para esta liga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
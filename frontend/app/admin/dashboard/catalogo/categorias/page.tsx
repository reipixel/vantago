'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_URL } from '../../../../../lib/api'

export default function GerenciarCategorias() {
  const [categorias, setCategorias] = useState([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nomeEditado, setNomeEditado] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [liga, setLiga] = useState<string | null>(null)

  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  const carregarCategorias = (slugLiga?: string | null) => {
    setLoading(true)
    const contextoLiga = slugLiga !== undefined ? slugLiga : obterSlugLigaContexto()
    const url = contextoLiga
      ? `${API_URL}/produtos/categorias?liga=${contextoLiga}`
      : `${API_URL}/produtos/categorias`

    fetch(url)
      .then(res => res.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const slugDetectado = obterSlugLigaContexto()
    setLiga(slugDetectado)
    carregarCategorias(slugDetectado)
  }, [])

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaCategoria.trim()) return
    setLoading(true)
    
    let url = `${API_URL}/produtos/categorias`
    if (liga) url += `?liga=${liga}`

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaCategoria }),
    })
    setNovaCategoria('')
    carregarCategorias(liga)
  }

  const handleSalvarEdicao = async (id: number) => {
    let url = `${API_URL}/produtos/categorias/${id}`
    if (liga) url += `?liga=${liga}`

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeEditado }),
    })
    setEditandoId(null)
    carregarCategorias(liga)
  }

  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir categoria?')) return
    let url = `${API_URL}/produtos/categorias/${id}`
    if (liga) url += `?liga=${liga}`

    await fetch(url, { method: 'DELETE' })
    carregarCategorias(liga)
  }

  const urlVoltar = liga ? `/admin/dashboard/catalogo?liga=${liga}` : "/admin/dashboard/catalogo"

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <Link href={urlVoltar} className="text-amber-600 font-bold text-sm hover:underline flex items-center gap-2 mb-2">
          <i className="fas fa-arrow-left"></i> Voltar ao catálogo
        </Link>
        <h1 className="text-3xl font-black text-slate-800">Categorias</h1>
      </div>

      <form onSubmit={handleAdicionar} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex gap-3 mb-8">
        <input 
          type="text" value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-slate-900 text-white px-6 rounded-xl font-black hover:bg-amber-600 transition-all disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-slate-50">
            {categorias.length > 0 ? (
              categorias.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    {editandoId === cat.id ? (
                      <input 
                        autoFocus
                        className="w-full p-2 bg-amber-50 border-b-2 border-amber-400 outline-none font-bold text-slate-700"
                        value={nomeEditado}
                        onChange={(e) => setNomeEditado(e.target.value)}
                        onBlur={() => handleSalvarEdicao(cat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSalvarEdicao(cat.id)}
                      />
                    ) : (
                      <span className="font-bold text-slate-700">{cat.nome}</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-4">
                    <button onClick={() => { setEditandoId(cat.id); setNomeEditado(cat.nome); }} className="text-slate-300 hover:text-amber-500 transition-colors">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleExcluir(cat.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-8 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                  Nenhuma categoria cadastrada para esta liga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
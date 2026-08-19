'use client'
import { useState, useEffect, use } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/app/lib/api'

import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
})

export default function EditarItem({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params) 
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [liga, setLiga] = useState<string | null>(null)
  
  // Estados do Formulário
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [status, setStatus] = useState('ativo')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    preco_pontos: '',
    estoque: ''
  })

  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    const slug = obterSlugLigaContexto()
    setLiga(slug)

    // Ajusta a rota para carregar as categorias no contexto da liga atual
    const urlCategorias = slug
      ? `${API_URL}/produtos/categorias?liga=${slug}`
      : `${API_URL}/produtos/categorias`

    // Ajusta a rota para trazer apenas os produtos da liga correta e achar o ID correspondente
    const urlProdutos = slug
      ? `${API_URL}/produtos?liga=${slug}&t=${Date.now()}`
      : `${API_URL}/produtos?t=${Date.now()}`

    Promise.all([
      fetch(urlCategorias).then(res => res.json()),
      fetch(urlProdutos).then(res => res.json())
    ]).then(([cats, itens]) => {
      setCategorias(Array.isArray(cats) ? cats : [])
      const item = Array.isArray(itens) ? itens.find((i: any) => i.id === Number(id)) : null
      
      if (item) {
        setFormData({
          nome: item.nome || '',
          preco_pontos: (item.preco_pontos || 0).toString(),
          estoque: (item.estoque || 0).toString()
        })
        setDescricao(item.descricao || '')
        setCategoriaId(item.categoria?.id || '')
        setStatus(item.status || 'ativo')
        if (item.imagem_p) {
          setPreview(item.imagem_p.startsWith('http') ? item.imagem_p : `${API_URL}${item.imagem_p}`)
        } else {
          setPreview(null)
        }
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const data = new FormData()
    if (selectedFile) data.append('image', selectedFile)
    data.append('nome', formData.nome)
    data.append('descricao', descricao)
    data.append('preco_pontos', formData.preco_pontos)
    data.append('estoque', formData.estoque)
    data.append('categoriaId', categoriaId)
    data.append('status', status)

    try {
      let url = `${API_URL}/produtos/${id}`
      if (liga) {
        url += `?liga=${liga}`
      }

      const res = await fetch(url, {
        method: 'PATCH',
        body: data, 
      })

      if (res.ok) {
        alert('✨ Item atualizado com sucesso!')
        router.push(liga ? `/admin/dashboard/catalogo?liga=${liga}` : '/admin/dashboard/catalogo')
      } else {
        alert('❌ Ocorreu um problema ao salvar as modificações.')
      }
    } catch (error) {
      alert('❌ Erro ao atualizar item.')
    } finally {
      setSaving(false)
    }
  }

  const urlVoltar = liga ? `/admin/dashboard/catalogo?liga=${liga}` : "/admin/dashboard/catalogo"

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Carregando dados do item...</div>

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={urlVoltar} className="text-amber-600 font-bold text-sm hover:underline flex items-center gap-2 mb-2">
            <i className="fas fa-arrow-left"></i> Cancelar e voltar
          </Link>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Editar Item</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Imagem do Item</label>
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-amber-400 group">
              {preview && <img src={preview} alt="Preview" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white font-bold text-xs">Trocar Imagem</p>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Status de Visibilidade</label>
              <select 
                value={status}
                className={`w-full mt-1 p-4 border-none rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500 appearance-none ${status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="ativo">🟢 Ativo (Visível)</option>
                <option value="inativo">🔴 Inativo (Oculto)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Custo (Pontos)</label>
              <input 
                type="number" required value={formData.preco_pontos}
                className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-black text-2xl text-amber-600 outline-none focus:ring-2 focus:ring-amber-500"
                onChange={e => setFormData({...formData, preco_pontos: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Estoque</label>
              <input 
                type="number" required value={formData.estoque}
                className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-amber-500"
                onChange={e => setFormData({...formData, estoque: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Nome do Item</label>
                <input 
                  type="text" required value={formData.nome}
                  className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Categoria</label>
                <select 
                  required value={categoriaId}
                  className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  onChange={e => setCategoriaId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 mb-2">Descrição e Regras</label>
              <div className="rounded-3xl overflow-hidden border border-slate-100">
                <ReactQuill theme="snow" value={descricao} onChange={setDescricao} className="bg-white h-72 mb-12" />
              </div>
            </div>

            <button 
              type="submit" disabled={saving}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-amber-600 transition-all shadow-xl disabled:opacity-50"
            >
              {saving ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
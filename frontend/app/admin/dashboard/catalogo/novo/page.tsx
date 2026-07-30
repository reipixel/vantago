'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// CSS do Editor
import 'react-quill-new/dist/quill.snow.css'

// Import dinâmico do editor para evitar erros de renderização no servidor (SSR)
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
})

export default function NovoItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [liga, setLiga] = useState<string | null>(null)
  
  // Estados do Formulário
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
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

  // Carregar dados e sincronizar liga de forma segura no Client Component
  useEffect(() => {
    const slug = obterSlugLigaContexto()
    setLiga(slug)

    const urlCategorias = slug
      ? `http://localhost:3000/produtos/categorias?liga=${slug}`
      : 'http://localhost:3000/produtos/categorias'

    fetch(urlCategorias)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategorias(data)
      })
      .catch(err => console.error("Erro ao carregar categorias:", err))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) return alert('Selecione uma imagem para o item.')
    if (!categoriaId) return alert('Selecione uma categoria.')

    setLoading(true)

    // Usamos FormData para enviar o arquivo binário junto com os textos
    const data = new FormData()
    data.append('image', selectedFile)
    data.append('nome', formData.nome)
    data.append('descricao', descricao)
    data.append('preco_pontos', formData.preco_pontos)
    data.append('estoque', formData.estoque)
    data.append('categoriaId', categoriaId)

    try {
      // Injeta explicitamente o slug da liga na query para o backend saber qual organizacaoId aplicar
      let url = 'http://localhost:3000/produtos'
      if (liga) url += `?liga=${liga}`

      const res = await fetch(url, {
        method: 'POST',
        body: data, 
      })

      if (res.ok) {
        alert('🎉 Item publicado com sucesso!')
        router.push(liga ? `/admin/dashboard/catalogo?liga=${liga}` : '/admin/dashboard/catalogo')
      } else {
        const error = await res.json()
        alert(`❌ Erro: ${error.message}`)
      }
    } catch (error) {
      alert('❌ Falha na conexão com a API.')
    } finally {
      setLoading(false)
    }
  }

  const urlVoltar = liga ? `/admin/dashboard/catalogo?liga=${liga}` : "/admin/dashboard/catalogo"

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={urlVoltar} className="text-amber-600 font-bold text-sm hover:underline flex items-center gap-2 mb-2">
            <i className="fas fa-arrow-left"></i> Voltar ao catálogo
          </Link>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Novo Item de Troca</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Imagem e Atributos (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Capa do Item</label>
            
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-amber-400 group">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <i className="fas fa-image text-4xl text-slate-200 mb-3"></i>
                  <p className="text-xs font-bold text-slate-400">Clique para subir</p>
                  <p className="text-[10px] text-slate-300 mt-1 italic">Mín. 500x500px</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Custo em Pontos</label>
              <input 
                type="number" required placeholder="0"
                className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-black text-2xl text-amber-600 outline-none focus:ring-2 focus:ring-amber-500"
                onChange={e => setFormData({...formData, preco_pontos: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Estoque Inicial</label>
              <input 
                type="number" required placeholder="Ex: 50"
                className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-amber-500"
                onChange={e => setFormData({...formData, estoque: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Conteúdo e Editor (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Nome do Item</label>
                <input 
                  type="text" required placeholder="Ex: Camiseta da Liga"
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 mb-2">Descrição Completa</label>
              <div className="rounded-3xl overflow-hidden border border-slate-100">
                <ReactQuill 
                  theme="snow" value={descricao} onChange={setDescricao} 
                  className="bg-white h-72 mb-12"
                  placeholder="Escreva aqui as especificações, tamanhos ou regras de retirada..."
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-amber-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  Processando Recortes...
                </>
              ) : (
                'Finalizar e Publicar Recompensa'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
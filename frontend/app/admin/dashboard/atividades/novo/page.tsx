'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { API_URL } from '../../../../../lib/api'

// Editor compatível com React 18/19
import 'react-quill-new/dist/quill.snow.css'
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
})

export default function FormAtividade() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const slugLiga = searchParams.get('liga') // Captura o slug da liga atual da barra de endereços

  const [fetching, setFetching] = useState(!!editId)
  const [loading, setLoading] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    pontos: 0,
    dataHora: '',
    local: 'Presencial',
    limiteParticipantes: '',
    status: 'ativa',
    exibirBotaoAcao: false,
    textoBotao: '',
    linkBotao: ''
  })

  useEffect(() => {
    if (editId) {
      setFetching(true);
      fetch(`${API_URL}/atividades/${editId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Dados recebidos da API:", data);

          setFormData({
            nome: data.nome || '',
            descricao: data.descricao || '',
            pontos: data.pontos || 0,
            dataHora: data.dataHora ? new Date(data.dataHora).toISOString().slice(0, 16) : '',
            local: data.local || 'Presencial',
            limiteParticipantes: data.limiteParticipantes || '',
            status: data.status || 'ativa',
            
            // Mapeamento explícito para os novos campos
            exibirBotaoAcao: data.exibirBotaoAcao === true || String(data.exibirBotaoAcao) === 'true',
            textoBotao: data.textoBotao || '',
            linkBotao: data.linkBotao || ''
          });

          if (data.imagem_p) {
            setPreview(data.imagem_p.startsWith('http') ? data.imagem_p : `${API_URL}${data.imagem_p}`);
          }
        })
        .finally(() => setFetching(false));
    }
  }, [editId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = new FormData()
    if (selectedFile) data.append('file', selectedFile)
    
    data.append('nome', formData.nome)
    data.append('descricao', formData.descricao)
    data.append('pontos', String(formData.pontos))
    data.append('local', formData.local)
    data.append('status', formData.status)
    data.append('dataHora', formData.dataHora || '')
    data.append('limiteParticipantes', String(formData.limiteParticipantes || ''))
    data.append('exibirBotaoAcao', String(formData.exibirBotaoAcao))
    data.append('textoBotao', formData.textoBotao)
    data.append('linkBotao', formData.linkBotao)

    try {
      let url = editId 
        ? `${API_URL}/atividades/${editId}` 
        : `${API_URL}/atividades`
      
      // BLINDAGEM MULTI-TENANT: Anexa a liga à URL da chamada da API para o NestJS isolar o registro
      if (slugLiga) {
        url += url.includes('?') ? `&liga=${slugLiga}` : `?liga=${slugLiga}`
      }
      
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        body: data,
      })

      if (res.ok) {
        alert(editId ? '✨ Atividade atualizada!' : '🎯 Atividade criada com sucesso!')
        
        // Retorna preservando o parâmetro da liga na Sidebar e no layout do front
        const urlRetorno = slugLiga ? `/admin/dashboard/atividades?liga=${slugLiga}` : '/admin/dashboard/atividades'
        router.push(urlRetorno)
      } else {
        const errorData = await res.json()
        alert(`Erro: ${errorData.message}`)
      }
    } catch (error) {
      alert('❌ Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-pulse">
        <div className="text-slate-300 font-black uppercase text-xs tracking-[4px]">Sincronizando dados...</div>
      </div>
    )
  }

  const urlVoltar = slugLiga ? `/admin/dashboard/atividades?liga=${slugLiga}` : '/admin/dashboard/atividades'

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <Link href={urlVoltar} className="text-indigo-600 font-bold text-xs hover:underline flex items-center gap-2 mb-4 uppercase tracking-widest">
            <i className="fas fa-arrow-left"></i> Voltar
        </Link>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">
          {editId ? 'Editar Atividade' : 'Nova Atividade'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
        
        {/* IMAGEM DE CAPA */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagem de Capa (Mín. 500x500px)</label>
          <div className="relative aspect-video rounded-[30px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-indigo-400 group">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <i className="fas fa-image text-4xl text-slate-200 mb-3"></i>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Clique para subir imagem</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* NOME */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Atividade</label>
          <input 
            type="text" required
            className="w-full mt-2 p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
          />
        </div>

        {/* DESCRIÇÃO HTML */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Descrição Detalhada</label>
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            <ReactQuill 
              theme="snow"
              value={formData.descricao}
              onChange={(content) => setFormData({...formData, descricao: content})}
              className="bg-white"
            />
          </div>
        </div>

        {/* PONTOS, DATA E LOCAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pontos</label>
            <input 
              type="number" required
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-600 outline-none"
              value={formData.pontos}
              onChange={(e) => setFormData({...formData, pontos: Number(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data/Hora</label>
            <input 
              type="datetime-local" 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none"
              value={formData.dataHora}
              onChange={(e) => setFormData({...formData, dataHora: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local</label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none appearance-none"
              value={formData.local}
              onChange={(e) => setFormData({...formData, local: e.target.value})}
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>

        {/* LIMITE E STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Vagas</label>
            <input 
              type="number" placeholder="Ilimitado"
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none"
              value={formData.limiteParticipantes}
              onChange={(e) => setFormData({...formData, limiteParticipantes: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Atual</label>
            <select 
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none appearance-none"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
        </div>

        {/* CONFIGURAÇÃO DO BOTÃO DE AÇÃO */}
        <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Exibir botão de ação?</label>
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Habilita um botão de link externo no Portal.</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                type="button"
                onClick={() => setFormData({...formData, exibirBotaoAcao: true})}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.exibirBotaoAcao ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >Sim</button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, exibirBotaoAcao: false})}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.exibirBotaoAcao ? 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >Não</button>
            </div>
          </div>

          {formData.exibirBotaoAcao && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Texto do botão</label>
                <input 
                  type="text" required
                  placeholder="Ex: Fazer Inscrição"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.textoBotao}
                  onChange={(e) => setFormData({...formData, textoBotao: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link para o botão</label>
                <input 
                  type="url" required
                  placeholder="https://link-externo.com"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.linkBotao}
                  onChange={(e) => setFormData({...formData, linkBotao: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          <button 
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-[22px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 uppercase tracking-[2px] text-xs"
          >
            {loading ? 'Processando...' : editId ? 'Salvar Alterações' : 'Publicar Atividade'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        .ql-toolbar.ql-snow { border: none !important; background: #fff; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; }
        .ql-container.ql-snow { border: none !important; background: #f8fafc; font-family: inherit; }
        .ql-editor { min-height: 200px; color: #334155; font-size: 15px; }
      `}</style>
    </div>
  )
}
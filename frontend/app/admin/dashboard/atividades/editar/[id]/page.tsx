'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Editor HTML compatível
import 'react-quill-new/dist/quill.snow.css'
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
})

export default function EditarAtividade() {
  const router = useRouter()
  const { id } = useParams() // Captura o ID da URL /atividades/editar/[id]
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') // Captura o contexto multi-tenant da liga atual
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
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
    exibirBotaoInscricao: false,
    linkInscricao: ''
  })

  useEffect(() => {
    if (!id) return

    fetch(`http://localhost:3000/atividades/${id}`)
      .then(res => res.json())
      .then(data => {
        // LÓGICA DE DATA PARA O INPUT datetime-local (YYYY-MM-DDTHH:mm)
        let dataFormatada = '';
        if (data.dataHora) {
          const dateObj = new Date(data.dataHora);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          dataFormatada = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        setFormData({
          nome: data.nome || '',
          descricao: data.descricao || '',
          pontos: data.pontos || 0,
          dataHora: dataFormatada,
          local: data.local || 'Presencial',
          limiteParticipantes: data.limiteParticipantes || '',
          status: data.status || 'ativa',
          // Conversão segura para booleano
          exibirBotaoInscricao: data.exibirBotaoInscricao === true || data.exibirBotaoInscricao === 'true',
          linkInscricao: data.linkInscricao || ''
        });
        
        if (data.imagem_p) {
          setPreview(`http://localhost:3000${data.imagem_p}`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar atividade:", err);
        setLoading(false);
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
    if (selectedFile) data.append('file', selectedFile)
    
    data.append('nome', formData.nome)
    data.append('descricao', formData.descricao)
    data.append('pontos', String(formData.pontos))
    data.append('local', formData.local)
    data.append('status', formData.status)
    data.append('dataHora', formData.dataHora || '')
    data.append('limiteParticipantes', String(formData.limiteParticipantes || ''))
    data.append('exibirBotaoInscricao', String(formData.exibirBotaoInscricao))
    data.append('linkInscricao', formData.linkInscricao)

    try {
      let url = `http://localhost:3000/atividades/${id}`
      // Mantém a injeção do parâmetro caso o interceptor necessite reforço no PATCH
      if (slugLiga) {
        url += `?liga=${slugLiga}`
      }

      const res = await fetch(url, {
        method: 'PATCH',
        body: data,
      })

      if (res.ok) {
        alert('✨ Atividade atualizada com sucesso!')
        
        // Retorna para a listagem preservando o isolamento da liga na tela anterior
        const urlRetorno = slugLiga ? `/admin/dashboard/atividades?liga=${slugLiga}` : '/admin/dashboard/atividades'
        router.push(urlRetorno)
      } else {
        const err = await res.json()
        alert(`Erro ao atualizar: ${err.message}`)
      }
    } catch (error) {
      alert('❌ Erro ao conectar com o servidor.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-300 font-black uppercase text-xs tracking-[4px]">
      Carregando Atividade...
    </div>
  )

  const urlVoltar = slugLiga ? `/admin/dashboard/atividades?liga=${slugLiga}` : '/admin/dashboard/atividades'

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">Editar Atividade</h1>
          <p className="text-slate-400 font-medium mt-2">Ajuste os parâmetros da ação selecionada.</p>
        </div>
        <Link href={urlVoltar} className="bg-slate-100 p-4 rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
          <i className="fas fa-times"></i>
        </Link>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Alterar imagem</p>
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

        {/* DATA E LOCAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data e Hora</label>
            <input 
              type="datetime-local" 
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.dataHora}
              onChange={(e) => setFormData({...formData, dataHora: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização</label>
            <select 
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={formData.local}
              onChange={(e) => setFormData({...formData, local: e.target.value})}
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
        </div>

        {/* PONTOS E LIMITE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pontuação</label>
            <input 
              type="number" required
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-600 text-xl outline-none"
              value={formData.pontos}
              onChange={(e) => setFormData({...formData, pontos: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Vagas</label>
            <input 
              type="number" placeholder="Ilimitado"
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none"
              value={formData.limiteParticipantes}
              onChange={(e) => setFormData({...formData, limiteParticipantes: e.target.value})}
            />
          </div>
        </div>

        {/* STATUS */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status da Atividade</label>
          <select 
            className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none appearance-none"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          >
            <option value="ativa">Ativa (Aberta)</option>
            <option value="inativa">Inativa (Rascunho)</option>
            <option value="encerrada">Encerrada</option>
          </select>
        </div>

        {/* INSCRIÇÃO */}
        <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Exibir botão de inscrição?</label>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              <button 
                type="button"
                onClick={() => setFormData({...formData, exibirBotaoInscricao: true})}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.exibirBotaoInscricao ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >Sim</button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, exibirBotaoInscricao: false})}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.exibirBotaoInscricao ? 'bg-slate-400 text-white' : 'text-slate-400'}`}
              >Não</button>
            </div>
          </div>

          {formData.exibirBotaoInscricao && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link para Inscrição</label>
              <input 
                type="url" required
                placeholder="https://..."
                className="w-full mt-2 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.linkInscricao}
                onChange={(e) => setFormData({...formData, linkInscricao: e.target.value})}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-6">
          <button 
            type="button" onClick={() => router.push(urlVoltar)}
            className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-[22px] uppercase text-[10px] tracking-widest"
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={saving}
            className="flex-[2] py-5 bg-slate-900 text-white font-black rounded-[22px] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {saving ? 'Gravando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        .ql-toolbar.ql-snow { border: none !important; background: #fff; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; }
        .ql-container.ql-snow { border: none !important; background: #f8fafc; font-family: inherit; }
        .ql-editor { min-height: 180px; color: #334155; font-size: 15px; }
      `}</style>
    </div>
  )
}
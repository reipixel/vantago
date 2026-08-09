'use client'
import { useState, useEffect } from 'react'

export default function GestaoEntidades() {
  const [entidades, setEntidades] = useState([])
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  
  const estadoInicial = {
    id: null,
    nomeLiga: '',
    slug: '',
    planoId: '',
    status: 'ativa',
    logoUrl: '',
    nomeAdmin: '',
    emailAdmin: '',
    senhaAdmin: ''
  }

  const [form, setForm] = useState(estadoInicial)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [resOrg, resPla] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/organizacoes'),
        fetch(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/planos')
      ])
      const orgs = await resOrg.json()
      const plas = await resPla.json()
      setEntidades(Array.isArray(orgs) ? orgs : [])
      setPlanos(Array.isArray(plas) ? plas : [])
    } catch (err) { 
      console.error("Erro ao carregar dados:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { carregarDados() }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const currentStatus = form.status || 'ativa';

    const payload = {
      ...form,
      planoId: form.planoId ? Number(form.planoId) : null,
      status: String(currentStatus).toLowerCase()
    }

    const method = form.id ? 'PATCH' : 'POST'
    const url = form.id ? `http://localhost:3000/organizacoes/${form.id}` : process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/organizacoes'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModal(false)
        setForm(estadoInicial)
        setVerSenha(false)
        carregarDados()
      } else {
        const errorData = await res.json()
        alert(`Erro: ${errorData.message || 'Falha ao processar'}`)
      }
    } catch (err) {
      console.error("Erro na requisição:", err)
    }
  }

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const gerarSlug = (texto: string) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic leading-none">Gestão de Entidades</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-2">Associações e Ligas cadastradas</p>
        </div>
        <button 
          onClick={() => { setForm(estadoInicial); setVerSenha(false); setShowModal(true); }}
          className="bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition shadow-lg active:scale-95"
        >
          + Nova Entidade
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-[40px] border border-slate-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/80 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-slate-700">
            <tr>
              <th className="px-8 py-5">Entidade / URL</th>
              <th className="px-8 py-5">Plano Atual</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-black uppercase text-xs animate-pulse tracking-widest">Sincronizando Entidades...</td></tr>
            ) : entidades.map((org: any) => (
              <tr key={org.id} className="hover:bg-slate-800/40 transition group">
                <td className="px-8 py-6 flex items-center gap-4">
                  {org.logoUrl && (
                    <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center border border-slate-700">
                      <img src={org.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div>
                    <div className="font-black text-slate-200 uppercase italic text-lg">{org.nomeLiga}</div>
                    <div className="text-[10px] text-yellow-500/60 font-mono font-bold tracking-tight">/{org.slug}</div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-indigo-500/20">
                    {org.plano?.nome || 'Sem Plano'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {String(org.status || '').toLowerCase() === 'ativa' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Ativa</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Suspensa</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right space-x-2">
  <button 
    onClick={() => { 
      const usuarioAdmin = org.usuarios?.find((u: any) => u.tipo === 'admin');

      setForm({
        id: org.id,
        nomeLiga: org.nomeLiga,
        slug: org.slug,
        planoId: org.planoId || org.plano?.id || '',
        status: org.status || 'ativa',
        logoUrl: org.logoUrl || '',
        nomeAdmin: usuarioAdmin?.nome || '', 
        emailAdmin: usuarioAdmin?.email || '', 
        senhaAdmin: usuarioAdmin?.senha || ''
      }); 
      setShowModal(true); 
    }} 
    className="p-3 bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
    title="Editar Entidade"
  >
    <i className="fas fa-edit"></i>
  </button>

                {/* BOTÃO DO DASHBOARD ATIVADO COM REDIRECIONAMENTO DINÂMICO */}
                <button 
                onClick={() => {
                  // Aponta para o dashboard existente, injetando o contexto da liga na URL
                  window.open(`/admin/dashboard?liga=${org.slug}`, '_blank'); 
                }}
                className="p-3 bg-slate-900 text-slate-400 hover:text-yellow-500 rounded-xl border border-slate-700 transition" 
                title={`Acessar Painel Admin de ${org.nomeLiga}`}
              >
                <i className="fas fa-external-link-alt"></i>
              </button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
            
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-800/60">
              <h2 className="text-2xl font-black text-white uppercase italic">{form.id ? 'Editar Liga' : 'Nova Liga'}</h2>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center border border-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Liga</label>
                    <input required className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                      value={form.nomeLiga} onChange={e => { setForm({...form, nomeLiga: e.target.value, slug: form.id ? form.slug : gerarSlug(e.target.value)}) }} />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug da URL (Único)</label>
                    <input required className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-mono text-xs text-yellow-500 outline-none" 
                      value={form.slug} onChange={e => setForm({...form, slug: gerarSlug(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logomarca da Entidade</label>
                    <div className="flex items-center gap-4 mt-2 bg-slate-800 p-4 rounded-2xl h-[56px]">
                      <label className="bg-slate-900 hover:bg-slate-950 text-slate-300 font-bold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all border border-slate-700 whitespace-nowrap">
                        <i className="fas fa-upload mr-2"></i> Escolher
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                      </label>
                      {form.logoUrl ? (
                        <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center relative group">
                          <img src={form.logoUrl} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                          <button 
                            type="button" 
                            onClick={() => setForm({ ...form, logoUrl: '' })} 
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold shadow-md"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold italic truncate">Nenhuma logo carregada</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Plano</label>
                      <select required className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                        value={form.planoId} onChange={e => setForm({...form, planoId: e.target.value})}>
                        <option value="">Selecione</option>
                        {planos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                      <select className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                        value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="ativa">Ativa</option>
                        <option value="suspensa">Suspensa</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-800/80 pt-6 space-y-4">
                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                  Usuário Administrador da Liga
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      required 
                      className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                      placeholder="Nome do Gestor" 
                      value={form.nomeAdmin} 
                      onChange={e => setForm({...form, nomeAdmin: e.target.value})} 
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Master</label>
                    <input 
                      required 
                      type="email" 
                      className="w-full mt-2 p-4 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                      placeholder="email@liga.com" 
                      value={form.emailAdmin} 
                      onChange={e => setForm({...form, emailAdmin: e.target.value})} 
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      {form.id ? 'Senha Atual / Alterar' : 'Senha de Acesso'}
                    </label>
                    <div className="relative mt-2">
                      <input 
                        required={!form.id} 
                        type={verSenha ? 'text' : 'password'} 
                        className="w-full p-4 pr-12 bg-slate-800 border-none rounded-2xl font-bold text-white outline-none focus:ring-2 ring-yellow-500" 
                        placeholder="Sua Senha" 
                        value={form.senhaAdmin} 
                        onChange={e => setForm({...form, senhaAdmin: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setVerSenha(!verSenha)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4 border-t border-slate-800/60">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-slate-300 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-yellow-500 text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-500/10 hover:bg-yellow-400 transition-all active:scale-95">Gravar Entidade</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
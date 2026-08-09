'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfiguracoesConteudo() {
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') // Captura dinamicamente o contexto (ex: "liga-fiel")

  const [abaAtiva, setAbaAtiva] = useState<'identidade' | 'usuarios' | 'gamificacao'>('identidade')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  
  const [produtosCatalogo, setProdutosCatalogo] = useState([])
  const [categorias, setCategorias] = useState([])

  // --- ESTADOS ABA 1: IDENTIDADE ---
  const [identidade, setIdentidade] = useState({
    nome_entidade: '',
    nome_liga: '',
    email_suporte: '',
    telefone: ''
  })

  // --- ESTADOS ABA 2: USUÁRIOS ---
  const [usuarios, setUsuarios] = useState([])
  const [showModalUser, setShowModalUser] = useState(false)
  const [userForm, setUserForm] = useState({ 
    id: null, nome: '', login: '', email: '', senha: '', tipo: 'admin' 
  })

  // --- ESTADOS ABA 3: GAMIFICAÇÃO ---
  const [pontosConfig, setPontosConfig] = useState({
    pontos_perfil: 50,
    pontos_endereco: 100,
    troca_principal_id: '',
    sugestao_1_id: '',
    sugestao_2_id: '',
    sugestao_3_id: ''
  })

  // Filtros para a busca de itens nas sugestões
  const [buscaItem, setBuscaItem] = useState('')
  const [catFiltro, setCatFiltro] = useState('todas')

  // Helper para injetar os headers multi-tenant obrigatórios
  const obterHeaders = () => ({
    'Content-Type': 'application/json',
    ...(slugLiga ? { 'X-Organization-Slug': slugLiga } : {})
  })

  // Helper para injetar a query string de liga nas URLs da API
  const formatarUrl = (urlBase: string) => {
    if (!slugLiga) return urlBase
    return `${urlBase}${urlBase.includes('?') ? '&' : '?'}liga=${slugLiga}`
  }

  useEffect(() => {
    carregarDadosBase()
  }, [])

  useEffect(() => {
    if (abaAtiva === 'identidade' || abaAtiva === 'gamificacao') carregarIdentidade()
    if (abaAtiva === 'usuarios') carregarAdmins()
  }, [abaAtiva, slugLiga])

  const carregarDadosBase = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(formatarUrl(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/produtos'), { headers: obterHeaders() }),
        fetch(formatarUrl(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/produtos/categorias'), { headers: obterHeaders() })
      ])
      setProdutosCatalogo(await resProd.json())
      setCategorias(await resCat.json())
    } catch (err) { console.error(err) }
  }

  const carregarIdentidade = async () => {
    setLoading(true)
    try {
      const res = await fetch(formatarUrl(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/configuracoes/1'), {
        headers: obterHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        
        setIdentidade({
          nome_entidade: data.nome_entidade || '',
          nome_liga: data.nome_liga || '',
          email_suporte: data.email_suporte || '',
          telefone: data.telefone || ''
        })

        setPontosConfig({
          pontos_perfil: data.pontos_perfil || 50,
          pontos_endereco: data.pontos_endereco || 100,
          troca_principal_id: data.troca_principal_id || '',
          sugestao_1_id: data.sugestao_1_id || '',
          sugestao_2_id: data.sugestao_2_id || '',
          sugestao_3_id: data.sugestao_3_id || ''
        })
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err)
    } finally {
      setLoading(false)
    }
  }

  const carregarAdmins = async () => {
    try {
      const res = await fetch(formatarUrl(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/usuarios/admins'), {
        headers: obterHeaders()
      })
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
  }

  const handleSalvarConfig = async (e: React.FormEvent, dados: any) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(formatarUrl(process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/configuracoes/1'), {
        method: 'PATCH',
        headers: obterHeaders(),
        body: JSON.stringify(dados)
      })
      if (res.ok) alert('✨ Configurações updated successfully!')
    } catch (err) { alert("Erro de conexão.") } finally { setSaving(false) }
  }

  const handleSalvarUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const urlBase = userForm.id ? `http://localhost:3000/usuarios/${userForm.id}` : process.env.NEXT_PUBLIC_API_URL || 'https://goldenrod-magpie-257392.hostingersite.com/usuarios'
      
      const payload: any = { ...userForm }
      if (userForm.id && !userForm.senha.trim()) {
        delete payload.senha
      }

      const res = await fetch(formatarUrl(urlBase), {
        method: userForm.id ? 'PATCH' : 'POST',
        headers: obterHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowModalUser(false)
        carregarAdmins()
        alert('✅ Administrador salvo com sucesso!')
      } else {
        const errData = await res.json()
        alert(errData.message || "Erro ao salvar administrador.")
      }
    } catch (err) { alert("Erro na API.") } finally { setSaving(false) }
  }

  const handleExcluirUser = async (id: number) => {
    if (!confirm('Remover este acesso administrativo permanentemente?')) return
    await fetch(formatarUrl(`http://localhost:3000/usuarios/${id}`), { 
      method: 'DELETE',
      headers: obterHeaders()
    })
    carregarAdmins()
  }

  const ItemSelector = ({ label, value, onChange, highlight = false }: any) => {
    const filtrados = produtosCatalogo.filter((p: any) => {
      const matchBusca = p.nome.toLowerCase().includes(buscaItem.toLowerCase())
      const matchCat = catFiltro === 'todas' || p.categoria?.id === Number(catFiltro)
      return matchBusca && matchCat
    })

    return (
      <div className="space-y-2">
        <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${highlight ? 'text-amber-600' : 'text-slate-400'}`}>
          {label}
        </label>
        <select 
          value={value ? String(value) : ""} 
          onChange={onChange}
          className={`w-full p-4 border-none rounded-2xl font-bold outline-none appearance-none transition-all ${
            highlight ? 'bg-amber-50 text-slate-800 ring-2 ring-amber-100' : 'bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-500'
          }`}
        >
          <option value="">Nenhum item selecionado</option>
          {filtrados.map((p: any) => (
            <option key={p.id} value={String(p.id)}>
              {p.nome} ({p.preco_pontos} pts)
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Configurações</h1>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-2">Personalize a identidade e gamificação da entidade</p>
        </div>
        {slugLiga && (
          <span className="bg-amber-100 text-amber-700 font-black font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl border border-amber-200">
            Liga: {slugLiga}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-10 bg-slate-100 p-1.5 rounded-[22px] w-fit border border-slate-200/50">
        <button type="button" onClick={() => setAbaAtiva('identidade')} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all ${abaAtiva === 'identidade' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-building mr-2 opacity-50"></i> Identidade
        </button>
        <button type="button" onClick={() => setAbaAtiva('gamificacao')} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all ${abaAtiva === 'gamificacao' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-coins mr-2 opacity-50"></i> Gamificação
        </button>
        <button type="button" onClick={() => setAbaAtiva('usuarios')} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all ${abaAtiva === 'usuarios' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-user-shield mr-2 opacity-50"></i> Admins
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-20 text-center rounded-[40px] border border-slate-100 text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">
          Buscando configurações da Liga...
        </div>
      ) : (
        <div className="space-y-6">
          {/* ABA IDENTIDADE */}
          {abaAtiva === 'identidade' && (
            <form onSubmit={(e) => handleSalvarConfig(e, identidade)} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome da Entidade</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none" value={identidade.nome_entidade} onChange={e => setIdentidade({...identidade, nome_entidade: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome da Liga</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none" value={identidade.nome_liga} onChange={e => setIdentidade({...identidade, nome_liga: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail de Suporte</label>
                    <input type="email" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none" value={identidade.email_suporte} onChange={e => setIdentidade({...identidade, email_suporte: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone / WhatsApp</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none" value={identidade.telefone} onChange={e => setIdentidade({...identidade, telefone: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-50 pt-6">
                  <button type="submit" disabled={saving} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-500 transition-all shadow-xl">
                    {saving ? 'Gravando...' : 'Salvar Identidade'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ABA GAMIFICAÇÃO */}
          {abaAtiva === 'gamificacao' && (
            <form onSubmit={(e) => handleSalvarConfig(e, pontosConfig)} className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bônus Dados Perfil</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-indigo-600 outline-none" value={pontosConfig.pontos_perfil} onChange={e => setPontosConfig({...pontosConfig, pontos_perfil: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bônus Endereço</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-indigo-600 outline-none" value={pontosConfig.pontos_endereco} onChange={e => setPontosConfig({...pontosConfig, pontos_endereco: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <hr className="border-slate-50" />

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase italic">Trocas Sugeridas</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" placeholder="Buscar item..." 
                        className="p-3 bg-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 text-slate-700" 
                        value={buscaItem} onChange={e => setBuscaItem(e.target.value)}
                      />
                      <select 
                        className="p-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase outline-none border border-slate-200 text-slate-700"
                        value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
                      >
                        <option value="todas">Todas Categorias</option>
                        {categorias.map((c:any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <ItemSelector 
                      label="Troca em Destaque Principal" highlight={true}
                      value={pontosConfig.troca_principal_id}
                      onChange={(e:any) => setPontosConfig({...pontosConfig, troca_principal_id: e.target.value})}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(n => (
                        <ItemSelector 
                          key={n} label={`Sugestão ${n}`}
                          value={(pontosConfig as any)[`sugestao_${n}_id`]}
                          onChange={(e:any) => setPontosConfig({...pontosConfig, [`sugestao_${n}_id`]: e.target.value})}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-50">
                  <button type="submit" disabled={saving} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-500 transition-all shadow-xl">
                    Salvar Gamificação
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ABA USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 italic uppercase">Administradores</h2>
                <button type="button" onClick={() => { setUserForm({ id: null, nome: '', login: '', email: '', senha: '', tipo: 'admin' }); setShowModalUser(true); }} className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg">Novo Admin</button>
              </div>
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr><th className="px-10 py-5">Nome</th><th className="px-10 py-5 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {usuarios.length > 0 ? usuarios.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-all font-bold text-slate-600">
                        <td className="px-10 py-6">{u.nome} <span className="text-slate-300 ml-2 font-mono uppercase text-[10px]">@{u.login}</span></td>
                        <td className="px-10 py-6 text-right space-x-2">
                          <button type="button" onClick={() => { setUserForm({...u, senha: ''}); setShowModalUser(true); }} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-amber-500 transition-all"><i className="fas fa-edit"></i></button>
                          <button type="button" onClick={() => handleExcluirUser(u.id)} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><i className="fas fa-trash-alt"></i></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2} className="px-10 py-8 text-center text-xs text-slate-400 italic">Nenhum administrador encontrado nesta Liga.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL ADMIN */}
      {showModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <form onSubmit={handleSalvarUser} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-slate-800 italic uppercase mb-8">
              {userForm.id ? 'Editar' : 'Novo'} Admin
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Login/User</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700" value={userForm.login} onChange={e => setUserForm({...userForm, login: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
                  <div className="relative">
                    <input 
                      required={!userForm.id} 
                      type={verSenha ? "text" : "password"} 
                      placeholder={userForm.id ? "••••••••" : "Definir senha"}
                      className="w-full p-4 pr-12 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700" 
                      value={userForm.senha} onChange={e => setUserForm({...userForm, senha: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setVerSenha(!verSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors"
                    >
                      <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail Administrativo</label>
                <input required type="email" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => { setShowModalUser(false); setVerSenha(false); }} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black uppercase text-[10px] rounded-2xl hover:bg-slate-200 transition-all">Voltar</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-amber-500 text-white font-black uppercase text-[10px] rounded-2xl shadow-lg hover:bg-amber-600 transition-all disabled:opacity-50">
                {saving ? 'Gravando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default function ConfiguracoesPainel() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black uppercase tracking-widest text-xs text-slate-400 animate-pulse">Sincronizando Módulo de Configurações...</div>}>
      <ConfiguracoesConteudo />
    </Suspense>
  )
}
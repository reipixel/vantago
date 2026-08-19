'use client'
import { useState, useEffect } from 'react'
import { API_URL } from '@/app/lib/api'

export default function GestaoAssociados() {
  const [associados, setAssociados] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados dos Modais
  const [showModalUser, setShowModalUser] = useState(false)
  const [showModalPontos, setShowModalPontos] = useState(false)
  const [userSelecionado, setUserSelecionado] = useState<any>(null)
  
  // Controle visual do olho da senha
  const [verSenha, setVerSenha] = useState(false)
  
  // Formulário de Associado
  const [userForm, setUserForm] = useState({
    id: null,
    nome: '',
    email: '',
    senha: '', 
    ativo: true,
    tipo: 'associado'
  })

  // Estado de Ajuste de Pontos
  const [ajuste, setAjuste] = useState({ valor: '', motivo: '' })
  const [saving, setSaving] = useState(false)

  const obterSlugLigaContexto = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('liga')
    }
    return null
  }

  useEffect(() => {
    carregarAssociados()
  }, [])

  const carregarAssociados = async () => {
    setLoading(true)
    try {
      const liga = obterSlugLigaContexto()
      const url = liga 
        ? `${API_URL}/usuarios?liga=${liga}` 
        : `${API_URL}/usuarios`

      const res = await fetch(url)
      const data = await res.json()
      setAssociados(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Erro ao carregar associados:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirCriar = () => {
    setVerSenha(false)
    setUserForm({ id: null, nome: '', email: '', senha: '', ativo: true, tipo: 'associado' })
    setShowModalUser(true)
  }

  const handleAbrirEditar = (assoc: any) => {
    setVerSenha(false)
    // Passamos os dados atuais e deixamos o campo de senha em branco
    setUserForm({ ...assoc, senha: '' }) 
    setShowModalUser(true)
  }

  const handleSalvarAssociado = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userForm.id && !userForm.senha.trim()) {
      return alert("Por favor, informe uma senha inicial para o novo associado.")
    }

    setSaving(true)
    const liga = obterSlugLigaContexto()
    let url = userForm.id ? `${API_URL}/usuarios/${userForm.id}` : `${API_URL}/usuarios`
    if (liga) {
      url += url.includes('?') ? `&liga=${liga}` : `?liga=${liga}`
    }
    
    const method = userForm.id ? 'PATCH' : 'POST'

    try {
      const payload: any = { ...userForm }
      if (userForm.id && !userForm.senha.trim()) {
        delete payload.senha
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModalUser(false)
        await carregarAssociados()
        alert(userForm.id ? '✅ Dados do associado atualizados com sucesso!' : '✨ Novo associado cadastrado com sucesso!')
      } else {
        const error = await res.json()
        alert(error.message || "Erro ao salvar associado.")
      }
    } catch (err) {
      alert("Erro de conexão ao salvar associado.")
    } finally {
      setSaving(false)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!confirm("Excluir este associado permanentemente?")) return
    await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' })
    carregarAssociados()
  }

  const handleAbrirPontos = (assoc: any) => {
    setUserSelecionado(assoc)
    setAjuste({ valor: '', motivo: '' })
    setShowModalPontos(true)
  }

  const handleConfirmarAjuste = async (e: React.FormEvent) => {
    e.preventDefault() 
    if (!ajuste.valor || !ajuste.motivo) return alert("Preencha o valor e o motivo.")

    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/usuarios/${userSelecionado.id}/pontos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: Number(ajuste.valor), motivo: ajuste.motivo })
      })

      if (res.ok) {
        setShowModalPontos(false)
        await carregarAssociados() 
      } else {
        const errData = await res.json()
        alert(`Erro: ${errData.message}`)
      }
    } catch (err) {
      alert("Falha ao conectar com o servidor.")
    } finally {
      setSaving(false)
    }
  }

  const associadosFiltrados = associados.filter((a: any) => 
    a.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    a.email?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight text-designer">Associados</h1>
          <p className="text-slate-400 font-medium">Gestão de membros e saldo da Liga.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative w-full md:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" placeholder="Buscar associado..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all"
              value={busca} onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAbrirCriar}
            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-lg whitespace-nowrap"
          >
            + Novo Associado
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-5 text-left">Nome / E-mail</th>
              <th className="px-10 py-5 text-left">Status</th>
              <th className="px-10 py-5 text-center">Saldo Atual</th>
              <th className="px-10 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-10 py-10 text-center text-xs text-slate-400 font-black uppercase tracking-widest animate-pulse">
                  Carregando lista de associados...
                </td>
              </tr>
            ) : associadosFiltrados.length > 0 ? (
              associadosFiltrados.map((assoc: any) => (
                <tr key={assoc.id} className={`hover:bg-slate-50/30 transition-all group ${!assoc.ativo && 'opacity-60'}`}>
                  <td className="px-10 py-6">
                    <div className="font-bold text-slate-700">{assoc.nome}</div>
                    <div className="text-xs text-slate-400">{assoc.email}</div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${assoc.ativo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      {assoc.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-black border border-amber-100">
                      <i className="fas fa-coins text-[10px] opacity-40"></i>
                      {Number(assoc.saldo_pontos || 0).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAbrirPontos(assoc)} className="p-3 bg-slate-100 text-slate-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all" title="Gerenciar Pontos"><i className="fas fa-coins text-xs"></i></button>
                      <button onClick={() => handleAbrirEditar(assoc)} className="p-3 bg-slate-100 text-slate-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => handleExcluir(assoc.id)} className="p-3 bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-10 py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">
                  Nenhum associado encontrado para esta liga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO */}
      {showModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSalvarAssociado} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-800 mb-8">{userForm.id ? 'Editar' : 'Novo'} Associado</h2>
            <div className="space-y-4">
              <input required type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-700" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
              <input required type="email" placeholder="E-mail" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-700" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              
              {/* CAMPO DE SENHA ATUALIZADO COM O OLHO COMPARTILHADO PARA CADASTRO E EDIÇÃO */}
              <div className="relative flex items-center">
                <input 
                  required={!userForm.id} // Obrigatório apenas se for criação
                  minLength={6} 
                  type={verSenha ? "text" : "password"} 
                  placeholder={userForm.id ? "Nova Senha (deixe em branco para manter)" : "Senha de Acesso (Mín. 6 dígitos)"} 
                  className="w-full p-4 pr-12 bg-amber-50 border border-amber-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 placeholder:text-amber-700/40" 
                  value={userForm.senha} 
                  onChange={e => setUserForm({...userForm, senha: e.target.value})} 
                />
                <button 
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  className="absolute right-4 text-amber-600/60 hover:text-amber-700 transition"
                >
                  <i className={`fas ${verSenha ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status da Conta</span>
                <button 
                  type="button" 
                  onClick={() => setUserForm({...userForm, ativo: !userForm.ativo})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userForm.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userForm.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowModalUser(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all">{saving ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: AJUSTE DE PONTOS */}
      {showModalPontos && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmarAjuste} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Movimentar Pontos</h2>
            <p className="text-xs font-black text-slate-400 uppercase mb-8 tracking-widest">{userSelecionado?.nome}</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor (Positivo ou Negativo)</label>
                <input type="number" required placeholder="Ex: 500 ou -200" className="w-full mt-2 p-5 bg-slate-50 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-amber-500 transition-all" value={ajuste.valor} onChange={e => setAjuste({...ajuste, valor: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo</label>
                <input type="text" required placeholder="Ex: Crédito de fidelidade" className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all" value={ajuste.motivo} onChange={e => setAjuste({...ajuste, motivo: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowModalPontos(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-xl">
                {saving ? 'Gravando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
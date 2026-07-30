'use client'
import { useEffect, useState } from 'react'

interface AdminUser {
  id: number
  nome: string
  email: string
  login: string
  ativo: boolean
  criadoEm?: string
}

export default function GestaoSuperAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [adminEdicao, setAdminEdicao] = useState<AdminUser | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  // Formulário
  const [form, setForm] = useState({
    nome: '',
    email: '',
    login: '',
    senha: '',
  })

  useEffect(() => {
    carregarAdmins()
  }, [])

  const carregarAdmins = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/usuarios/admins', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setAdmins(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao buscar administradores:', res.statusText)
        setAdmins([])
      }
    } catch (err) {
      console.error('Erro ao carregar administradores:', err)
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }

  const abrirModalNovo = () => {
    setAdminEdicao(null)
    setForm({ nome: '', email: '', login: '', senha: '' })
    setModalAberto(true)
  }

  const abrirModalEditar = (admin: AdminUser) => {
    setAdminEdicao(admin)
    setForm({
      nome: admin.nome || '',
      email: admin.email || '',
      login: admin.login || '',
      senha: '',
    })
    setModalAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const isEdicao = !!adminEdicao
      const url = isEdicao
        ? `http://localhost:3000/usuarios/${adminEdicao.id}`
        : 'http://localhost:3000/usuarios'

      const method = isEdicao ? 'PATCH' : 'POST'

      const payload: any = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        login: form.login.trim(),
        tipo: 'admin',
      }

      if (form.senha.trim()) {
        payload.senha = form.senha.trim()
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        alert(isEdicao ? '✨ Administrador atualizado!' : '🚀 Novo administrador criado!')
        setModalAberto(false)
        await carregarAdmins()
      } else {
        alert(`Atenção: ${Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Erro ao salvar.'}`)
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarStatus = async (admin: AdminUser) => {
    const novoStatus = !admin.ativo
    if (!confirm(`Deseja ${novoStatus ? 'ativar' : 'desativar'} o acesso de ${admin.nome}?`)) return

    try {
      const res = await fetch(`http://localhost:3000/usuarios/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }),
      })

      if (res.ok) {
        carregarAdmins()
      }
    } catch (err) {
      alert('Erro ao alterar status.')
    }
  }

  const handleExcluir = async (admin: AdminUser) => {
    if (!confirm(`Atenção: Tem certeza que deseja remover ${admin.nome}? Esta ação é irreversível.`)) return

    try {
      const res = await fetch(`http://localhost:3000/usuarios/${admin.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        carregarAdmins()
      }
    } catch (err) {
      alert('Erro ao excluir administrador.')
    }
  }

  const adminsFiltrados = admins.filter(
    a =>
      a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      a.email?.toLowerCase().includes(busca.toLowerCase()) ||
      a.login?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
            Super Administradores
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic">
            Usuários com acesso total à plataforma e gestão de Ligas
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 active:scale-95"
        >
          <i className="fas fa-user-plus text-sm"></i>
          Novo Super Admin
        </button>
      </div>

      {/* BUSCA */}
      <div className="mb-8 relative">
        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou login..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* TABELA DE ADMINISTRADORES */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
            Carregando administradores...
          </div>
        ) : adminsFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminsFiltrados.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm">
                          {admin.nome?.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm italic">{admin.nome}</p>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                            Super Admin
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-slate-600 text-sm">{admin.email}</td>
                    <td className="p-5 font-mono text-xs text-slate-500">{admin.login}</td>
                    <td className="p-5">
                      <button
                        onClick={() => handleAlternarStatus(admin)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          admin.ativo
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(admin)}
                          className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                          title="Editar"
                        >
                          <i className="fas fa-pen text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleExcluir(admin)}
                          className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                          title="Excluir"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <i className="fas fa-user-shield text-4xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
              Nenhum administrador encontrado.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalAberto(false)}></div>

          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 z-10 animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-none">
                  {adminEdicao ? 'Editar Administrador' : 'Novo Administrador'}
                </h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Acesso Total ao Painel Super Admin
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="w-9 h-9 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1 block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1 block">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@plataforma.com"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1 block">
                  Login de Acesso
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: admin.carlos"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-mono"
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1 block">
                  Senha {adminEdicao && '(Deixe em branco para não alterar)'}
                </label>
                <input
                  type="password"
                  required={!adminEdicao}
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : adminEdicao ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
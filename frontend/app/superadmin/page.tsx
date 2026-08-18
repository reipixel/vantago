'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_URL } from '../lib/api'

interface Metrics {
  totalOrganizacoes: number
  totalAssociados: number
  totalPontos: number
  totalTrocas: number
  planosContagem: { nome: string; quantidade: number }[]
}

interface RecentLog {
  id: string
  tipo: string
  titulo: string
  descricao: string
  liga: string
  data: string
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrganizacoes: 0,
    totalAssociados: 0,
    totalPontos: 0,
    totalTrocas: 0,
    planosContagem: []
  })
  const [ultimosLogs, setUltimosLogs] = useState<RecentLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDadosDashboard()
  }, [])

  const carregarDadosDashboard = async () => {
    setLoading(true)
    try {
      // Chamadas paralelas apontando diretamente para os endpoints corretos da API
      const [resOrg, resUsers, resLogs] = await Promise.all([
        fetch(`${API_URL}/organizacoes`),
        fetch(`${API_URL}/usuarios`),
        fetch(`${API_URL}/logs`)
      ])

      const orgs = resOrg.ok ? await resOrg.json() : []
      const users = resUsers.ok ? await resUsers.json() : []
      const logs = resLogs.ok ? await resLogs.json() : []

      // Cálculo de métricas
      const totalAssociados = Array.isArray(users) ? users.length : 0
      const totalPontos = Array.isArray(users)
        ? users.reduce((acc: number, u: any) => acc + Number(u.saldo_pontos || 0), 0)
        : 0

      // Filtra logs que são trocas para contar total de resgates
      const totalTrocas = Array.isArray(logs)
        ? logs.filter((l: any) => l.tipo === 'troca').length
        : 0

      setMetrics({
        totalOrganizacoes: Array.isArray(orgs) ? orgs.length : 0,
        totalAssociados,
        totalPontos,
        totalTrocas,
        planosContagem: []
      })

      setUltimosLogs(Array.isArray(logs) ? logs.slice(0, 5) : [])
    } catch (err) {
      console.error('Erro ao carregar métricas do Super Admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const getIconeLog = (tipo: string) => {
    switch (tipo) {
      case 'cadastro':
        return <i className="fas fa-user-plus text-emerald-500"></i>
      case 'pontos':
        return <i className="fas fa-coins text-amber-500"></i>
      case 'troca':
        return <i className="fas fa-gift text-purple-500"></i>
      default:
        return <i className="fas fa-dot-circle text-slate-300"></i>
    }
  }

  return (
    <div className="animate-in fade-in duration-700 pb-20 space-y-8">
      
      {/* BOAS-VINDAS / HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3">
            Painel Executivo
          </span>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
            Visão Geral do Sistema
          </h1>
          <p className="text-slate-300 font-bold text-xs uppercase tracking-widest mt-2">
            Acompanhe a saúde, crescimento e engajamento das ligas ativas
          </p>
        </div>

        <button
          onClick={carregarDadosDashboard}
          className="relative z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
        >
          <i className="fas fa-sync-alt text-xs"></i>
          Atualizar Dados
        </button>

        {/* EFEITO DE GLOW DE FUNDO */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* CARDS DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: LIGAS / ENTIDADES */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Ligas Ativas
            </span>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
              <i className="fas fa-sitemap"></i>
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 italic">
            {loading ? '...' : metrics.totalOrganizacoes}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Entidades cadastradas
          </p>
        </div>

        {/* KPI 2: ASSOCIADOS */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total de Associados
            </span>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 italic">
            {loading ? '...' : metrics.totalAssociados.toLocaleString('pt-BR')}
          </h3>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1 flex items-center gap-1">
            <i className="fas fa-check-circle"></i> Base em expansão
          </p>
        </div>

        {/* KPI 3: PONTOS DISTRIBUÍDOS */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Saldo de Pontos
            </span>
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
              <i className="fas fa-coins"></i>
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 italic">
            {loading ? '...' : metrics.totalPontos.toLocaleString('pt-BR')}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Em circulação no ecossistema
          </p>
        </div>

        {/* KPI 4: RESGATES / TROCAS */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Trocas Solicitadas
            </span>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
              <i className="fas fa-gift"></i>
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 italic">
            {loading ? '...' : metrics.totalTrocas.toLocaleString('pt-BR')}
          </h3>
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1">
            Recompensas resgatadas
          </p>
        </div>

      </div>

      {/* SESSÃO SECUNDÁRIA: ATALHOS RÁPIDOS & FEED DE AUDITORIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ATALHOS DE GESTÃO (1 COLUNA) */}
        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 italic uppercase leading-none mb-2">
              Acesso Rápido
            </h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">
              Principais ações do Super Admin
            </p>

            <div className="space-y-3">
              <Link
                href="/superadmin/entidades"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-wider text-slate-700 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-sitemap text-indigo-500 text-sm"></i>
                  <span>Gerenciar Ligas</span>
                </div>
                <i className="fas fa-arrow-right text-slate-300 text-xs"></i>
              </Link>

              <Link
                href="/superadmin/administradores"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-wider text-slate-700 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-user-shield text-indigo-500 text-sm"></i>
                  <span>Administradores</span>
                </div>
                <i className="fas fa-arrow-right text-slate-300 text-xs"></i>
              </Link>

              <Link
                href="/superadmin/logs"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-wider text-slate-700 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-history text-indigo-500 text-sm"></i>
                  <span>Audit Logs</span>
                </div>
                <i className="fas fa-arrow-right text-slate-300 text-xs"></i>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Versão do Sistema: v2.4 Multi-Tenant
            </span>
          </div>
        </div>

        {/* ÚLTIMAS ATIVIDADES EM TEMPO REAL (2 COLUNAS) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 italic uppercase leading-none">
                Atividades Recentes
              </h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Últimas movimentações globais gravadas no sistema
              </p>
            </div>

            <Link
              href="/superadmin/logs"
              className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
            >
              Ver Tudo
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
              Carregando feed de atividades...
            </div>
          ) : ultimosLogs.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {ultimosLogs.map(log => (
                <div key={log.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getIconeLog(log.tipo)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm italic">{log.titulo}</h4>
                      <p className="text-slate-500 text-xs font-medium">{log.descricao}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase block mb-1">
                      {log.liga || 'Global'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-black uppercase text-xs tracking-widest">
              Nenhuma atividade registrada recentemente.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
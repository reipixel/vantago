'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { API_URL } from '../../lib/api'

function DashboardConteudo() {
  const searchParams = useSearchParams()
  const slugLiga = searchParams.get('liga') // Captura "liga-fiel" da URL caso venha do SuperAdmin

  const [stats, setStats] = useState({
    totalAssociados: 0,
    novosMes: 0,
    pontosCirculacao: 0,
    trocasPendentes: 0,
    taxaResgate: 0
  })
  const [pedidos, setPedidos] = useState([])
  const [atividades, setAtividades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDadosDashboard()
  }, [slugLiga]) // Recarrega sempre que o contexto da liga mudar

  const carregarDadosDashboard = async () => {
    setLoading(true)
    try {
      const fetchDados = async (url: string) => {
        try {
          // Adiciona o parâmetro de liga na URL se ele existir no contexto
          const urlComContexto = slugLiga 
            ? `${url}${url.includes('?') ? '&' : '?'}liga=${slugLiga}` 
            : url;

          const res = await fetch(urlComContexto, {
            headers: {
              'Content-Type': 'application/json',
              // Também envia como header customizado por garantia na interceptação multi-tenant do Backend
              ...(slugLiga ? { 'X-Organization-Slug': slugLiga } : {})
            }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (e) {
          console.error(`Erro na rota ${url}:`, e);
          return [];
        }
      };

      const [usuariosRaw, todosPedidosRaw, atividadesRaw] = await Promise.all([
        fetchDados(`${API_URL}/usuarios`),
        fetchDados(`${API_URL}/produtos/pedidos`),
        fetchDados(`${API_URL}/atividades`)
      ]);

      const usuarios = Array.isArray(usuariosRaw) ? usuariosRaw : [];
      const todosPedidos = Array.isArray(todosPedidosRaw) ? todosPedidosRaw : [];
      const listaAtividades = Array.isArray(atividadesRaw) ? atividadesRaw : [];

      const agora = new Date();
      const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      // Cálculos
      const novos = usuarios.filter((u: any) => {
        const data = new Date(u.data_criacao || u.createdAt || agora);
        return data >= primeiroDiaMes;
      }).length;

      const pontosEmMaos = usuarios.reduce((acc: number, curr: any) => acc + Number(curr.saldo_pontos || 0), 0);
      const pendentes = todosPedidos.filter((p: any) => p.status === 'pendente');

      const pontosJaTrocados = todosPedidos
        .filter((p: any) => p.status === 'aprovado' || p.status === 'entregue')
        .reduce((acc: number, curr: any) => acc + Number(curr.pontos_utilizados || 0), 0);
      
      const totalHistorico = pontosEmMaos + pontosJaTrocados;
      const taxa = totalHistorico > 0 ? Math.round((pontosJaTrocados / totalHistorico) * 100) : 0;

      setStats({
        totalAssociados: usuarios.length,
        novosMes: novos,
        pontosCirculacao: pontosEmMaos,
        trocasPendentes: pendentes.length,
        taxaResgate: taxa
      });

      setPedidos(pendentes.slice(0, 5));
      setAtividades(listaAtividades.slice(0, 2));

    } catch (err) {
      console.error("Erro crítico no dashboard:", err);
    } fontally {
      setLoading(false);
    }
  };

  const handleStatusTroca = async (id: number, novoStatus: string) => {
    if (!confirm(`Deseja alterar o status para ${novoStatus}?`)) return
    try {
      const res = await fetch(`${API_URL}/produtos/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(slugLiga ? { 'X-Organization-Slug': slugLiga } : {})
        },
        body: JSON.stringify({ status: novoStatus })
      })
      if (res.ok) carregarDadosDashboard()
    } catch (err) { alert("Erro ao atualizar") }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* IDENTIFICADOR VISUAL DO CONTEXTO MULTI-TENANT */}
      {slugLiga && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-xs text-amber-500 font-black uppercase tracking-wider">
              Modo SuperAdmin: Visualizando dados da Entidade: <span className="font-mono text-white underline">{slugLiga}</span>
            </p>
          </div>
          <Link href="/superadmin/entidades" className="text-[10px] bg-slate-800 text-slate-300 font-black px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-slate-900 transition">
            Voltar para Ligas
          </Link>
        </div>
      )}
      
      {/* 1. INDICADORES INTEGRADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Associados</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{loading ? '...' : stats.totalAssociados}</h3>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><i className="fas fa-user-friends"></i></div>
          </div>
          <p className="text-[10px] text-green-600 mt-3 font-black uppercase tracking-tighter italic">
            <i className="fas fa-caret-up"></i> {stats.novosMes} novos este mês
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pontos Emitidos</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{loading ? '...' : stats.pontosCirculacao.toLocaleString()}</h3>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><i className="fas fa-coins"></i></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase italic tracking-tighter">Em circulação na Liga</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Trocas Pendentes</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-2">{loading ? '...' : stats.trocasPendentes.toString().padStart(2, '0')}</h3>
            </div>
            <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><i className="fas fa-hourglass-half"></i></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tighter italic">
            <Link href={slugLiga ? `/admin/dashboard/trocas?liga=${slugLiga}` : "/admin/dashboard/trocas"} className="text-orange-500 hover:underline tracking-widest">
              Aprovação Necessária
            </Link>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Taxa Resgate</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{loading ? '...' : `${stats.taxaResgate}%`}</h3>
            </div>
            <div className="bg-green-50 text-green-600 p-2 rounded-lg"><i className="fas fa-shopping-cart"></i></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 italic font-bold uppercase text-right leading-none">Uso dos pontos</p>
        </div>
      </div>

      {/* 2. ACESSO RÁPIDO */}
      <div className="flex flex-wrap gap-3">
        <Link href={slugLiga ? `/admin/dashboard/usuarios/novo?liga=${slugLiga}` : "/admin/dashboard/usuarios/novo"} className="bg-slate-800 text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-900 transition flex items-center gap-2">
          <i className="fas fa-user-plus"></i> Novo Associado
        </Link>
        <Link href={slugLiga ? `/admin/dashboard/registrar?liga=${slugLiga}` : "/admin/dashboard/registrar"} className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-[2px] hover:bg-indigo-700 transition flex items-center gap-2">
          <i className="fas fa-check-double"></i> Registrar Pontos
        </Link>
        <Link href={slugLiga ? `/admin/dashboard/catalogo/novo?liga=${slugLiga}` : "/admin/dashboard/catalogo/novo"} className="bg-white border border-gray-200 text-slate-600 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-[2px] hover:bg-gray-50 transition flex items-center gap-2">
          <i className="fas fa-plus text-amber-500"></i> Novo Item
        </Link>
        <Link href={slugLiga ? `/admin/dashboard/trocas?liga=${slugLiga}` : "/admin/dashboard/trocas"} className="bg-white border border-gray-200 text-slate-600 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-[2px] hover:bg-gray-50 transition flex items-center gap-2">
          <i className="fas fa-exchange-alt"></i> Ver Trocas
        </Link>
      </div>

      {/* 3. SOLICITAÇÕES E ATIVIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 italic uppercase text-sm tracking-tight flex items-center gap-2">
              <i className="fas fa-list-ul text-indigo-500"></i> Solicitações Pendentes
            </h3>
            <Link href={slugLiga ? `/admin/dashboard/trocas?liga=${slugLiga}` : "/admin/dashboard/trocas"} className="text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:underline">Ver tudo</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-6 py-3">Associado</th>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3 text-center">Pontos</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Buscando requisições...</td></tr>
                ) : pedidos.length > 0 ? pedidos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 uppercase italic text-[12px] leading-none">{p.usuario?.nome}</span>
                        <span className="text-[10px] text-gray-400 mt-1 font-bold italic">{p.data_solicitacao ? new Date(p.data_solicitacao).toLocaleDateString() : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{p.produto?.nome}</td>
                    <td className="px-6 py-4 text-center font-black text-indigo-600">{p.pontos_utilizados}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleStatusTroca(p.id, 'cancelado')} className="text-red-400 hover:text-red-600 p-2 transition"><i className="fas fa-times"></i></button>
                      <button onClick={() => handleStatusTroca(p.id, 'aprovado')} className="bg-green-500 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-green-600 transition">APROVAR</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">Nenhuma solicitação pendente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA DE ATIVIDADES DINÂMICA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30">
            <h3 className="font-bold text-slate-800 italic uppercase text-sm tracking-tight flex items-center gap-2">
              <i className="fas fa-bolt text-yellow-500"></i> Atividades
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {loading ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4 animate-pulse">Sincronizando agenda...</p>
            ) : atividades.length > 0 ? atividades.map((atv: any) => (
              <div key={atv.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase italic">Próxima Atividade</p>
                <h4 className="font-black text-slate-700 uppercase text-xs mt-1 leading-tight">{atv.nome}</h4>
                <Link href={slugLiga ? `/admin/dashboard/registrar?liga=${slugLiga}` : "/admin/dashboard/registrar"} className="inline-block mt-3 text-[10px] font-black text-indigo-600 uppercase hover:underline">
                  Registrar Pontos <i className="fas fa-chevron-right ml-1"></i>
                </Link>
              </div>
            )) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4 italic">Nenhuma atividade agendada</p>
            )}
            
            <Link href={slugLiga ? `/admin/dashboard/atividades?liga=${slugLiga}` : "/admin/dashboard/atividades"} className="block w-full bg-white border-2 border-dashed border-slate-200 text-slate-400 py-3 rounded-lg text-[10px] font-black uppercase text-center hover:border-indigo-300 hover:text-indigo-500 transition-all">
              Gerenciar Atividades
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black uppercase tracking-widest text-xs text-slate-400">Carregando Módulos do Dashboard...</div>}>
      <DashboardConteudo />
    </Suspense>
  )
}
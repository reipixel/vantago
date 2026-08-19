'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function PerfilAssociado() {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState(1)
  
  // Estado para o Modal de Recompensa
  const [bonusConquistado, setBonusConquistado] = useState<{ pontos: number; titulo: string } | null>(null)

  const [config, setConfig] = useState({ pontos_perfil: 50, pontos_endereco: 100 })
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null)

  const [verSenhas, setVerSenhas] = useState({ atual: false, nova: false, confirma: false })
  const [dadosPessoais, setDadosPessoais] = useState({ nome: '', genero: '', nascimento: '' })
  const [endereco, setEndereco] = useState({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [senhas, setSenhas] = useState({ atual: '', nova: '', confirma: '' })

  useEffect(() => {
    carregarDadosUsuario()
    carregarConfiguracoes()
  }, [slug])

  const carregarDadosUsuario = async () => {
    setCarregandoDados(true)
    const sessionKey = slug ? `@associado_session_${slug}` : 'associado_data'
    const rawData = localStorage.getItem(sessionKey) || localStorage.getItem('associado_data')

    if (!rawData) {
      setCarregandoDados(false)
      return
    }

    try {
      const parsed = JSON.parse(rawData)
      const userObj = parsed.user || parsed

      if (!userObj?.id) {
        setCarregandoDados(false)
        return
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(slug ? { 'X-Organization-Slug': slug } : {})
      }

      const res = await fetch(`${API_URL}/usuarios/${userObj.id}`, { headers })
      const dadosCompletos = res.ok ? await res.json() : userObj

      setUser(dadosCompletos)
      
      setDadosPessoais({ 
        nome: dadosCompletos.nome || '', 
        genero: dadosCompletos.genero || '', 
        nascimento: dadosCompletos.data_nascimento ? dadosCompletos.data_nascimento.split('T')[0] : '' 
      })

      setEndereco({
        cep: dadosCompletos.cep || '',
        logradouro: dadosCompletos.logradouro || '',
        numero: dadosCompletos.numero || '',
        complemento: dadosCompletos.complemento || '',
        bairro: dadosCompletos.bairro || '',
        cidade: dadosCompletos.cidade || '',
        estado: dadosCompletos.estado || ''
      })
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
    } finally {
      setCarregandoDados(false)
    }
  }

  const carregarConfiguracoes = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(slug ? { 'X-Organization-Slug': slug } : {})
      }
      const queryLiga = slug ? `?liga=${slug}` : ''

      const res = await fetch(`${API_URL}/configuracoes/1${queryLiga}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setConfig({
          pontos_perfil: Number(data.pontos_perfil) || 50,
          pontos_endereco: Number(data.pontos_endereco) || 100
        })
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de bônus:", err)
    }
  }

  const handleSave = async (aba: number) => {
    if (!user?.id) return

    setLoading(true)
    const formData = new FormData()
    const dadosParaSalvar = aba === 1 ? dadosPessoais : endereco

    Object.entries(dadosParaSalvar).forEach(([key, value]) => {
      const apiKey = key === 'nascimento' ? 'data_nascimento' : key
      if (value !== null && value !== undefined) {
        formData.append(apiKey, value.toString())
      }
    })

    formData.append('aba', aba.toString())

    if (aba === 1 && arquivoFoto) {
      formData.append('foto', arquivoFoto)
    }

    try {
      const headers: Record<string, string> = {
        ...(slug ? { 'X-Organization-Slug': slug } : {})
      }

      const res = await fetch(`${API_URL}/usuarios/${user.id}/perfil`, {
        method: 'PATCH',
        headers,
        body: formData, 
      })

      if (res.ok) {
        const usuarioAtualizado = await res.json()
        
        // Verifica se o associado ganhou pontos no backend
        const saldoAnterior = Number(user.saldo_pontos || 0)
        const saldoNovo = Number(usuarioAtualizado.saldo_pontos || 0)
        
        if (saldoNovo > saldoAnterior) {
          const ganho = saldoNovo - saldoAnterior
          setBonusConquistado({
            pontos: ganho,
            titulo: aba === 1 ? 'Dados Pessoais Preenchidos!' : 'Endereço Cadastrado!'
          })
        }

        setUser(usuarioAtualizado)
        
        // Atualiza a sessão
        const sessionKey = slug ? `@associado_session_${slug}` : 'associado_data'
        localStorage.setItem(sessionKey, JSON.stringify(usuarioAtualizado))
        localStorage.setItem('associado_data', JSON.stringify(usuarioAtualizado))

        setArquivoFoto(null)
        setFotoPreview(null)
      } else {
        alert("Erro ao atualizar os dados.")
      }
    } catch (err) {
      console.error(err)
      alert("Erro de conexão ao salvar dados.")
    } finally {
      setLoading(false)
    }
  }

  const formatarImagem = (caminho?: string) => {
    if (!caminho) return null
    return caminho.startsWith('http') ? caminho : `${API_URL}${caminho}`
  }

  if (carregandoDados) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
        Carregando dados do perfil...
      </div>
    )
  }

  if (!user) return null

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1 block";
  const btnClass = "w-full bg-slate-900 text-white py-5 rounded-[22px] font-black text-[10px] uppercase tracking-[2px] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 mt-10 disabled:opacity-50";

  return (
    <div className="animate-in fade-in duration-700 max-w-3xl mx-auto pb-20">
      
      {/* POP-UP / MODAL DE CELEBRAÇÃO DE BÔNUS */}
      {bonusConquistado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setBonusConquistado(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-8 text-center shadow-2xl z-10 border border-emerald-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
              <i className="fas fa-gift text-3xl animate-bounce"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-tight mb-2">
              {bonusConquistado.titulo}
            </h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
              Você acabou de ganhar
            </p>
            <div className="bg-emerald-50 border-2 border-emerald-200 py-4 px-6 rounded-2xl mb-8">
              <span className="text-4xl font-black text-emerald-600">+{bonusConquistado.pontos}</span>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider ml-2">PONTOS</span>
            </div>
            <button
              onClick={() => setBonusConquistado(null)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
            >
              Incrível! Resgatar Prêmios
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Meu Perfil</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mt-2 italic tracking-tighter">
          Personalize sua experiência na Liga {slug ? `(${slug})` : ''}
        </p>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-[24px]">
        {[
          { id: 1, label: 'Seus Dados', icon: 'fa-user', feito: user.perfil_completo },
          { id: 2, label: 'Endereço', icon: 'fa-map-marker-alt', feito: user.endereco_completo },
          { id: 3, label: 'Acesso', icon: 'fa-shield-alt', feito: true }
        ].map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all relative ${
              abaAtiva === aba.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className={`fas ${aba.icon}`}></i>
            <span className="hidden md:block">{aba.label}</span>
            {aba.feito && (
              <i className="fas fa-check-circle text-emerald-500 text-xs ml-1"></i>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[45px] border border-slate-100 shadow-sm relative overflow-hidden">
        
        {/* ABA 1: DADOS PESSOAIS */}
        {abaAtiva === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            
            {/* CAIXA DE INCENTIVO DE GAMIFICAÇÃO (SEUS DADOS) */}
            {!user.perfil_completo ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-[30px] shadow-lg shadow-emerald-200 flex items-center gap-5 mb-8 relative overflow-hidden">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 text-white">
                  <i className="fas fa-coins text-xl animate-pulse"></i>
                </div>
                <div className="flex-1">
                  <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-1 inline-block">
                    Missão de Boas-Vindas
                  </span>
                  <h4 className="font-black italic uppercase text-sm leading-tight">
                    Complete seu cadastro e ganhe +{config.pontos_perfil} PTS!
                  </h4>
                  <p className="text-[10px] text-white/80 font-bold leading-tight mt-0.5">
                    Preencha seu Nome, Gênero e Data de Nascimento para desbloquear a pontuação.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mb-8 text-emerald-700">
                <i className="fas fa-check-circle text-emerald-500 text-base"></i>
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Etapa concluída! Bônus de {config.pontos_perfil} PTS creditado.
                </span>
              </div>
            )}

            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                  {fotoPreview || user.foto_url ? (
                    <img 
                      src={fotoPreview || formatarImagem(user.foto_url) || ''} 
                      className="w-full h-full object-cover" 
                      alt="Avatar" 
                    />
                  ) : (
                    <i className="fas fa-user text-slate-300 text-4xl"></i>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-900 transition-all border-4 border-white">
                  <i className="fas fa-camera text-xs"></i>
                  <input 
                    type="file" className="hidden" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setArquivoFoto(file);
                        setFotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Nome Completo</label>
                <input type="text" className={inputClass} value={dadosPessoais.nome} onChange={e => setDadosPessoais({...dadosPessoais, nome: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Gênero</label>
                <select className={inputClass} value={dadosPessoais.genero} onChange={e => setDadosPessoais({...dadosPessoais, genero: e.target.value})}>
                  <option value="">Selecionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Data de Nascimento</label>
                <input type="date" className={inputClass} value={dadosPessoais.nascimento} onChange={e => setDadosPessoais({...dadosPessoais, nascimento: e.target.value})} />
              </div>
            </div>

            <button onClick={() => handleSave(1)} disabled={loading} className={btnClass}>
              {loading ? 'Processando...' : user.perfil_completo ? 'Salvar Alterações' : `Salvar e Resgatar +${config.pontos_perfil} Pontos`}
            </button>
          </div>
        )}

        {/* ABA 2: ENDEREÇO */}
        {abaAtiva === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            
            {/* CAIXA DE INCENTIVO DE GAMIFICAÇÃO (ENDEREÇO) */}
            {!user.endereco_completo ? (
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-[30px] shadow-lg shadow-indigo-200 flex items-center gap-5 mb-8 relative overflow-hidden">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 text-white">
                  <i className="fas fa-map-marked-alt text-xl animate-pulse"></i>
                </div>
                <div className="flex-1">
                  <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-1 inline-block">
                    Conquista de Localização
                  </span>
                  <h4 className="font-black italic uppercase text-sm leading-tight">
                    Cadastre seu Endereço e ganhe +{config.pontos_endereco} PTS!
                  </h4>
                  <p className="text-[10px] text-white/80 font-bold leading-tight mt-0.5">
                    Preencha o CEP e logradouro para acumular mais pontos para trocas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mb-8 text-emerald-700">
                <i className="fas fa-check-circle text-emerald-500 text-base"></i>
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Endereço Cadastrado! Bônus de {config.pontos_endereco} PTS creditado.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className={labelClass}>CEP</label><input type="text" className={inputClass} value={endereco.cep} onChange={e => setEndereco({...endereco, cep: e.target.value})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Logradouro</label><input type="text" className={inputClass} value={endereco.logradouro} onChange={e => setEndereco({...endereco, logradouro: e.target.value})} /></div>
              <div><label className={labelClass}>Número</label><input type="text" className={inputClass} value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Complemento</label><input type="text" className={inputClass} value={endereco.complemento} onChange={e => setEndereco({...endereco, complemento: e.target.value})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Bairro</label><input type="text" className={inputClass} value={endereco.bairro} onChange={e => setEndereco({...endereco, bairro: e.target.value})} /></div>
              <div><label className={labelClass}>Cidade</label><input type="text" className={inputClass} value={endereco.cidade} onChange={e => setEndereco({...endereco, cidade: e.target.value})} /></div>
              <div><label className={labelClass}>Estado</label><input type="text" className={inputClass} value={endereco.estado} onChange={e => setEndereco({...endereco, estado: e.target.value})} /></div>
            </div>

            <button onClick={() => handleSave(2)} disabled={loading} className={btnClass}>
              {loading ? 'Processando...' : user.endereco_completo ? 'Atualizar Endereço' : `Salvar e Resgatar +${config.pontos_endereco} Pontos`}
            </button>
          </div>
        )}

        {/* ABA 3: SEGURANÇA */}
        {abaAtiva === 3 && (
          <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div><label className={labelClass}>E-mail</label><input type="text" disabled className={`${inputClass} opacity-50`} value={user.email || ''} /></div>
                <div><label className={labelClass}>Login</label><input type="text" disabled className={`${inputClass} opacity-50`} value={user.login || ''} /></div>
             </div>
             <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="relative">
                  <label className={labelClass}>Senha Atual</label>
                  <input type={verSenhas.atual ? 'text' : 'password'} className={inputClass} value={senhas.atual} onChange={e => setSenhas({...senhas, atual: e.target.value})} />
                  <button type="button" onClick={() => setVerSenhas({...verSenhas, atual: !verSenhas.atual})} className="absolute right-4 top-9 text-slate-300 hover:text-indigo-600"><i className={`fas ${verSenhas.atual ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className={labelClass}>Nova Senha</label>
                    <input type={verSenhas.nova ? 'text' : 'password'} className={inputClass} value={senhas.nova} onChange={e => setSenhas({...senhas, nova: e.target.value})} />
                    <button type="button" onClick={() => setVerSenhas({...verSenhas, nova: !verSenhas.nova})} className="absolute right-4 top-9 text-slate-300 hover:text-indigo-600"><i className={`fas ${verSenhas.nova ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Confirmar Senha</label>
                    <input type={verSenhas.confirma ? 'text' : 'password'} className={inputClass} value={senhas.confirma} onChange={e => setSenhas({...senhas, confirma: e.target.value})} />
                    <button type="button" onClick={() => setVerSenhas({...verSenhas, confirma: !verSenhas.confirma})} className="absolute right-4 top-9 text-slate-300 hover:text-indigo-600"><i className={`fas ${verSenhas.confirma ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <button type="button" className={btnClass}>Alterar Senha</button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
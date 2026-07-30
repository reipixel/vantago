import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atividade } from './atividade.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AtividadesService {
  constructor(
    @InjectRepository(Atividade)
    private atividadesRepository: Repository<Atividade>,
    
    private readonly usuariosService: UsuariosService,
  ) {}

  // 1. AJUSTADO: Busca filtrando diretamente pela coluna ID ou através de join estável
  async findAll(slugLiga?: string): Promise<Atividade[]> {
    if (!slugLiga) {
      return this.atividadesRepository.find({ order: { nome: 'ASC' } });
    }

    // Busca o ID numérico da liga baseado no slug para realizar um filtro limpo
    const org = await this.atividadesRepository.manager.getRepository('Organizacao').findOne({
      where: { slug: slugLiga }
    }) as any;

    if (!org) return [];

    return this.atividadesRepository.find({
      where: {
        organizacaoId: org.id // Filtro numérico direto, evita quebras de relacionamento do ORM
      },
      order: { nome: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Atividade> {
    const atividade = await this.atividadesRepository.findOneBy({ id: id as any });
    if (!atividade) throw new NotFoundException('Atividade não encontrada');
    return atividade;
  }

  // 2. CORRIGIDO: Vincula a organização recuperando o objeto tipado correto do banco, eliminando o erro de update values
  async criar(dados: any, slugLiga?: string): Promise<Atividade> {
    try {
      if (dados.id) delete dados.id;

      // Criamos o objeto base sanitizando os tipos
      const payload: any = {
        nome: dados.nome,
        descricao: dados.descricao,
        pontos: Number(dados.pontos || 0),
        local: dados.local || 'Presencial',
        status: dados.status || 'ativa',
        limiteParticipantes: dados.limiteParticipantes === 'null' || !dados.limiteParticipantes ? null : Number(dados.limiteParticipantes),
        imagem_p: dados.imagem_p || null,
        
        // --- NOVOS CAMPOS: BOTÃO DE AÇÃO ---
        exibirBotaoAcao: String(dados.exibirBotaoAcao) === 'true',
        textoBotao: dados.textoBotao || null,
        linkBotao: dados.linkBotao || null
      };

      // Só adiciona a data se ela for válida
      if (dados.dataHora && String(dados.dataHora).trim() !== "" && dados.dataHora !== "null") {
        payload.dataHora = dados.dataHora;
      }

      // Se houver o contexto de uma liga, buscamos o registro original completo para fazer o link correto
      if (slugLiga) {
        const org = await this.atividadesRepository.manager.getRepository('Organizacao').findOne({
          where: { slug: slugLiga }
        }) as any;
        
        if (org) {
          // Atribui o objeto completo carregado do banco (com ID presente) ou atribui o ID na coluna direta se mapeada
          payload.organizacao = org;
          // Caso sua entidade use diretamente a coluna numérica física:
          // payload.organizacaoId = org.id; 
        }
      }

      const novaAtividade = this.atividadesRepository.create(payload as Atividade);
      return await this.atividadesRepository.save(novaAtividade);
    } catch (error) {
      console.error("ERRO NO BANCO (CRIAR):", error.message);
      throw new BadRequestException(`Erro ao salvar atividade: ${error.message}`);
    }
  }

  async atualizar(id: number, dados: any): Promise<Atividade> {
    try {
      const atividade = await this.findOne(id);
      
      // Sanitização para garantir que campos numéricos não entrem como string
      if (dados.pontos !== undefined) dados.pontos = Number(dados.pontos);
      if (dados.limiteParticipantes === "" || dados.limiteParticipantes === "null") dados.limiteParticipantes = null;
      
      // --- AJUSTE: BOTÃO DE AÇÃO ---
      if (dados.exibirBotaoAcao !== undefined) {
        dados.exibirBotaoAcao = String(dados.exibirBotaoAcao) === 'true';
      }

      // Evita sobrepor o relacionamento com dados sujos nas atualizações parciais
      if (dados.liga) delete dados.liga;

      // Mesclamos os dados novos por cima da existente
      const atualizada = this.atividadesRepository.merge(atividade, dados);
      
      return await this.atividadesRepository.save(atualizada);
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error.message);
      throw new BadRequestException("Erro ao atualizar. Verifique a integridade dos dados.");
    }
  }

  async remover(id: number): Promise<void> {
    await this.atividadesRepository.delete(id);
  }

  /**
   * REGISTRO DE PARTICIPAÇÃO MÚLTIPLA
   */
  async registrarParticipacaoMultipla(usuariosIds: number[], atividadeId: number): Promise<any> {
    const atividade = await this.findOne(atividadeId);

    const promessas = usuariosIds.map(uId => 
      this.usuariosService.ajustarPontos(
        uId, 
        atividade.pontos, 
        `Atividade: ${atividade.nome}`
      )
    );

    await Promise.all(promessas);

    return { 
      sucesso: true, 
      processados: usuariosIds.length,
      points_per_person: atividade.pontos 
    };
  }
}
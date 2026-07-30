import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracao } from './configuracao.entity';

@Injectable()
export class ConfiguracoesService {
  constructor(
    @InjectRepository(Configuracao)
    private readonly repo: Repository<Configuracao>,
  ) {}

  async findOne(id: number, slugLiga?: string): Promise<Configuracao> {
    try {
      let orgId: number | null = null;

      if (slugLiga) {
        const org = await this.repo.manager.getRepository('Organizacao').findOne({
          where: { slug: slugLiga }
        }) as any;
        if (org) {
          orgId = org.id;
        }
      }

      // Busca filtrando por organizacaoId caso venha com tenant (slug), ou por ID direto como fallback
      let config = await this.repo.findOne({
        where: orgId ? { organizacaoId: orgId } : { id }
      });

      // Cria a configuração isolada da liga se for o primeiro acesso dela
      if (!config && orgId) {
        config = this.repo.create({
          nome_entidade: 'Nova Entidade',
          nome_liga: slugLiga || 'Nova Liga',
          email_suporte: '',
          telefone: '',
          organizacaoId: orgId
        });
        await this.repo.save(config);
      } 
      else if (!config && id === 1) {
        config = this.repo.create({
          id: 1,
          nome_entidade: 'Nome da Entidade Local',
          nome_liga: 'Nome da Liga Local',
          email_suporte: '',
          telefone: ''
        });
        await this.repo.save(config);
      }

      if (!config) {
        throw new NotFoundException(`Configuração não encontrada.`);
      }

      return config;
    } catch (error) {
      console.error("Erro ao buscar configurações multi-tenant:", error.message);
      throw new BadRequestException("Erro ao carregar dados institucionais da liga.");
    }
  }

  async update(id: number, dados: any, slugLiga?: string): Promise<Configuracao> {
    try {
      const configExistente = await this.findOne(id, slugLiga);

      const { id: _, organizacaoId: __, ...payload } = dados;

      const configAtualizada = this.repo.merge(configExistente, payload);

      return await this.repo.save(configAtualizada);
    } catch (error) {
      console.error("ERRO MULTI-TENANT AO ATUALIZAR CONFIGURAÇÕES:", error.message);
      throw new BadRequestException(`Erro ao salvar dados institucionais: ${error.message}`);
    }
  }
}
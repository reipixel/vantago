import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { HistoricoPontos } from '../usuarios/historico-pontos.entity';
import { Troca } from '../catalogo/troca.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(HistoricoPontos)
    private readonly historicoRepo: Repository<HistoricoPontos>,

    @InjectRepository(Troca)
    private readonly trocaRepo: Repository<Troca>,
  ) {}

  async obterLogsGerais(slugLiga?: string) {
    const logs: any[] = [];

    // 1. Logs de Cadastros de Associados
    const queryUsuarios = this.usuarioRepo.createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.organizacao', 'org')
      .where('usuario.tipo = :tipo', { tipo: 'associado' })
      .orderBy('usuario.id', 'DESC')
      .take(50);

    if (slugLiga) {
      queryUsuarios.andWhere('org.slug = :slugLiga', { slugLiga });
    }

    const usuarios = await queryUsuarios.getMany();
    usuarios.forEach(u => {
      const org = u.organizacao as any;
      const nomeLiga = org?.nome || org?.razao_social || org?.nome_fantasia || 'Global / Sem Liga';

      logs.push({
        id: `user-${u.id}`,
        tipo: 'cadastro',
        categoria: 'Associado',
        titulo: 'Novo Cadastro de Associado',
        descricao: `${u.nome} (${u.email}) se cadastrou na plataforma.`,
        liga: nomeLiga,
        slug: org?.slug || '',
        data: (u as any).criadoEm || new Date(),
        badgeColor: 'emerald'
      });
    });

    // 2. Logs de Movimentação/Ajustes de Pontos
    const queryPontos = this.historicoRepo.createQueryBuilder('historico')
      .leftJoinAndSelect('historico.usuario', 'usuario')
      .leftJoinAndSelect('usuario.organizacao', 'org')
      .orderBy('historico.data', 'DESC')
      .take(50);

    if (slugLiga) {
      queryPontos.andWhere('org.slug = :slugLiga', { slugLiga });
    }

    const historicos = await queryPontos.getMany();
    historicos.forEach(h => {
      const eDebito = h.valor < 0;
      const org = h.usuario?.organizacao as any;
      const nomeLiga = org?.nome || org?.razao_social || org?.nome_fantasia || 'Global';

      logs.push({
        id: `ponto-${h.id}`,
        tipo: 'pontos',
        categoria: eDebito ? 'Débito' : 'Crédito',
        titulo: `${eDebito ? 'Débito' : 'Crédito'} de ${Math.abs(h.valor)} Pontos`,
        descricao: `${h.usuario?.nome || 'Associado'}: ${h.motivo}`,
        liga: nomeLiga,
        slug: org?.slug || '',
        data: h.data,
        badgeColor: eDebito ? 'amber' : 'indigo'
      });
    });

    // 3. Logs de Solicitações/Pedidos de Troca
    const queryTrocas = this.trocaRepo.createQueryBuilder('troca')
      .leftJoinAndSelect('troca.usuario', 'usuario')
      .leftJoinAndSelect('troca.produto', 'produto')
      .leftJoinAndSelect('usuario.organizacao', 'org')
      .orderBy('troca.data_solicitacao', 'DESC')
      .take(50);

    if (slugLiga) {
      queryTrocas.andWhere('org.slug = :slugLiga', { slugLiga });
    }

    const trocas = await queryTrocas.getMany();
    trocas.forEach(t => {
      const org = t.usuario?.organizacao as any;
      const nomeLiga = org?.nome || org?.razao_social || org?.nome_fantasia || 'Global';

      logs.push({
        id: `troca-${t.id}`,
        tipo: 'troca',
        categoria: 'Resgate',
        titulo: `Solicitação de Troca (${t.status?.toUpperCase() || 'PENDENTE'})`,
        descricao: `${t.usuario?.nome || 'Associado'} resgatou "${t.produto?.nome || 'Produto'}" por ${t.pontos_utilizados} PTS.`,
        liga: nomeLiga,
        slug: org?.slug || '',
        data: t.data_solicitacao,
        badgeColor: 'purple'
      });
    });

    // Ordena todos os eventos combinados por data decrescente
    return logs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }
}
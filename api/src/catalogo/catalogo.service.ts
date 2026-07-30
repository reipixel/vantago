import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { Categoria } from './categoria.entity';
import { Troca } from './troca.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(Produto)
    private itemRepository: Repository<Produto>,

    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    @InjectRepository(Troca)
    private trocaRepository: Repository<Troca>,

    private readonly usuariosService: UsuariosService,
  ) {}

  async findAll(apenasAtivos: boolean = false, slugLiga?: string): Promise<Produto[]> {
    const query = this.itemRepository.createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .orderBy('produto.id', 'DESC');

    if (apenasAtivos) {
      query.where(
        '(produto.status = :status OR produto.status IS NULL OR produto.status = :vazio)', 
        { status: 'ativo', vazio: '' }
      );
    }

    if (slugLiga) {
      const org = await this.itemRepository.manager.getRepository('Organizacao').findOne({
        where: { slug: slugLiga }
      }) as any;

      if (org) {
        query.andWhere('produto.organizacaoId = :orgId', { orgId: org.id });
      } else {
        query.andWhere('1 = 0');
      }
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<Produto> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async criar(dados: any, file?: Express.Multer.File, slugLiga?: string): Promise<Produto> {
    const caminhoImagem = file ? `/uploads/${file.filename}` : '/uploads/default.png';

    const payload: any = {
      nome: dados?.nome || 'Novo Item de Troca',
      descricao: dados?.descricao || '',
      preco_pontos: dados?.preco_pontos ? Number(dados.preco_pontos) : 0,
      estoque: dados?.estoque ? Number(dados.estoque) : 0,
      imagem_p: caminhoImagem,
      imagem_g: caminhoImagem,
      status: dados?.status || 'ativo'
    };

    if (dados?.categoriaId) {
      payload.categoriaId = Number(dados.categoriaId);
    }

    if (slugLiga) {
      const org = await this.itemRepository.manager.getRepository('Organizacao').findOne({
        where: { slug: slugLiga }
      }) as any;
      if (org) payload.organizacaoId = org.id;
    }

    const novoItem = this.itemRepository.create(payload as Produto);
    return this.itemRepository.save(novoItem);
  }

  async atualizar(id: number, dados: any, file?: Express.Multer.File): Promise<Produto> {
    const item = await this.itemRepository.findOneBy({ id: id as any }) as any;
    if (!item) throw new NotFoundException('Produto não encontrado.');

    if (dados?.nome) item.nome = dados.nome;
    if (dados?.descricao !== undefined) item.descricao = dados.descricao;
    if (dados?.status) item.status = dados.status; 
    if (dados?.preco_pontos) item.preco_pontos = Number(dados.preco_pontos);
    if (dados?.estoque !== undefined) item.estoque = Number(dados.estoque);
    
    if (dados?.categoriaId) {
      item.categoriaId = Number(dados.categoriaId);
    } else if (dados?.categoriaId === '') {
      item.categoriaId = null;
    }

    if (file) {
      item.imagem_p = `/uploads/${file.filename}`;
      item.imagem_g = `/uploads/${file.filename}`;
    }

    return this.itemRepository.save(item);
  }

  async remover(id: number): Promise<void> {
    await this.itemRepository.delete(id);
  }

  async listarCategorias(slugLiga?: string): Promise<Categoria[]> {
    if (!slugLiga) {
      return this.categoriaRepository.find({ order: { nome: 'ASC' } });
    }

    const org = await this.categoriaRepository.manager.getRepository('Organizacao').findOne({
      where: { slug: slugLiga }
    }) as any;

    if (!org) return [];

    return this.categoriaRepository.find({
      where: { organizacaoId: org.id },
      order: { nome: 'ASC' }
    });
  }

  async criarCategoria(nome: string, slugLiga?: string): Promise<Categoria> {
    const novaCategoria = this.categoriaRepository.create({ nome }) as any;

    if (slugLiga) {
      const org = await this.categoriaRepository.manager.getRepository('Organizacao').findOne({
        where: { slug: slugLiga }
      }) as any;
      if (org) novaCategoria.organizacaoId = org.id;
    }

    return this.categoriaRepository.save(novaCategoria);
  }

  async editarCategoria(id: number, novoNome: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOneBy({ id: id as any });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');
    categoria.nome = novoNome;
    return this.categoriaRepository.save(categoria);
  }

  async removerCategoria(id: number): Promise<void> {
    await this.categoriaRepository.delete(id);
  }

  async solicitarTroca(usuarioId: number, produtoId: number) {
    const usuario = await this.usuarioRepository.findOneBy({ id: usuarioId as any });
    const produto = await this.itemRepository.findOneBy({ id: produtoId as any });

    if (!usuario || !produto) throw new NotFoundException('Dados inválidos.');
    if (produto.status === 'inativo') throw new BadRequestException('Produto indisponível.');
    if (produto.estoque <= 0) throw new BadRequestException('Produto esgotado.');

    const saldoAtual = Number(usuario.saldo_pontos || 0);
    if (saldoAtual < produto.preco_pontos) throw new BadRequestException('Saldo insuficiente.');

    await this.usuariosService.ajustarPontos(usuario.id, -produto.preco_pontos, `Resgate: ${produto.nome}`);

    const novaTroca = this.trocaRepository.create({
      usuario: { id: usuario.id } as any,
      produto: { id: produto.id } as any,
      pontos_utilizados: produto.preco_pontos,
      status: 'pendente'
    });

    return await this.trocaRepository.save(novaTroca);
  }

  // ALIAS / MAPPING: Redireciona a chamada para a função existente solicitarTroca
  async resgatarProduto(usuarioId: number, produtoId: number) {
    return this.solicitarTroca(usuarioId, produtoId);
  }

  async atualizarStatusTroca(id: number, novoStatus: string) {
    const troca = await this.trocaRepository.findOne({
      where: { id },
      relations: ['usuario', 'produto']
    });

    if (!troca) throw new NotFoundException('Troca não encontrada.');

    if (novoStatus === 'aprovado' && troca.status !== 'aprovado' && troca.status !== 'entregue') {
      if (troca.produto.estoque <= 0) throw new BadRequestException('Sem estoque.');
      troca.produto.estoque -= 1;
      await this.itemRepository.save(troca.produto);
    }

    if (novoStatus === 'cancelado' && troca.status !== 'cancelado') {
      await this.usuariosService.ajustarPontos(troca.usuario.id, troca.pontos_utilizados, `Estorno: ${troca.produto?.nome}`);
      if (troca.status === 'aprovado' || troca.status === 'entregue') {
        troca.produto.estoque += 1;
        await this.itemRepository.save(troca.produto);
      }
    }

    troca.status = novoStatus;
    return this.trocaRepository.save(troca);
  }

  async buscarTrocasDoUsuario(usuarioId: number) {
    return this.trocaRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ['produto'],
      order: { data_solicitacao: 'DESC' }
    });
  }

  async buscarTodasTrocas(slugLiga?: string) {
    const query = this.trocaRepository.createQueryBuilder('troca')
      .leftJoinAndSelect('troca.usuario', 'usuario')
      .leftJoinAndSelect('troca.produto', 'produto')
      .leftJoin('usuario.organizacao', 'orgUsuario')
      .leftJoin('produto.organizacao', 'orgProduto')
      .orderBy('troca.data_solicitacao', 'DESC');

    if (slugLiga) {
      // Filtra se a liga pertence ao associado OU se pertence à organização do produto
      query.where('(LOWER(orgUsuario.slug) = LOWER(:slugLiga) OR LOWER(orgProduto.slug) = LOWER(:slugLiga))', { 
        slugLiga: slugLiga.trim() 
      });
    }

    return await query.getMany();
  }
}
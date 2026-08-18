import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Usuario } from './usuario.entity';
import { HistoricoPontos } from './historico-pontos.entity';
import { Configuracao } from '../configuracoes/configuracao.entity';
import * as fs from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(HistoricoPontos)
    private readonly historicoRepo: Repository<HistoricoPontos>,

    @InjectRepository(Configuracao)
    private readonly configRepo: Repository<Configuracao>,
  ) {}

  async validarLoginAdmin(identificador: string, senha: string, slugLiga?: string) {
    const query = this.usuarioRepository.createQueryBuilder('user')
      .addSelect('user.senha')
      .leftJoinAndSelect('user.organizacao', 'org')
      .where('(user.email = :identificador OR user.login = :identificador) AND user.tipo IN (:...tipos)', {
        identificador,
        tipos: ['admin', 'superadmin']
      });

    if (slugLiga) {
      query.andWhere('org.slug = :slugLiga', { slugLiga });
    }

    const user = await query.getOne();

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas ou acesso negado.');
    }

    return {
      token: 'token-admin-liga-' + Math.random().toString(36).substring(2),
      user: { nome: user.nome, email: user.email }
    };
  }

  // BUSCA EXCLUSIVAMENTE SUPER ADMINS DO SISTEMA (SEM LIGA ASSOCIADA)
  async findAdmins(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: [
        { tipo: 'admin', organizacaoId: IsNull() },
        { tipo: 'superadmin', organizacaoId: IsNull() }
      ],
      order: { id: 'DESC' },
    });
  }

  async findAssociados(slugLiga?: string) {
    if (!slugLiga) {
      return this.usuarioRepository.find({ 
        where: { tipo: 'associado', organizacaoId: IsNull() },
        order: { id: 'DESC' }
      });
    }

    const org = await this.usuarioRepository.manager.getRepository('Organizacao').findOne({
      where: { slug: slugLiga }
    }) as any;

    if (!org) return [];

    return this.usuarioRepository.find({
      where: {
        tipo: 'associado',
        organizacaoId: org.id
      },
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id: id as any });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return usuario;
  }

  // MÉTODO DE CRIAÇÃO CORRIGIDO: Preserva o tipo vindo no payload (admin / associado)
  async create(dados: any, slugLiga?: string): Promise<Usuario> {
    let orgId: number | null = null;
    if (slugLiga) {
      const org = await this.usuarioRepository.manager.getRepository('Organizacao').findOne({
        where: { slug: slugLiga }
      }) as any;
      if (org) orgId = org.id;
    }

    const tipoUsuario = dados.tipo || 'associado';

    // 1. Validação de Login Duplicado considerando a liga ou Super Admin
    if (dados.login) {
      const loginExistente = await this.usuarioRepository.findOne({ 
        where: orgId ? { login: dados.login, organizacaoId: orgId } : { login: dados.login } 
      });
      if (loginExistente) throw new BadRequestException(`O login "${dados.login}" já está em uso.`);
    }

    // 2. Validação de E-mail Duplicado
    if (dados.email) {
      const emailExistente = await this.usuarioRepository.findOne({ 
        where: orgId ? { email: dados.email, organizacaoId: orgId } : { email: dados.email } 
      });
      if (emailExistente) throw new BadRequestException(`O e-mail "${dados.email}" já está cadastrado.`);
    }

    // 3. Criptografia de Senha
    if (dados.senha && dados.senha.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      dados.senha = await bcrypt.hash(dados.senha, salt);
    } else {
      const salt = await bcrypt.genSalt(10);
      dados.senha = await bcrypt.hash('123456', salt);
    }

    const novoUsuario = this.usuarioRepository.create({
      nome: dados.nome,
      email: dados.email,
      login: dados.login,
      senha: dados.senha,
      tipo: tipoUsuario,
      ativo: dados.ativo !== undefined ? dados.ativo : true,
      saldo_pontos: tipoUsuario === 'associado' ? (dados.saldo_pontos || 0) : 0,
      organizacaoId: orgId
    } as Usuario);

    return this.usuarioRepository.save(novoUsuario);
  }

  async update(id: number, dados: any): Promise<Usuario> {
    const usuario = await this.findOne(id);
    
    if (dados.senha && dados.senha.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      dados.senha = await bcrypt.hash(dados.senha, salt);
    } else {
      delete dados.senha;
    }

    Object.assign(usuario, dados);
    return this.usuarioRepository.save(usuario);
  }

  async validarLoginAssociado(identificador: string, senha: string, slugLiga?: string) {
    const query = this.usuarioRepository.createQueryBuilder('user')
      .addSelect('user.senha')
      .leftJoinAndSelect('user.organizacao', 'org')
      .where('(user.email = :identificador OR user.login = :identificador) AND user.tipo = :tipo', {
        identificador,
        tipo: 'associado'
      });

    if (slugLiga) {
      query.andWhere('org.slug = :slugLiga', { slugLiga });
    }

    const user = await query.getOne();

    if (!user) throw new UnauthorizedException('Associado não encontrado nesta Liga.');
    
    if (!user.ativo) {
      throw new UnauthorizedException('Sua conta está inativa. Entre em contato com a gestão da sua Liga.');
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) throw new UnauthorizedException('Senha incorreta.');

    return {
      token: 'token-associado-' + Math.random().toString(36).substring(2),
      user: { 
        id: user.id, 
        nome: user.nome, 
        email: user.email,
        saldo_pontos: user.saldo_pontos || 0,
        foto_url: user.foto_url 
      }
    };
  }

  async ajustarPontos(usuarioId: number, valor: number, motivo: string): Promise<Usuario> {
    const usuario = await this.findOne(usuarioId);
    try {
      const novoLog = this.historicoRepo.create({
        valor: Number(valor),
        motivo: motivo,
        usuario: { id: usuario.id } as any
      });
      await this.historicoRepo.save(novoLog);

      const saldoAtual = Number(usuario.saldo_pontos || 0);
      usuario.saldo_pontos = saldoAtual + Number(valor);

      return await this.usuarioRepository.save(usuario);
    } catch (error) {
      throw new BadRequestException("Não foi possível processar o ajuste de pontos.");
    }
  }

  async processarHistorico(usuarioId: number) {
    return this.historicoRepo.find({
      where: { usuario: { id: usuarioId } },
      order: { data: 'DESC' },
      take: 5 
    });
  }

  async consultarHistoricoCompleto(usuarioId: number) {
    return this.historicoRepo.find({
      where: { usuario: { id: usuarioId } },
      order: { data: 'DESC' },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
    return { message: `Usuário removido.` };
  }

  async atualizarPerfilComFoto(id: number, dados: any, file?: Express.Multer.File) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['organizacao']
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const slugLiga = usuario.organizacao?.slug;
    const config = await this.configRepo.findOne({
      where: { organizacao: { slug: slugLiga } }
    }) || { pontos_perfil: 50, pontos_endereco: 100 } as any;

    const aba = Number(dados.aba);
    let pontosGanhos = 0;

    if (aba === 1) {
      if (dados.nome) usuario.nome = dados.nome;
      if (dados.genero) usuario.genero = dados.genero;
      if (dados.data_nascimento) usuario.data_nascimento = dados.data_nascimento;

      if (file) {
        usuario.foto_url = `/uploads/${file.filename}`;
      }

      const dadosPessoaisPreenchidos = usuario.nome && usuario.genero && usuario.data_nascimento;
      if (dadosPessoaisPreenchidos && !usuario.perfil_completo) {
        usuario.perfil_completo = true;
        pontosGanhos += Number(config.pontos_perfil || 50);
      }
    }

    if (aba === 2) {
      if (dados.cep) usuario.cep = dados.cep;
      if (dados.logradouro) usuario.logradouro = dados.logradouro;
      if (dados.numero) usuario.numero = dados.numero;
      if (dados.complemento) usuario.complemento = dados.complemento;
      if (dados.bairro) usuario.bairro = dados.bairro;
      if (dados.cidade) usuario.cidade = dados.cidade;
      if (dados.estado) usuario.estado = dados.estado;

      const enderecoPreenchido = usuario.cep && usuario.logradouro && usuario.bairro && usuario.cidade;
      if (enderecoPreenchido && !usuario.endereco_completo) {
        usuario.endereco_completo = true;
        pontosGanhos += Number(config.pontos_endereco || 100);
      }
    }

    if (pontosGanhos > 0) {
      usuario.saldo_pontos = Number(usuario.saldo_pontos || 0) + pontosGanhos;

      const historico = this.historicoRepo.create({
        usuario: { id: usuario.id } as any,
        valor: pontosGanhos,
        motivo: aba === 1 ? 'Bônus: Perfil Completo' : 'Bônus: Endereço Cadastrado'
      });
      await this.historicoRepo.save(historico);
    }

    return await this.usuarioRepository.save(usuario);
  }
}
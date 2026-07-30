import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organizacao } from './organizacao.entity';
import { Usuario } from '../usuarios/usuario.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OrganizacoesService {
  constructor(
    @InjectRepository(Organizacao)
    private repo: Repository<Organizacao>,
    
    @InjectRepository(Usuario)
    private userRepo: Repository<Usuario>,
  ) {}

  findAll() {
    return this.repo.find({ 
      relations: ['plano', 'usuarios'],
      order: { nomeLiga: 'ASC' } 
    });
  }

  async findOne(id: number) {
    const org = await this.repo.findOne({ 
      where: { id }, 
      relations: ['plano'] 
    });
    if (!org) throw new NotFoundException('Entidade não encontrada');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.repo.findOne({ 
      where: { slug }, 
      relations: ['plano'] 
    });
    if (!org) throw new NotFoundException('Liga não encontrada');
    return org;
  }

  async create(dados: any) {
    if (dados.planoId) dados.planoId = Number(dados.planoId);
    
    const { nomeAdmin, emailAdmin, senhaAdmin, ...dadosLiga } = dados;

    const nova = this.repo.create(dadosLiga);
    const ligaSalva = await this.repo.save(nova) as any;

    if (nomeAdmin && emailAdmin) {
      const senhaCriptografada = await bcrypt.hash(senhaAdmin || '123', 10);
      
      const novoAdmin = this.userRepo.create({
        nome: nomeAdmin,
        email: emailAdmin,
        login: emailAdmin,
        senha: senhaCriptografada,
        tipo: 'admin',
        ativo: true,
        organizacaoId: ligaSalva.id
      });
      await this.userRepo.save(novoAdmin);
    }

    return this.findOne(ligaSalva.id);
  }

  async update(id: number, dados: any) {
    const logExistente = await this.repo.findOneBy({ id });
    if (!logExistente) throw new NotFoundException('Liga não encontrada');

    const { id: _, nomeAdmin, emailAdmin, senhaAdmin, ...updateData } = dados;

    if (updateData.planoId) {
      updateData.planoId = Number(updateData.planoId);
    } else {
      updateData.planoId = null;
    }
    
    if (updateData.status) {
      updateData.status = String(updateData.status).toLowerCase().trim();
    }

    const entidadeMesclada = this.repo.merge(logExistente, updateData);
    await this.repo.save(entidadeMesclada);

    // Gerenciamento do Usuário Gestor
    if (nomeAdmin && emailAdmin) {
      let usuarioAdmin = await this.userRepo.findOneBy({ 
        organizacaoId: id, 
        tipo: 'admin' 
      });

      if (usuarioAdmin) {
        if (nomeAdmin !== 'Sem gestor vinculado') usuarioAdmin.nome = nomeAdmin;
        if (emailAdmin !== 'vazio@liga.com') {
          usuarioAdmin.email = emailAdmin;
          usuarioAdmin.login = emailAdmin;
        }
        if (senhaAdmin && senhaAdmin.trim() !== '') {
          usuarioAdmin.senha = await bcrypt.hash(senhaAdmin, 10);
        }
        await this.userRepo.save(usuarioAdmin);
      } else {
        const senhaCriptografada = await bcrypt.hash(senhaAdmin || '123', 10);
        const novoAdmin = this.userRepo.create({
          nome: nomeAdmin,
          email: emailAdmin,
          login: emailAdmin,
          senha: senhaCriptografada,
          tipo: 'admin',
          ativo: true,
          organizacaoId: id
        });
        await this.userRepo.save(novoAdmin);
      }
    }

    return this.findOne(id);
  }

  async delete(id: number) {
    const org = await this.findOne(id);
    return this.repo.remove(org);
  }
}
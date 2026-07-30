import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plano } from './plano.entity';

@Injectable()
export class PlanosService {
  constructor(
    @InjectRepository(Plano)
    private planoRepository: Repository<Plano>,
  ) {}

  findAll() {
    return this.planoRepository.find();
  }

  create(dados: Partial<Plano>) {
    const novoPlano = this.planoRepository.create(dados);
    return this.planoRepository.save(novoPlano);
  }

  async update(id: number, dados: Partial<Plano>) {
    await this.planoRepository.update(id, dados);
    return this.planoRepository.findOneBy({ id });
  }

  delete(id: number) {
    return this.planoRepository.delete(id);
  }
}
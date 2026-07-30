import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Organizacao } from '../organizacoes/organizacao.entity';

@Entity('planos')
export class Plano {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string; // Ex: Bronze, Prata, Ouro

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column()
  limiteAssociados: number; // Quantidade de associados permitidos

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precoMensal: number;

  // Uma organização pertence a um plano
  @OneToMany(() => Organizacao, (organizacao) => organizacao.plano)
  organizacoes: Organizacao[];
}
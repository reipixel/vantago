import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Atividade } from '../atividades/atividade.entity';
import { Plano } from '../planos/plano.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('organizacoes')
export class Organizacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomeLiga: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: 'ativa' })
  status: string;

  @Column({ type: 'longtext', nullable: true })
  logoUrl: string;

  // GARANTE O ARMAZENAMENTO DO ID DO PLANO
  @Column({ nullable: true })
  planoId: number;

  @ManyToOne(() => Plano, (plano) => plano.organizacoes)
  @JoinColumn({ name: 'planoId' })
  plano: Plano;

  @OneToMany(() => Atividade, (atividade) => atividade.organizacao)
  atividades: Atividade[];

  @OneToMany(() => Usuario, (usuario) => usuario.organizacao)
  usuarios: Usuario[];
}
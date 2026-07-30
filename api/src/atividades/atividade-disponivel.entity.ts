import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('atividades_disponiveis')
export class AtividadeDisponivel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column('text')
  descricao: string;

  @Column()
  pontos: number;

  @Column()
  icone: string; // Ex: fa-users, fa-book, fa-handshake

  @Column({ default: true })
  ativa: boolean;
}
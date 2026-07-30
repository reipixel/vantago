import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('historico_pontos')
export class HistoricoPontos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  valor: number;

  @Column()
  motivo: string;

  @CreateDateColumn()
  data: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;
}
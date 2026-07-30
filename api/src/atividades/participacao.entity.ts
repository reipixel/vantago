import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Atividade } from './atividade.entity';

@Entity('participacoes')
export class Participacao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @ManyToOne(() => Atividade)
  atividade: Atividade;

  @CreateDateColumn()
  dataRegistro: Date;
}
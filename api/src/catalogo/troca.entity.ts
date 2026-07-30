import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Produto } from './produto.entity';

@Entity('trocas')
export class Troca {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'pendente' }) 
  // Status possíveis: pendente, aprovado, entregue, cancelado
  status: string;

  @Column()
  pontos_utilizados: number;

  @CreateDateColumn()
  data_solicitacao: Date;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @ManyToOne(() => Produto)
  produto: Produto;
}
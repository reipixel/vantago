import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Produto } from './produto.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos: Produto[];

  // --- ADICIONE ESTE BLOCO MULTI-TENANT ---
  @Column({ nullable: true })
  organizacaoId: number;

  @ManyToOne('Organizacao', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizacaoId' })
  organizacao: any;
  // ----------------------------------------
}
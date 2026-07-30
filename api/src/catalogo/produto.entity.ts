import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Categoria } from './categoria.entity';
import { Troca } from './troca.entity';

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column()
  preco_pontos: number;

  @Column({ default: 0 })
  estoque: number;

  @Column({ nullable: true })
  imagem_p: string;

  @Column({ nullable: true })
  imagem_g: string;

  @Column({ default: 'ativo' })
  status: string;

  @ManyToOne(() => Categoria, (categoria) => categoria.produtos, { onDelete: 'SET NULL', nullable: true })
  categoria: Categoria;

  @Column({ nullable: true })
  categoriaId: number;

  // --- ADICIONE ESTE BLOCO MULTI-TENANT ---
  @Column({ nullable: true })
  organizacaoId: number;

  @ManyToOne('Organizacao', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizacaoId' })
  organizacao: any;
  // ----------------------------------------

  @OneToMany(() => Troca, (troca) => troca.produto)
  trocas: Troca[];
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Organizacao } from '../organizacoes/organizacao.entity';

@Entity('configuracoes')
export class Configuracao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nome_entidade: string;

  @Column({ nullable: true })
  nome_liga: string;

  @Column({ nullable: true })
  email_suporte: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ default: 50 })
  pontos_perfil: number;

  @Column({ default: 100 })
  pontos_endereco: number;

  @Column({ nullable: true })
  troca_principal_id: string;

  @Column({ nullable: true })
  sugestao_1_id: string;

  @Column({ nullable: true })
  sugestao_2_id: string;

  @Column({ nullable: true })
  sugestao_3_id: string;

  // --- COLUNAS MULTI-TENANT OBRIGATÓRIAS ---
  @Column({ nullable: true })
  organizacaoId: number;

  @ManyToOne(() => Organizacao, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizacaoId' })
  organizacao: Organizacao;
}
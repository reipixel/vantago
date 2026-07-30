import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organizacao } from '../organizacoes/organizacao.entity';

@Entity('atividades')
export class Atividade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column()
  pontos: number;

  @Column({ type: 'datetime', nullable: true })
  dataHora: Date;

  @Column()
  local: string;

  @Column({ nullable: true })
  limiteParticipantes: number;

  @Column({ default: 'ativa' })
  status: string;

  @CreateDateColumn() 
  criadoEm: Date;

  @Column({ nullable: true })
  imagem_p: string;

  @Column({ default: false })
  exibirBotaoAcao: boolean;

  @Column({ nullable: true })
  textoBotao: string;

  @Column({ nullable: true })
  linkBotao: string;

  // --- RELAÇÃO MULTI-TENANT ---
  // Muitas atividades pertencem a uma Organização
  @ManyToOne(() => Organizacao, (organizacao) => organizacao.atividades)
  organizacao: Organizacao;

  @Column({ nullable: true })
  organizacaoId: number;
}
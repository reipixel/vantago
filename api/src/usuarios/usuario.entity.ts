import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organizacao } from '../organizacoes/organizacao.entity';

@Entity('usuarios') 
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['admin', 'associado'],
    default: 'associado'
  })
  tipo: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  login: string;

  // CORREÇÃO DE SEGURANÇA: select: false impede que a senha vaze em consultas padrão da API
  @Column({ nullable: true, select: false })
  senha: string;

  @Column({ nullable: true })
  perfil: string;

  @Column({ type: 'int', default: 0 })
  saldo_pontos: number;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  foto_url: string;

  @Column({ nullable: true })
  genero: string;

  @Column({ nullable: true })
  data_nascimento: string;

  @Column({ nullable: true })
  cep: string;

  @Column({ nullable: true })
  logradouro: string;

  @Column({ nullable: true })
  numero: string;

  @Column({ nullable: true })
  complemento: string;

  @Column({ nullable: true })
  bairro: string;

  @Column({ nullable: true })
  cidade: string;

  @Column({ nullable: true })
  estado: string;

  @Column({ default: false })
  perfil_completo: boolean;

  @Column({ default: false })
  endereco_completo: boolean;

  @CreateDateColumn() 
  data_criacao: Date;

  // --- COMPATIBILIDADE SAAS / MULTI-TENANT ---
  @ManyToOne(() => Organizacao, (organizacao) => organizacao.usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizacaoId' })
  organizacao: Organizacao;

  @Column({ nullable: true })
  organizacaoId: number;
}
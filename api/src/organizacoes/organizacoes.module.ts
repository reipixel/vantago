import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organizacao } from './organizacao.entity';
import { OrganizacoesService } from './organizacoes.service';
import { OrganizacoesController } from './organizacoes.controller';
import { Usuario } from '../usuarios/usuario.entity'; // <-- Adicionado o import do Usuario

@Module({
  // Adicionado o Usuario no forFeature para que o OrganizacoesService possa usar seu Repository
  imports: [TypeOrmModule.forFeature([Organizacao, Usuario])],
  controllers: [OrganizacoesController],
  providers: [OrganizacoesService],
  exports: [OrganizacoesService],
})
export class OrganizacoesModule {}
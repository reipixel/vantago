import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { HistoricoPontos } from './historico-pontos.entity';
import { Configuracao } from '../configuracoes/configuracao.entity'; 
@Module({
  imports: [
    // Agora o TypeORM reconhece a entidade Configuracao para injetar no UsuariosService
    TypeOrmModule.forFeature([Usuario, HistoricoPontos, Configuracao])
  ],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService]
})
export class UsuariosModule {}
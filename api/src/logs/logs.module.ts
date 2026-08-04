import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { Usuario } from '../usuarios/usuario.entity';
import { HistoricoPontos } from '../usuarios/historico-pontos.entity';
import { Troca } from '../catalogo/troca.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, HistoricoPontos, Troca]),
  ],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
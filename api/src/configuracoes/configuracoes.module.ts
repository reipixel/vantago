import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracao } from './configuracao.entity';
import { ConfiguracoesService } from './configuracoes.service';
import { ConfiguracoesController } from './configuracoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracao])],
  providers: [ConfiguracoesService],
  controllers: [ConfiguracoesController],
  exports: [ConfiguracoesService] // Exportamos caso outros módulos precisem dos dados da liga
})
export class ConfiguracoesModule {}
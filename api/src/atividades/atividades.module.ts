import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtividadesService } from './atividades.service';
import { AtividadesController } from './atividades.controller';
import { Atividade } from './atividade.entity';
import { UsuariosModule } from '../usuarios/usuarios.module'; // Importamos o módulo inteiro

@Module({
  imports: [
    // Registramos a entidade Atividade para este módulo
    TypeOrmModule.forFeature([Atividade]),
    
    // Importamos o UsuariosModule para ter acesso ao UsuariosService
    // e consequentemente à lógica de histórico e saldo.
    UsuariosModule, 
  ],
  providers: [AtividadesService],
  controllers: [AtividadesController],
})
export class AtividadesModule {}
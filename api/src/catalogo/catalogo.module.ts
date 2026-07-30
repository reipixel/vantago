import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoService } from './catalogo.service';
import { CatalogoController } from './catalogo.controller';
import { Produto } from './produto.entity';
import { Categoria } from './categoria.entity';
import { Troca } from './troca.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosModule } from '../usuarios/usuarios.module'; // <-- Adicione este import

@Module({
  imports: [
    // Registra as entidades que o TypeORM usará neste módulo
    TypeOrmModule.forFeature([Produto, Categoria, Troca, Usuario]),
    // Importa o módulo de usuários para ter acesso ao UsuariosService (extrato/pontos)
    UsuariosModule,
  ],
  providers: [CatalogoService],
  controllers: [CatalogoController],
})
export class CatalogoModule {}
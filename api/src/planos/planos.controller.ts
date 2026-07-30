import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlanosService } from './planos.service';

@Controller('planos')
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Get()
  findAll() {
    return this.planosService.findAll();
  }

  @Post()
  create(@Body() dados: any) {
    return this.planosService.create(dados);
  }

  // ADICIONE ESTA ROTA PARA CORRIGIR O ERRO 404
  @Patch(':id')
  update(@Param('id') id: string, @Body() dados: any) {
    return this.planosService.update(+id, dados);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planosService.delete(+id);
  }
}
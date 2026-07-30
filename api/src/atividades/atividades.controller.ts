import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Patch, 
  UseInterceptors, 
  UploadedFile,
  Query,
  Headers
} from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('atividades')
export class AtividadesController {
  constructor(private readonly atividadesService: AtividadesService) {}

  @Get()
  listarTodas(
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    // Intercepta o slug vindo da URL ou do Header do Next.js
    const slugLiga = slugHeader || slugQuery;
    return this.atividadesService.findAll(slugLiga);
  }

  @Post('registrar')
  registrar(@Body() dados: { usuariosIds: number[], atividadeId: number }) {
    return this.atividadesService.registrarParticipacaoMultipla(
      dados.usuariosIds, 
      dados.atividadeId
    );
  }

  @Get(':id')
  buscarUma(@Param('id') id: string) {
    return this.atividadesService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  criar(
    @Body() dados: any, 
    @UploadedFile() file: Express.Multer.File,
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    if (file) {
      dados.imagem_p = `/uploads/${file.filename}`;
    }
    
    const slugLiga = slugHeader || slugQuery;
    return this.atividadesService.criar(dados, slugLiga);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  atualizar(@Param('id') id: string, @Body() dados: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      dados.imagem_p = `/uploads/${file.filename}`;
    }
    return this.atividadesService.atualizar(+id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.atividadesService.remover(+id);
  }
}
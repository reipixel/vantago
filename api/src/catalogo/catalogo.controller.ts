import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogoService } from './catalogo.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('produtos')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  listarTodos(
    @Query('ativos') ativos?: string,
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    const apenasAtivos = ativos === 'true';
    console.log(`[Filtro Produtos] Ativos: ${apenasAtivos} | Liga: ${slugLiga}`);
    return this.catalogoService.findAll(apenasAtivos, slugLiga);
  }

  @Get('categorias')
  listarCategorias(
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.catalogoService.listarCategorias(slugLiga);
  }

  @Post('categorias')
  criarCategoria(
    @Body() dados: { nome: string }, 
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.catalogoService.criarCategoria(dados.nome, slugLiga);
  }

  // --- ROTAS DE PEDIDOS/TROCAS (Declaradas antes de :id) ---

  // Atende tanto /produtos/pedidos quanto /produtos/admin/pedidos
  @Get(['pedidos', 'admin/pedidos'])
  buscarTodasTrocas(
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.catalogoService.buscarTodasTrocas(slugLiga);
  }

  // Busca as trocas/pedidos específicos do associado
  @Get('pedidos/:usuarioId')
  buscarTrocasDoUsuario(@Param('usuarioId') usuarioId: number) {
    return this.catalogoService.buscarTrocasDoUsuario(Number(usuarioId));
  }

  // Atende tanto /produtos/pedidos/:id/status quanto /produtos/admin/pedidos/:id/status
  @Patch(['pedidos/:id/status', 'admin/pedidos/:id/status'])
  atualizarStatusTroca(
    @Param('id') id: number,
    @Body() body: { status: string }
  ) {
    return this.catalogoService.atualizarStatusTroca(Number(id), body.status);
  }

  @Post('resgatar')
  async resgatarProduto(@Body() body: any) {
    const usuarioId = Number(body.usuarioId || body.associadoId);
    const produtoId = Number(body.produtoId);

    if (isNaN(usuarioId) || isNaN(produtoId)) {
      throw new BadRequestException('ID do usuário e do produto são obrigatórios.');
    }

    return this.catalogoService.resgatarProduto(usuarioId, produtoId);
  }

  // --- ROTAS DINÂMICAS DE PRODUTO ---

  @Get(':id')
  buscarPorId(@Param('id') id: number) {
    return this.catalogoService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  criarNovoItem(
    @Body() dados: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.catalogoService.criar(dados, file, slugLiga);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  atualizarItem(
    @Param('id') id: number,
    @Body() dados: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.catalogoService.atualizar(id, dados, file);
  }

  @Delete(':id')
  removerItem(@Param('id') id: number) {
    return this.catalogoService.remover(id);
  }

  @Patch('categorias/:id')
  editarCategoria(@Param('id') id: number, @Body() dados: { nome: string }) {
    return this.catalogoService.editarCategoria(id, dados.nome);
  }

  @Delete('categorias/:id')
  removerCategoria(@Param('id') id: number) {
    return this.catalogoService.removerCategoria(id);
  }
}
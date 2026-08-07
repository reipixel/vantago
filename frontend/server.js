const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000

const app = next({ dev, dir: __dirname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname } = parsedUrl

    // Servidor mapeia explicitamente os arquivos de estilo e scripts de .next/static
    if (pathname.startsWith('/_next/static/')) {
      const filePath = path.join(__dirname, '.next', 'static', pathname.replace('/_next/static/', ''))
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath)
        let contentType = 'text/plain'
        if (ext === '.css') contentType = 'text/css'
        if (ext === '.js') contentType = 'application/javascript'
        
        res.setHeader('Content-Type', contentType)
        return fs.createReadStream(filePath).pipe(res)
      }
    }

    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Servidor ativo na porta ${port}`)
  })
})
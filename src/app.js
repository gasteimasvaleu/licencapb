const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');

const { abrirBanco, transacao } = require('./db');
const { SERVICOS, STATUS, STATUS_FINAIS } = require('./catalogo');
const auth = require('./auth');
const views = require('./views');

const EXTENSOES_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.dwg', '.dxf', '.zip', '.kml', '.kmz']);
const TAMANHO_MAXIMO = 25 * 1024 * 1024;

function criarApp({ arquivoBanco, pastaUploads, cookieSeguro = false, operadorInicial } = {}) {
  const db = abrirBanco(arquivoBanco);
  fs.mkdirSync(pastaUploads, { recursive: true });

  if (operadorInicial) garantirOperador(db, operadorInicial);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'self'",
    });
    next();
  });
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(auth.carregarUsuario(db));
  app.use(auth.conferirCsrf);

  const ctx = (req, extra = {}) => ({ usuario: req.usuario, csrf: auth.tokenCsrf(req), ...extra });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const pasta = path.join(pastaUploads, String(req.params.id));
        fs.mkdir(pasta, { recursive: true }, (e) => cb(e, pasta));
      },
      filename: (req, file, cb) =>
        cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: TAMANHO_MAXIMO, files: 1 },
    fileFilter: (req, file, cb) =>
      cb(null, EXTENSOES_PERMITIDAS.has(path.extname(file.originalname).toLowerCase())),
  });

  // ---------- Consultas ----------

  const LISTA_PEDIDOS = `
    SELECT p.*, u.nome AS cliente_nome,
      (SELECT COUNT(*) FROM documentos d WHERE d.pedido_id = p.id AND d.origem != 'emitido') AS docs_total,
      (SELECT COUNT(*) FROM documentos d WHERE d.pedido_id = p.id AND d.origem != 'emitido'
         AND d.situacao = 'aprovado') AS docs_ok
    FROM pedidos p JOIN usuarios u ON u.id = p.cliente_id`;

  function registrarEvento(pedidoId, autorId, tipo, texto) {
    db.prepare('INSERT INTO eventos (pedido_id, autor_id, tipo, texto) VALUES (?, ?, ?, ?)')
      .run(pedidoId, autorId, tipo, texto);
    db.prepare("UPDATE pedidos SET atualizado_em = datetime('now') WHERE id = ?").run(pedidoId);
  }

  // Carrega o pedido de :id e garante que o usuário pode vê-lo.
  function carregarPedido(req, res, next) {
    const p = db.prepare(`
      SELECT p.*, u.nome AS cliente_nome, u.email AS cliente_email, u.telefone AS cliente_telefone
      FROM pedidos p JOIN usuarios u ON u.id = p.cliente_id WHERE p.id = ?`).get(Number(req.params.id));
    if (!p || (req.usuario.papel !== 'operador' && p.cliente_id !== req.usuario.id)) {
      return res.status(404).send(views.erro(ctx(req), 404, 'Pedido não encontrado.'));
    }
    req.pedido = p;
    next();
  }

  function carregarDocumento(req, res, next) {
    const d = db.prepare('SELECT * FROM documentos WHERE id = ? AND pedido_id = ?')
      .get(Number(req.params.docId), req.pedido.id);
    if (!d) return res.status(404).send(views.erro(ctx(req), 404, 'Documento não encontrado.'));
    req.documento = d;
    next();
  }

  // ---------- Páginas públicas ----------

  app.get('/', (req, res) => res.send(views.inicio(ctx(req))));
  app.get('/servicos', (req, res) => res.send(views.servicos(ctx(req))));

  app.get('/cadastro', (req, res) => res.send(views.cadastro(ctx(req))));
  app.post('/cadastro', (req, res) => {
    const b = req.body;
    const email = String(b.email || '').trim().toLowerCase();
    const nome = String(b.nome || '').trim();
    const senha = String(b.senha || '');
    const falha = (msg) => res.status(400).send(views.cadastro(ctx(req, { aviso: msg }), b));
    if (!nome || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return falha('Informe nome e e-mail válidos.');
    if (senha.length < 8) return falha('A senha precisa ter pelo menos 8 caracteres.');
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) return falha('Este e-mail já está cadastrado.');
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, papel, profissao, registro_profissional, telefone)
      VALUES (?, ?, ?, 'cliente', ?, ?, ?)`).run(
      nome, email, auth.hashSenha(senha), String(b.profissao || ''),
      String(b.registro_profissional || '').trim(), String(b.telefone || '').trim());
    auth.criarSessao(db, res, Number(lastInsertRowid), cookieSeguro);
    res.redirect('/painel');
  });

  app.get('/entrar', (req, res) => res.send(views.entrar(ctx(req), req.query.voltar)));
  app.post('/entrar', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const u = db.prepare('SELECT id, senha_hash FROM usuarios WHERE email = ?').get(email);
    if (!u || !auth.conferirSenha(String(req.body.senha || ''), u.senha_hash)) {
      return res.status(401).send(views.entrar(ctx(req, { aviso: 'E-mail ou senha incorretos.' }), req.body.voltar));
    }
    auth.criarSessao(db, res, u.id, cookieSeguro);
    const voltar = String(req.body.voltar || '');
    // Só redireciona para caminhos internos, evitando open redirect.
    res.redirect(/^\/(?!\/)/.test(voltar) ? voltar : '/painel');
  });

  app.post('/sair', (req, res) => {
    auth.encerrarSessao(db, req, res);
    res.redirect('/');
  });

  // ---------- Área logada ----------

  app.get('/painel', auth.exigirLogin, (req, res) => {
    if (req.usuario.papel === 'operador') return res.redirect('/equipe');
    const pedidos = db.prepare(`${LISTA_PEDIDOS} WHERE p.cliente_id = ? ORDER BY p.atualizado_em DESC`)
      .all(req.usuario.id);
    res.send(views.painel(ctx(req), pedidos));
  });

  app.get('/equipe', auth.exigirOperador, (req, res) => {
    const filtro = String(req.query.status || 'ativos');
    let pedidos;
    if (filtro === 'todos') {
      pedidos = db.prepare(`${LISTA_PEDIDOS} ORDER BY p.atualizado_em DESC`).all();
    } else if (STATUS[filtro]) {
      pedidos = db.prepare(`${LISTA_PEDIDOS} WHERE p.status = ? ORDER BY p.atualizado_em DESC`).all(filtro);
    } else {
      const finais = [...STATUS_FINAIS].map((s) => `'${s}'`).join(',');
      pedidos = db.prepare(`${LISTA_PEDIDOS} WHERE p.status NOT IN (${finais}) ORDER BY p.atualizado_em ASC`).all();
    }
    res.send(views.equipe(ctx(req), pedidos, filtro));
  });

  app.get('/pedidos/novo', auth.exigirLogin, (req, res) => {
    if (req.usuario.papel !== 'cliente') return res.redirect('/equipe');
    res.send(views.novoPedido(ctx(req), req.query.servico));
  });

  app.post('/pedidos', auth.exigirLogin, (req, res) => {
    if (req.usuario.papel !== 'cliente') return res.status(403).send('Apenas clientes abrem pedidos.');
    const b = req.body;
    const servico = SERVICOS.get(b.servico);
    const texto = (k) => String(b[k] || '').trim();
    const obrigatorios = ['titulo_obra', 'municipio', 'endereco', 'proprietario', 'proprietario_doc'];
    if (!servico || obrigatorios.some((k) => !texto(k))) {
      return res.status(400).send(views.novoPedido(
        ctx(req, { aviso: 'Preencha todos os campos obrigatórios.' }), b.servico, b));
    }
    const doc = texto('proprietario_doc').replace(/\D/g, '');
    if (doc.length !== 11 && doc.length !== 14) {
      return res.status(400).send(views.novoPedido(ctx(req, { aviso: 'CPF ou CNPJ inválido.' }), b.servico, b));
    }
    const area = Number(b.area_m2);
    const id = transacao(db, () => {
      const { lastInsertRowid } = db.prepare(`
        INSERT INTO pedidos (cliente_id, servico_codigo, titulo_obra, municipio, endereco,
          proprietario, proprietario_doc, area_m2, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        req.usuario.id, servico.codigo, texto('titulo_obra'), texto('municipio'), texto('endereco'),
        texto('proprietario'), texto('proprietario_doc'), area > 0 ? area : null, texto('observacoes') || null);
      const pedidoId = Number(lastInsertRowid);
      const inserirDoc = db.prepare('INSERT INTO documentos (pedido_id, item) VALUES (?, ?)');
      for (const item of servico.documentos) inserirDoc.run(pedidoId, item);
      db.prepare("INSERT INTO documentos (pedido_id, item, origem) VALUES (?, ?, 'emitido')")
        .run(pedidoId, `${servico.nome} — documento emitido (${servico.orgao})`);
      registrarEvento(pedidoId, req.usuario.id, 'sistema', `Pedido aberto: ${servico.orgao} — ${servico.nome}.`);
      return pedidoId;
    });
    res.redirect(`/pedidos/${id}`);
  });

  app.get('/pedidos/:id', auth.exigirLogin, carregarPedido, (req, res) => {
    const documentos = db.prepare('SELECT * FROM documentos WHERE pedido_id = ? ORDER BY origem, id').all(req.pedido.id);
    const eventos = db.prepare(`
      SELECT e.*, u.nome AS autor_nome FROM eventos e LEFT JOIN usuarios u ON u.id = e.autor_id
      WHERE e.pedido_id = ? ORDER BY e.id DESC`).all(req.pedido.id);
    res.send(views.pedido(ctx(req), req.pedido, documentos, eventos));
  });

  app.post('/pedidos/:id/mensagens', auth.exigirLogin, carregarPedido, (req, res) => {
    const texto = String(req.body.texto || '').trim().slice(0, 4000);
    if (texto) registrarEvento(req.pedido.id, req.usuario.id, 'mensagem', texto);
    res.redirect(`/pedidos/${req.pedido.id}`);
  });

  app.post('/pedidos/:id/status', auth.exigirOperador, carregarPedido, (req, res) => {
    const p = req.pedido;
    const novo = String(req.body.status || '');
    if (!STATUS[novo]) return res.status(400).send('Status inválido.');
    const protocolo = String(req.body.protocolo_orgao || '').trim() || null;
    const previsao = /^\d{4}-\d{2}-\d{2}$/.test(req.body.previsao || '') ? req.body.previsao : null;
    const comentario = String(req.body.texto || '').trim();
    transacao(db, () => {
      db.prepare('UPDATE pedidos SET status = ?, protocolo_orgao = ?, previsao = ?, responsavel_id = ? WHERE id = ?')
        .run(novo, protocolo, previsao, req.usuario.id, p.id);
      if (novo !== p.status) {
        registrarEvento(p.id, req.usuario.id, 'status', `Status alterado para "${STATUS[novo].rotulo}".`);
      }
      if (protocolo && protocolo !== p.protocolo_orgao) {
        registrarEvento(p.id, req.usuario.id, 'status', `Protocolo no órgão: ${protocolo}.`);
      }
      if (comentario) registrarEvento(p.id, req.usuario.id, 'mensagem', comentario);
    });
    res.redirect(`/pedidos/${p.id}`);
  });

  app.post('/pedidos/:id/documentos', auth.exigirOperador, carregarPedido, (req, res) => {
    const item = String(req.body.item || '').trim().slice(0, 300);
    if (item) {
      const origem = req.body.emitido ? 'emitido' : 'extra';
      db.prepare('INSERT INTO documentos (pedido_id, item, origem) VALUES (?, ?, ?)').run(req.pedido.id, item, origem);
      registrarEvento(req.pedido.id, req.usuario.id, 'documento',
        origem === 'extra' ? `Documento adicional solicitado: ${item}.` : `Item de entrega adicionado: ${item}.`);
    }
    res.redirect(`/pedidos/${req.pedido.id}`);
  });

  app.post('/pedidos/:id/documentos/:docId/arquivo', auth.exigirLogin, carregarPedido, carregarDocumento,
    (req, res, next) => {
      // Cliente envia itens do checklist; a equipe anexa os documentos emitidos.
      const d = req.documento;
      const operador = req.usuario.papel === 'operador';
      const permitido = operador ? d.origem === 'emitido' : d.origem !== 'emitido' && d.situacao !== 'aprovado';
      if (!permitido) return res.status(403).send('Você não pode enviar arquivo para este item.');
      next();
    },
    (req, res, next) => upload.single('arquivo')(req, res, (e) => {
      if (e) return res.status(400).send(views.erro(ctx(req), 400,
        e.code === 'LIMIT_FILE_SIZE' ? 'Arquivo maior que 25 MB.' : 'Falha no envio do arquivo.'));
      next();
    }),
    (req, res) => {
      const d = req.documento;
      if (!req.file) {
        return res.status(400).send(views.erro(ctx(req), 400,
          `Tipo de arquivo não aceito. Use: ${[...EXTENSOES_PERMITIDAS].join(', ')}.`));
      }
      const anterior = d.arquivo_caminho;
      const nomeOriginal = path.basename(req.file.originalname).slice(0, 200);
      const situacao = d.origem === 'emitido' ? 'aprovado' : 'enviado';
      db.prepare(`UPDATE documentos SET arquivo_nome = ?, arquivo_caminho = ?, situacao = ?, nota = NULL,
        atualizado_em = datetime('now') WHERE id = ?`)
        .run(nomeOriginal, path.relative(pastaUploads, req.file.path), situacao, d.id);
      registrarEvento(req.pedido.id, req.usuario.id, 'documento',
        d.origem === 'emitido' ? `Documento emitido disponível: ${d.item}.` : `Arquivo enviado para "${d.item}".`);
      if (anterior) fs.rm(path.join(pastaUploads, anterior), { force: true }, () => {});
      res.redirect(`/pedidos/${req.pedido.id}`);
    });

  app.get('/pedidos/:id/documentos/:docId/arquivo', auth.exigirLogin, carregarPedido, carregarDocumento, (req, res) => {
    const d = req.documento;
    if (!d.arquivo_caminho) return res.status(404).send(views.erro(ctx(req), 404, 'Arquivo ainda não enviado.'));
    res.download(path.join(pastaUploads, d.arquivo_caminho), d.arquivo_nome);
  });

  app.post('/pedidos/:id/documentos/:docId/revisao', auth.exigirOperador, carregarPedido, carregarDocumento, (req, res) => {
    const situacao = req.body.situacao;
    const nota = String(req.body.nota || '').trim().slice(0, 500) || null;
    if (!['aprovado', 'rejeitado'].includes(situacao)) return res.status(400).send('Situação inválida.');
    if (situacao === 'rejeitado' && !nota) {
      return res.status(400).send(views.erro(ctx(req), 400, 'Explique ao cliente o motivo da rejeição na nota.'));
    }
    db.prepare("UPDATE documentos SET situacao = ?, nota = ?, atualizado_em = datetime('now') WHERE id = ?")
      .run(situacao, nota, req.documento.id);
    registrarEvento(req.pedido.id, req.usuario.id, 'documento',
      `"${req.documento.item}" ${situacao === 'aprovado' ? 'aprovado' : `rejeitado: ${nota}`}.`);
    res.redirect(`/pedidos/${req.pedido.id}`);
  });

  app.use((req, res) => res.status(404).send(views.erro(ctx(req), 404, 'Página não encontrada.')));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(views.erro(ctx(req), 500, 'Erro inesperado. Tente novamente.'));
  });

  app.locals.db = db;
  return app;
}

function garantirOperador(db, { nome, email, senha }) {
  const emailNormalizado = email.trim().toLowerCase();
  if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(emailNormalizado)) return;
  db.prepare("INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, 'operador')")
    .run(nome, emailNormalizado, auth.hashSenha(senha));
}

module.exports = { criarApp };

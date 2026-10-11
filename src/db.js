const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('cliente', 'operador')),
  profissao TEXT,
  registro_profissional TEXT,
  telefone TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessoes (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES usuarios(id),
  servico_codigo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recebido',
  titulo_obra TEXT NOT NULL,
  municipio TEXT NOT NULL,
  endereco TEXT NOT NULL,
  proprietario TEXT NOT NULL,
  proprietario_doc TEXT NOT NULL,
  area_m2 REAL,
  observacoes TEXT,
  protocolo_orgao TEXT,
  previsao TEXT,
  responsavel_id INTEGER REFERENCES usuarios(id),
  dados TEXT NOT NULL DEFAULT '{}',
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'checklist' CHECK (origem IN ('checklist', 'extra', 'emitido')),
  modelo TEXT,
  ia_situacao TEXT,
  ia_parecer TEXT,
  arquivo_nome TEXT,
  arquivo_caminho TEXT,
  situacao TEXT NOT NULL DEFAULT 'pendente'
    CHECK (situacao IN ('pendente', 'enviado', 'aprovado', 'rejeitado')),
  nota TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  autor_id INTEGER REFERENCES usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('status', 'mensagem', 'documento', 'sistema')),
  texto TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_pedido ON documentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_eventos_pedido ON eventos(pedido_id);
`;

function abrirBanco(arquivo) {
  if (arquivo !== ':memory:') fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const db = new DatabaseSync(arquivo);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  migrar(db);
  return db;
}

// Colunas adicionadas depois da primeira versão; bancos antigos ganham as
// colunas que faltam.
function migrar(db) {
  const colunas = (tabela) => db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name);
  if (!colunas('pedidos').includes('dados')) {
    db.exec("ALTER TABLE pedidos ADD COLUMN dados TEXT NOT NULL DEFAULT '{}'");
  }
  for (const coluna of ['modelo', 'ia_situacao', 'ia_parecer']) {
    if (!colunas('documentos').includes(coluna)) db.exec(`ALTER TABLE documentos ADD COLUMN ${coluna} TEXT`);
  }
}

// Executa fn dentro de uma transação, desfazendo tudo se lançar exceção.
function transacao(db, fn) {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

module.exports = { abrirBanco, transacao };

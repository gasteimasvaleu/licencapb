const crypto = require('node:crypto');

const DURACAO_SESSAO_DIAS = 14;
const COOKIE = 'sessao';

function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(senha, sal, 64);
  return `${sal.toString('hex')}:${hash.toString('hex')}`;
}

function conferirSenha(senha, armazenado) {
  const [salHex, hashHex] = String(armazenado).split(':');
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const obtido = crypto.scryptSync(senha, Buffer.from(salHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(esperado, obtido);
}

function lerCookies(req) {
  const cookies = {};
  for (const parte of (req.headers.cookie || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) cookies[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return cookies;
}

function criarSessao(db, res, usuarioId, seguro) {
  const token = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DURACAO_SESSAO_DIAS * 864e5);
  db.prepare('INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, ?)')
    .run(token, usuarioId, expira.toISOString());
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: seguro,
    expires: expira,
  });
}

function encerrarSessao(db, req, res) {
  const token = lerCookies(req)[COOKIE];
  if (token) db.prepare('DELETE FROM sessoes WHERE token = ?').run(token);
  res.clearCookie(COOKIE);
}

// Middleware: popula req.usuario quando há sessão válida.
function carregarUsuario(db) {
  const buscar = db.prepare(`
    SELECT u.id, u.nome, u.email, u.papel, u.profissao, u.registro_profissional, u.telefone
    FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token = ? AND s.expira_em > ?`);
  return (req, res, next) => {
    const token = lerCookies(req)[COOKIE];
    req.usuario = token ? buscar.get(token, new Date().toISOString()) || null : null;
    res.locals.usuario = req.usuario;
    next();
  };
}

function exigirLogin(req, res, next) {
  if (!req.usuario) return res.redirect(`/entrar?voltar=${encodeURIComponent(req.originalUrl)}`);
  next();
}

function exigirOperador(req, res, next) {
  if (!req.usuario) return res.redirect('/entrar');
  if (req.usuario.papel !== 'operador') return res.status(403).send('Acesso restrito à equipe.');
  next();
}

// Proteção contra CSRF: token derivado da sessão, conferido em todo POST.
function tokenCsrf(req) {
  const sessao = lerCookies(req)[COOKIE] || '';
  return crypto.createHash('sha256').update(`csrf:${sessao}`).digest('hex').slice(0, 32);
}

function conferirCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  // Formulários multipart (upload) mandam o token na URL, pois o corpo só é
  // lido depois desta verificação.
  const enviado = (req.body && req.body._csrf) || req.query._csrf;
  const esperado = tokenCsrf(req);
  if (typeof enviado !== 'string' || enviado.length !== esperado.length ||
      !crypto.timingSafeEqual(Buffer.from(enviado), Buffer.from(esperado))) {
    return res.status(403).send('Formulário expirado. Volte, recarregue a página e tente de novo.');
  }
  next();
}

module.exports = {
  hashSenha, conferirSenha, criarSessao, encerrarSessao, carregarUsuario,
  exigirLogin, exigirOperador, tokenCsrf, conferirCsrf,
};

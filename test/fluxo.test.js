const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { criarApp } = require('../src/app');

let servidor;
let base;
let pasta;

before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'licencas-'));
  const app = criarApp({
    arquivoBanco: path.join(pasta, 'teste.db'),
    pastaUploads: path.join(pasta, 'uploads'),
    operadorInicial: { nome: 'Ana Equipe', email: 'equipe@teste.com', senha: 'senha-forte-1' },
  });
  await new Promise((r) => { servidor = app.listen(0, r); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

// Cliente HTTP mínimo que guarda o cookie de sessão e extrai o token CSRF.
function navegador() {
  let cookie = '';
  async function req(caminho, opcoes = {}) {
    const r = await fetch(base + caminho, { redirect: 'manual', ...opcoes, headers: { cookie, ...opcoes.headers } });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return r;
  }
  async function csrf(caminho) {
    const html = await (await req(caminho)).text();
    return html.match(/name="_csrf" value="([^"]+)"/)[1];
  }
  async function post(caminho, dados, origem = caminho) {
    const token = await csrf(origem);
    return req(caminho, { method: 'POST', body: new URLSearchParams({ _csrf: token, ...dados }) });
  }
  return { req, csrf, post };
}

test('fluxo completo: cadastro, pedido, upload, revisão e entrega', async () => {
  const cliente = navegador();
  let r = await cliente.post('/cadastro', {
    nome: 'Carla Engenheira', email: 'carla@obra.com', senha: '12345678', profissao: 'Engenheiro(a) civil',
  });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/painel');

  r = await cliente.post('/pedidos', {
    servico: 'cbmpb-projeto', titulo_obra: 'Residencial Atlântico', municipio: 'João Pessoa',
    endereco: 'Av. Cabo Branco, 100', proprietario: 'Atlântico Ltda', proprietario_doc: '12.345.678/0001-90',
  }, '/pedidos/novo');
  assert.equal(r.status, 302);
  const urlPedido = r.headers.get('location');
  assert.match(urlPedido, /^\/pedidos\/\d+$/);

  let html = await (await cliente.req(urlPedido)).text();
  assert.match(html, /Projeto de prevenção e combate a incêndio/);
  assert.match(html, /0\/10 aprovados/);

  // Envia o primeiro item do checklist.
  const acaoUpload = html.match(/action="(\/pedidos\/\d+\/documentos\/(\d+)\/arquivo\?_csrf=[^"]+)"/);
  const docId = acaoUpload[2];
  const form = new FormData();
  form.append('arquivo', new Blob(['%PDF-1.4 teste']), 'procuracao.pdf');
  r = await cliente.req(acaoUpload[1].replace(/&amp;/g, '&'), { method: 'POST', body: form });
  assert.equal(r.status, 302);

  // Tipos não permitidos são recusados.
  const form2 = new FormData();
  form2.append('arquivo', new Blob(['MZ']), 'virus.exe');
  r = await cliente.req(acaoUpload[1], { method: 'POST', body: form2 });
  assert.equal(r.status, 400);

  // Equipe revisa e protocola.
  const equipe = navegador();
  r = await equipe.post('/entrar', { email: 'equipe@teste.com', senha: 'senha-forte-1' }, '/entrar');
  assert.equal(r.status, 302);
  html = await (await equipe.req('/equipe')).text();
  assert.match(html, /Residencial Atlântico/);

  r = await equipe.post(`${urlPedido}/documentos/${docId}/revisao`, { situacao: 'aprovado' }, urlPedido);
  assert.equal(r.status, 302);
  r = await equipe.post(`${urlPedido}/status`, {
    status: 'protocolado', protocolo_orgao: 'CBM-2026-000123', previsao: '2026-11-30', texto: 'Protocolado hoje.',
  }, urlPedido);
  assert.equal(r.status, 302);

  html = await (await cliente.req(urlPedido)).text();
  assert.match(html, /CBM-2026-000123/);
  assert.match(html, /Protocolado no órgão/);
  assert.match(html, /1\/10 aprovados/);

  // Dados preenchidos aparecem nos documentos gerados.
  html = await (await cliente.req(`${urlPedido}/dados`)).text();
  assert.match(html, /name="inc_ocupacao"/);
  assert.doesNotMatch(html, /name="amb_condicionantes"/);
  r = await cliente.post(`${urlPedido}/dados`, { inc_ocupacao: 'A-2 Habitação multifamiliar', proprietario: 'hack' },
    `${urlPedido}/dados`);
  assert.equal(r.status, 302);
  html = await (await cliente.req(`${urlPedido}/modelos/memorial-incendio`)).text();
  assert.match(html, /A-2 Habitação multifamiliar/);
  assert.match(html, /Atlântico Ltda/);
  r = await cliente.req(`${urlPedido}/modelos/procuracao?formato=doc`);
  assert.match(r.headers.get('content-type'), /application\/msword/);
  r = await cliente.req(`${urlPedido}/modelos/relatorio-condicionantes`);
  assert.equal(r.status, 404);

  // O arquivo enviado pode ser baixado pelo dono.
  r = await cliente.req(`${urlPedido}/documentos/${docId}/arquivo`);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '%PDF-1.4 teste');
});

test('cliente não vê pedido de outro cliente e não acessa a fila da equipe', async () => {
  const intruso = navegador();
  await intruso.post('/cadastro', { nome: 'Outro', email: 'outro@obra.com', senha: '12345678' });
  let r = await intruso.req('/pedidos/1');
  assert.equal(r.status, 404);
  r = await intruso.req('/pedidos/1/documentos/1/arquivo');
  assert.equal(r.status, 404);
  r = await intruso.req('/equipe');
  assert.equal(r.status, 403);
});

test('POST sem token CSRF é recusado', async () => {
  const r = await fetch(`${base}/entrar`, {
    method: 'POST', body: new URLSearchParams({ email: 'equipe@teste.com', senha: 'senha-forte-1' }),
  });
  assert.equal(r.status, 403);
});

test('login não redireciona para domínio externo', async () => {
  const n = navegador();
  const r = await n.post('/entrar', { email: 'equipe@teste.com', senha: 'senha-forte-1', voltar: '//malicioso.com' }, '/entrar');
  assert.equal(r.headers.get('location'), '/painel');
});

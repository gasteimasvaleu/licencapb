const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { criarIA, iaConfigurada, RecusaIA } = require('../src/ia');
const { criarApp } = require('../src/app');
const { SERVICOS } = require('../src/catalogo');

// Cliente falso com a mesma forma de client.beta.messages.parse.
function clienteFalso(resposta) {
  const chamadas = [];
  return {
    chamadas,
    beta: { messages: { parse: async (params) => { chamadas.push(params); return resposta(params); } } },
  };
}

test('iaConfigurada depende da chave e pode ser desligada', () => {
  assert.equal(iaConfigurada({}), false);
  assert.equal(iaConfigurada({ ANTHROPIC_API_KEY: 'x' }), true);
  assert.equal(iaConfigurada({ ANTHROPIC_API_KEY: 'x', IA_ATIVA: '0' }), false);
});

test('redigirTextos pede um campo por texto, com modelo, fallback e saída estruturada', async () => {
  const cliente = clienteFalso(() => ({ stop_reason: 'end_turn', parsed_output: { descricao: 'Edifício de 10 pavimentos.' } }));
  const ia = criarIA({ cliente });
  const r = await ia.redigirTextos({
    servico: SERVICOS.get('sudema-lp'),
    valores: { titulo_obra: 'Res. Sol', pavimentos: '10' },
    camposAlvo: [{ id: 'descricao', rotulo: 'Descrição geral' }],
    camposContexto: [{ id: 'titulo_obra', rotulo: 'Nome' }, { id: 'pavimentos', rotulo: 'Pavimentos' }],
  });
  assert.deepEqual(r, { descricao: 'Edifício de 10 pavimentos.' });
  const p = cliente.chamadas[0];
  assert.equal(p.model, 'claude-opus-5-5');
  assert.equal(p.fallbacks, 'default');
  assert.deepEqual(p.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(p.output_config.format.type, 'json_schema');
  assert.deepEqual(p.output_config.format.schema.required, ['descricao']);
  assert.match(p.messages[0].content, /Pavimentos: 10/);
});

test('recusa da IA vira RecusaIA', async () => {
  const ia = criarIA({ cliente: clienteFalso(() => ({ stop_reason: 'refusal', parsed_output: null })) });
  await assert.rejects(ia.redigirTextos({
    servico: SERVICOS.get('sudema-lp'), valores: {}, camposAlvo: [{ id: 'descricao', rotulo: 'x' }], camposContexto: [],
  }), RecusaIA);
});

test('conferirDocumento envia PDF como documento e ignora tipos não analisáveis', async () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-'));
  const pdf = path.join(pasta, 'a.pdf');
  fs.writeFileSync(pdf, '%PDF-1.4');
  const cliente = clienteFalso(() => ({ stop_reason: 'end_turn', parsed_output: { situacao: 'ok', resumo: 'ok', problemas: [] } }));
  const ia = criarIA({ cliente });
  const base = { servico: SERVICOS.get('sudema-lp'), item: 'ART', valores: {}, camposContexto: [] };
  const r = await ia.conferirDocumento({ ...base, caminho: pdf, nomeArquivo: 'art.pdf' });
  assert.equal(r.situacao, 'ok');
  assert.equal(cliente.chamadas[0].messages[0].content[0].type, 'document');
  assert.equal(await ia.conferirDocumento({ ...base, caminho: pdf, nomeArquivo: 'planta.dwg' }), null);
  assert.equal(cliente.chamadas.length, 1);
  fs.rmSync(pasta, { recursive: true, force: true });
});

// ---------- Integração com o app ----------

let servidor;
let base;
let pasta;
let app;
const iaFalsa = {
  async redigirTextos({ camposAlvo }) {
    return Object.fromEntries(camposAlvo.map((c) => [c.id, `Texto IA para ${c.id}`]));
  },
  async conferirDocumento() {
    return { situacao: 'atencao', resumo: 'CNPJ diferente do pedido.', problemas: ['CNPJ 11.111.111/0001-11 no arquivo'] };
  },
};

before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'licencas-ia-'));
  app = criarApp({ arquivoBanco: path.join(pasta, 't.db'), pastaUploads: path.join(pasta, 'up'), ia: iaFalsa });
  await new Promise((r) => { servidor = app.listen(0, r); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

test('app: IA redige textos vazios sem sobrescrever os já preenchidos e confere uploads', async () => {
  let cookie = '';
  const req = async (c, o = {}) => {
    const r = await fetch(base + c, { redirect: 'manual', ...o, headers: { cookie, ...o.headers } });
    const sc = r.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return r;
  };
  const csrf = async (c) => (await (await req(c)).text()).match(/name="_csrf" value="([^"]+)"/)[1];
  const post = async (c, dados, origem = c) =>
    req(c, { method: 'POST', body: new URLSearchParams({ _csrf: await csrf(origem), ...dados }) });

  await post('/cadastro', { nome: 'Ana', email: 'ana@x.com', senha: '12345678' });
  const r = await post('/pedidos', {
    servico: 'iphaep-projeto', titulo_obra: 'Casarão', municipio: 'João Pessoa', endereco: 'Rua da Areia, 10',
    proprietario: 'Ana', proprietario_doc: '123.456.789-09',
  }, '/pedidos/novo');
  const url = r.headers.get('location');

  await post(`${url}/dados`, { pat_bem: 'Centro Histórico', pat_estado_atual: 'Escrito pelo cliente' }, `${url}/dados`);
  let html = await (await req(`${url}/dados`)).text();
  assert.match(html, /Redigir com IA/);
  const res = await post(`${url}/ia/textos`, {}, `${url}/dados`);
  assert.equal(res.status, 302);
  html = await (await req(res.headers.get('location'))).text();
  assert.match(html, /A IA redigiu \d+ texto/);
  assert.match(html, /Texto IA para pat_intervencao/);
  assert.match(html, /Escrito pelo cliente/);
  assert.doesNotMatch(html, /Texto IA para pat_estado_atual/);

  html = await (await req(url)).text();
  const acao = html.match(/action="(\/pedidos\/\d+\/documentos\/\d+\/arquivo\?_csrf=[^"]+)"/)[1];
  const form = new FormData();
  form.append('arquivo', new Blob(['%PDF-1.4']), 'procuracao.pdf');
  await req(acao, { method: 'POST', body: form });
  await app.locals.aguardarIA();
  html = await (await req(url)).text();
  assert.match(html, /IA: pontos de atenção/);
  assert.match(html, /CNPJ 11.111.111\/0001-11 no arquivo/);
});

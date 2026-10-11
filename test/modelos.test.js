const { test } = require('node:test');
const assert = require('node:assert');
const { SERVICOS } = require('../src/catalogo');
const { CAMPOS, CAMPOS_POR_ID } = require('../src/campos');
const { MODELOS, modelosDoServico, gerar } = require('../src/modelos');
const docs = require('../src/documentos');

const HOJE = new Date(2026, 9, 11);

function valoresCompletos(doc) {
  const valores = {};
  for (const c of CAMPOS) valores[c.id] = c.tipo === 'texto' ? `${c.id} linha 1\n${c.id} linha 2` : `valor-${c.id}`;
  valores.proprietario_doc = doc;
  return valores;
}

test('todo serviço referencia apenas modelos existentes', () => {
  for (const servico of SERVICOS.values()) {
    for (const codigo of modelosDoServico(servico)) {
      assert.ok(MODELOS[codigo], `${servico.codigo} usa modelo inexistente ${codigo}`);
    }
  }
});

test('todos os modelos geram sem pendências quando os dados estão completos (PF e PJ)', () => {
  for (const servico of SERVICOS.values()) {
    for (const doc of ['123.456.789-09', '12.345.678/0001-90']) {
      for (const codigo of modelosDoServico(servico)) {
        const g = gerar(codigo, valoresCompletos(doc), servico, HOJE);
        assert.deepEqual(g.faltando, [], `${servico.codigo}/${codigo} com ${doc}`);
        assert.doesNotMatch(g.html, /undefined|\[object/, `${servico.codigo}/${codigo}`);
        for (const id of g.usados) assert.ok(CAMPOS_POR_ID.has(id), `campo desconhecido ${id} em ${codigo}`);
      }
    }
  }
});

test('campos vazios ficam destacados e contados como pendentes', () => {
  const servico = SERVICOS.get('sudema-lp');
  const g = gerar('procuracao', { proprietario: 'Fulano', proprietario_doc: '12345678909' }, servico, HOJE);
  assert.match(g.html, /<mark class="faltando">\[Endereço completo do requerente/);
  assert.ok(g.faltando.includes('req_endereco'));
  assert.ok(!g.faltando.includes('proprietario'));
  // Pessoa física não pede representante legal.
  assert.ok(!g.usados.includes('req_representante_nome'));
});

test('pessoa jurídica usa qualificação com representante legal', () => {
  const servico = SERVICOS.get('sudema-lp');
  const g = gerar('requerimento', valoresCompletos('12.345.678/0001-90'), servico, HOJE);
  assert.match(g.html, /pessoa jurídica de direito privado/);
  assert.match(g.html, /valor-req_representante_nome/);
  assert.match(g.html, /11 de outubro de 2026/);
});

test('valores do usuário são escapados', () => {
  const servico = SERVICOS.get('cbmpb-projeto');
  const g = gerar('requerimento', { proprietario: '<script>alert(1)</script>', proprietario_doc: '1' }, servico, HOJE);
  assert.doesNotMatch(g.html, /<script>/);
  assert.match(g.html, /&lt;script&gt;/);
});

test('padrões do cadastro preenchem o responsável técnico e os dados do pedido prevalecem', () => {
  const pedido = {
    proprietario: 'Bela Vista SPE', proprietario_doc: '12345678000190', endereco: 'Rua A', municipio: 'Patos',
    titulo_obra: 'Res. Sol', area_m2: 120, dados: JSON.stringify({ rt_art: 'PB2026001', proprietario: 'ignorado' }),
  };
  const cliente = { nome: 'Carla', profissao: 'Engenheiro(a) civil', registro_profissional: 'CREA 123', email: 'c@x.com' };
  const v = docs.valoresDoPedido(pedido, cliente, { PLATAFORMA_NOME: 'LicençaPB Serviços Ltda' });
  assert.equal(v.rt_nome, 'Carla');
  assert.equal(v.rt_titulo, 'Engenheiro(a) Civil');
  assert.equal(v.rt_art, 'PB2026001');
  assert.equal(v.proc_nome, 'LicençaPB Serviços Ltda');
  assert.equal(v.proprietario, 'Bela Vista SPE');
  assert.equal(v.area_m2, '120');
});

test('checklist inclui os modelos que precisam de assinatura, mas não o texto de publicação', () => {
  const itens = docs.itensChecklistDeModelos(SERVICOS.get('sudema-lp')).map((i) => i.codigo);
  assert.deepEqual(itens, ['procuracao', 'requerimento', 'declaracao-veracidade', 'memorial-descritivo',
    'termo-responsabilidade-tecnica']);
});

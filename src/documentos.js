// Liga pedidos aos modelos: monta os valores de preenchimento, descobre que
// campos o serviço precisa e gera os documentos.

const { CAMPOS, CAMPOS_POR_ID } = require('./campos');
const { MODELOS, modelosDoServico, gerar } = require('./modelos');

const TITULOS_PROFISSAO = {
  'Engenheiro(a) civil': 'Engenheiro(a) Civil',
  'Arquiteto(a)': 'Arquiteto(a) e Urbanista',
};

function lerDados(pedido) {
  try {
    const dados = JSON.parse(pedido.dados || '{}');
    return dados && typeof dados === 'object' ? dados : {};
  } catch {
    return {};
  }
}

// Valores padrão vindos do ambiente (dados da plataforma como procuradora)
// e do cadastro do cliente (que normalmente é o responsável técnico).
function padroes(cliente, env) {
  const valores = {};
  for (const campo of CAMPOS) {
    if (campo.padrao) valores[campo.id] = campo.padrao;
    if (campo.padraoEnv && env[campo.padraoEnv]) valores[campo.id] = env[campo.padraoEnv];
  }
  if (cliente && cliente.profissao !== 'Construtora / incorporadora' && cliente.profissao !== 'Outro') {
    Object.assign(valores, {
      rt_nome: cliente.nome,
      rt_titulo: TITULOS_PROFISSAO[cliente.profissao] || '',
      rt_registro: cliente.registro_profissional || '',
      rt_contato: [cliente.email, cliente.telefone].filter(Boolean).join(' · '),
    });
  }
  return valores;
}

function valoresDoPedido(pedido, cliente, env = process.env) {
  const valores = { ...padroes(cliente, env) };
  for (const [k, v] of Object.entries(lerDados(pedido))) {
    if (CAMPOS_POR_ID.has(k) && String(v).trim()) valores[k] = v;
  }
  for (const campo of CAMPOS) {
    if (campo.fonte === 'pedido' && pedido[campo.id] != null) valores[campo.id] = String(pedido[campo.id]);
  }
  return valores;
}

// Gera todos os modelos do serviço e resume o que cada um ainda precisa.
function documentosDoPedido(servico, valores) {
  return modelosDoServico(servico).map((codigo) => gerar(codigo, valores, servico));
}

// Campos editáveis que os modelos deste pedido usam, na ordem do cadastro.
function camposNecessarios(gerados) {
  const usados = new Set(gerados.flatMap((g) => g.usados));
  return CAMPOS.filter((c) => usados.has(c.id) && c.fonte !== 'pedido');
}

function itensChecklistDeModelos(servico) {
  return modelosDoServico(servico)
    .filter((codigo) => MODELOS[codigo].assinatura)
    .map((codigo) => ({ codigo, item: `${MODELOS[codigo].titulo} — assinado (modelo gerado pela plataforma)` }));
}

module.exports = { lerDados, valoresDoPedido, documentosDoPedido, camposNecessarios, itensChecklistDeModelos };

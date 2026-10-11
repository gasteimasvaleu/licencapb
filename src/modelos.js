// Modelos de documentos gerados a partir dos dados do pedido.
//
// Cada modelo é uma função que recebe um "preenchedor" (f) e devolve o corpo
// em HTML. O preenchedor escapa os valores, marca em destaque os campos não
// preenchidos e registra quais campos o modelo usou — é assim que a tela de
// dados sabe o que perguntar e o pedido sabe o que ainda falta.
//
// Os textos são modelos de referência: antes de usar em produção, revise com
// um advogado e confira com cada órgão se há formulário próprio obrigatório.

const { CAMPOS_POR_ID } = require('./campos');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function criarPreenchedor(valores, servico, hoje = new Date()) {
  const usados = new Set();
  const faltando = new Set();
  const bruto = (id) => String(valores[id] ?? '').trim();

  const f = {
    servico,
    usados,
    faltando,
    // Valor escapado; se vazio, marca o campo como pendente no documento.
    v(id) {
      usados.add(id);
      const valor = bruto(id);
      if (valor) return esc(valor);
      faltando.add(id);
      return `<mark class="faltando">[${esc(CAMPOS_POR_ID.get(id)?.rotulo || id)}]</mark>`;
    },
    // Valor opcional: não conta como pendência.
    opt(id, seVazio = '') {
      usados.add(id);
      return bruto(id) ? esc(bruto(id)) : seVazio;
    },
    tem(id) {
      usados.add(id);
      return Boolean(bruto(id));
    },
    linhas(id) {
      usados.add(id);
      const lista = bruto(id).split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lista.length) faltando.add(id);
      return lista;
    },
    paragrafos(id) {
      const lista = f.linhas(id);
      return lista.length ? lista.map((l) => `<p>${esc(l)}</p>`).join('') : `<p>${f.v(id)}</p>`;
    },
    get pj() {
      usados.add('proprietario_doc');
      return bruto('proprietario_doc').replace(/\D/g, '').length === 14;
    },
    // Qualificação completa do requerente, em PF ou PJ.
    qualificacao() {
      if (f.pj) {
        return `<strong>${f.v('proprietario')}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob
          o nº ${f.v('proprietario_doc')}, com sede em ${f.v('req_endereco')}, neste ato representada por
          ${f.v('req_representante_nome')}, ${f.v('req_representante_cargo')}, inscrito(a) no CPF sob o
          nº ${f.v('req_representante_cpf')}`;
      }
      return `<strong>${f.v('proprietario')}</strong>, ${f.v('req_nacionalidade')}, ${f.v('req_estado_civil')},
        ${f.v('req_profissao')}, portador(a) do RG nº ${f.v('req_rg')}, inscrito(a) no CPF sob o
        nº ${f.v('proprietario_doc')}, residente e domiciliado(a) em ${f.v('req_endereco')}`;
    },
    localObra() {
      return `${f.v('endereco')}${f.tem('imovel_bairro_cep') ? `, ${f.opt('imovel_bairro_cep')}` : ''},
        ${f.v('municipio')}–PB`;
    },
    localData() {
      usados.add('local_assinatura');
      const cidade = bruto('local_assinatura') || bruto('municipio');
      const data = `${hoje.getDate()} de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`;
      return `${cidade ? esc(cidade) : f.v('local_assinatura')}, ${data}.`;
    },
    assinaturaRequerente() {
      const nome = f.pj ? `${f.v('proprietario')}<br>${f.v('req_representante_nome')} — ${f.v('req_representante_cargo')}`
        : f.v('proprietario');
      return `<div class="assinatura"><div class="linha"></div>${nome}<br>CPF/CNPJ: ${f.v('proprietario_doc')}</div>`;
    },
    assinaturaRT() {
      return `<div class="assinatura"><div class="linha"></div>${f.v('rt_nome')}<br>${f.v('rt_titulo')} —
        ${f.v('rt_registro')}<br>ART/RRT nº ${f.v('rt_art')}</div>`;
    },
  };
  return f;
}

function tabela(linhas) {
  return `<table class="dados">${linhas.map(([rotulo, valor]) =>
    `<tr><th>${rotulo}</th><td>${valor}</td></tr>`).join('')}</table>`;
}

function blocoIdentificacao(f) {
  return tabela([
    ['Empreendimento', f.v('titulo_obra')],
    ['Atividade / tipologia', f.v('atividade')],
    ['Endereço', f.localObra()],
    ['Coordenadas', f.v('coordenadas')],
    ['Requerente', `${f.v('proprietario')} — ${f.v('proprietario_doc')}`],
    ['Responsável técnico', `${f.v('rt_nome')} — ${f.v('rt_registro')}`],
  ]);
}

const MODELOS = {
  procuracao: {
    titulo: 'Procuração particular',
    descricao: 'Autoriza a plataforma a protocolar e acompanhar o processo em nome do requerente.',
    assinatura: 'Requerente (assinatura digital gov.br/ICP-Brasil ou firma reconhecida)',
    render: (f) => `
<h1>PROCURAÇÃO</h1>
<p><strong>OUTORGANTE:</strong> ${f.qualificacao()}.</p>
<p><strong>OUTORGADO(A):</strong> <strong>${f.v('proc_nome')}</strong>, inscrito(a) no CPF/CNPJ sob o
  nº ${f.v('proc_doc')}, com endereço em ${f.v('proc_endereco')}.</p>
<p><strong>PODERES:</strong> pelo presente instrumento particular de mandato, o(a) OUTORGANTE nomeia e
  constitui seu(sua) bastante procurador(a) o(a) OUTORGADO(A), a quem confere poderes específicos para,
  junto ao(à) <strong>${esc(f.servico.orgaoNome)} (${esc(f.servico.orgao)})</strong> e demais órgãos e
  entidades públicas federais, estaduais e municipais, concessionárias de serviço público e cartórios,
  requerer, protocolar e acompanhar o pedido de <strong>${esc(f.servico.nome)}</strong> referente ao
  empreendimento <strong>${f.v('titulo_obra')}</strong>, situado em ${f.localObra()}, podendo para tanto
  apresentar e retirar documentos, preencher formulários e cadastros em sistemas eletrônicos, emitir guias
  de recolhimento de taxas, tomar ciência de exigências, despachos e decisões, responder a notificações,
  interpor recursos administrativos e receber licenças, certidões e demais documentos emitidos, praticando
  todos os atos necessários ao fiel cumprimento deste mandato, vedado o substabelecimento sem reservas.</p>
<p><strong>PRAZO:</strong> este mandato é válido por 12 (doze) meses a contar da data de assinatura, ou até a
  conclusão do processo, o que ocorrer primeiro.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRequerente()}`,
  },

  requerimento: {
    titulo: 'Requerimento ao órgão',
    descricao: 'Pedido formal dirigido ao órgão, com a qualificação do requerente e o objeto do pedido.',
    assinatura: 'Requerente ou procurador',
    render: (f) => `
<p>Ao(À) Ilmo(a). Sr(a). Dirigente do(a)<br><strong>${esc(f.servico.orgaoNome)} — ${esc(f.servico.orgao)}</strong></p>
<h1>REQUERIMENTO</h1>
<p>${f.qualificacao()}, por meio de seu(sua) procurador(a) ${f.v('proc_nome')} (CPF/CNPJ ${f.v('proc_doc')}),
  vem respeitosamente requerer a Vossa Senhoria a <strong>${esc(f.servico.nome)}</strong> para o empreendimento
  abaixo identificado, ${esc(f.servico.finalidade || f.servico.descricao.replace(/\.$/, '').toLowerCase())}.</p>
${blocoIdentificacao(f)}
${tabela([
    ['Tipo de intervenção', f.v('tipo_intervencao')],
    ['Área do terreno', `${f.v('area_terreno')} m²`],
    ['Área construída', `${f.v('area_m2')} m²`],
    ['Matrícula / cartório', `${f.v('imovel_matricula')} — ${f.v('imovel_cartorio')}`],
    ['ART/RRT', f.v('rt_art')],
    ['Contato do requerente', `${f.opt('req_email', '—')} · ${f.opt('req_telefone', '—')}`],
  ])}
<p>Declara estar ciente de que o pedido será analisado conforme a legislação vigente e de que a
  falta de documentos ou informações poderá gerar exigências ou o arquivamento do processo. Seguem
  anexos os documentos relacionados no checklist do serviço.</p>
<p>Nestes termos, pede deferimento.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRequerente()}`,
  },

  'declaracao-veracidade': {
    titulo: 'Declaração de veracidade das informações',
    descricao: 'Declaração de que as informações e os documentos apresentados são verdadeiros.',
    assinatura: 'Requerente',
    render: (f) => `
<h1>DECLARAÇÃO DE VERACIDADE</h1>
<p>${f.qualificacao()}, DECLARA, para fins de instrução do pedido de <strong>${esc(f.servico.nome)}</strong>
  junto ao(à) ${esc(f.servico.orgaoNome)} (${esc(f.servico.orgao)}), referente ao empreendimento
  <strong>${f.v('titulo_obra')}</strong>, situado em ${f.localObra()}, que todas as informações prestadas e os
  documentos apresentados são verdadeiros e correspondem à realidade, estando ciente de que a falsidade de
  declaração sujeita o(a) declarante às sanções administrativas cabíveis e às penas do art. 299 do Código
  Penal, bem como à suspensão ou ao cancelamento do ato administrativo eventualmente emitido.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRequerente()}`,
  },

  'termo-responsabilidade-tecnica': {
    titulo: 'Termo de responsabilidade técnica',
    descricao: 'O profissional declara a autoria/responsabilidade pelos projetos e estudos apresentados.',
    assinatura: 'Responsável técnico',
    render: (f) => `
<h1>TERMO DE RESPONSABILIDADE TÉCNICA</h1>
<p>Eu, <strong>${f.v('rt_nome')}</strong>, ${f.v('rt_titulo')}, registro ${f.v('rt_registro')}, DECLARO para
  os devidos fins, junto ao(à) ${esc(f.servico.orgaoNome)} (${esc(f.servico.orgao)}), que sou o(a)
  responsável técnico(a) pelos projetos, memoriais e estudos que instruem o pedido de
  <strong>${esc(f.servico.nome)}</strong> do empreendimento <strong>${f.v('titulo_obra')}</strong>, situado em
  ${f.localObra()}, conforme a ART/RRT nº ${f.v('rt_art')}, e que estes foram elaborados em conformidade com
  as normas técnicas e a legislação aplicáveis.</p>
<p>Declaro ainda estar ciente de que respondo civil, administrativa e penalmente pelas informações técnicas
  prestadas.</p>
<p>Contato: ${f.v('rt_contato')}</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}`,
  },

  'memorial-descritivo': {
    titulo: 'Memorial descritivo do empreendimento',
    descricao: 'Descrição técnica do empreendimento, da localização e da infraestrutura.',
    assinatura: 'Responsável técnico',
    render: (f) => `
<h1>MEMORIAL DESCRITIVO</h1>
<h2>1. Identificação</h2>
${blocoIdentificacao(f)}
<h2>2. Caracterização do imóvel</h2>
${tabela([
    ['Matrícula / cartório', `${f.v('imovel_matricula')} — ${f.v('imovel_cartorio')}`],
    ['Inscrição imobiliária', f.v('imovel_inscricao')],
    ['Área do terreno', `${f.v('area_terreno')} m²`],
  ])}
<h2>3. Caracterização do empreendimento</h2>
${tabela([
    ['Tipo de intervenção', f.v('tipo_intervencao')],
    ['Área construída', `${f.v('area_m2')} m²`],
    ['Pavimentos', f.v('pavimentos')],
    ['Altura da edificação', `${f.v('altura')} m`],
    ['Unidades', f.v('unidades')],
    ['População estimada', `${f.v('populacao')} pessoas`],
    ['Investimento estimado', `R$ ${f.v('investimento')}`],
    ['Prazo da obra', f.v('prazo_obra')],
  ])}
${f.paragrafos('descricao')}
<h2>4. Infraestrutura</h2>
${tabela([
    ['Abastecimento de água', `${f.v('abastecimento_agua')} — consumo estimado de ${f.v('consumo_agua')} m³/dia`],
    ['Esgotamento sanitário', `${f.v('esgotamento')} — vazão estimada de ${f.v('vazao_esgoto')} m³/dia`],
    ['Drenagem pluvial', f.v('drenagem')],
    ['Energia elétrica', `Carga instalada de ${f.v('carga_instalada')} kW; demanda de ${f.v('demanda')} kVA`],
  ])}
<h2>5. Resíduos</h2>
${f.paragrafos('residuos')}
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}`,
  },

  'publicacao-licenca': {
    titulo: 'Texto para publicação do pedido de licença',
    descricao: 'Aviso a ser publicado em jornal e/ou Diário Oficial, conforme exigência do licenciamento ambiental.',
    assinatura: null,
    render: (f) => `
<h1>PUBLICAÇÃO — PEDIDO DE LICENÇA</h1>
<p class="aviso-doc">Publicar em: ${f.v('jornal_publicacao')}. Guarde a página publicada: ela é um documento
  do checklist.</p>
<div class="edital">
  <p><strong>${f.v('proprietario')}</strong>, CPF/CNPJ ${f.v('proprietario_doc')}, torna público que requereu
  à ${esc(f.servico.orgaoNome)} — ${esc(f.servico.orgao)} a <strong>${esc(f.servico.nome)}</strong>
  ${f.tem('amb_licenca_anterior') ? `(licença anterior: ${f.opt('amb_licenca_anterior')})` : ''} para
  ${f.v('atividade')} — ${f.v('titulo_obra')}, localizado(a) em ${f.localObra()}.</p>
</div>`,
  },

  'relatorio-condicionantes': {
    titulo: 'Relatório de cumprimento de condicionantes',
    descricao: 'Demonstra o atendimento de cada condicionante da licença anterior.',
    assinatura: 'Responsável técnico e requerente',
    render: (f) => {
      const condicionantes = f.linhas('amb_condicionantes');
      const cumprimento = f.linhas('amb_cumprimento');
      const linhas = condicionantes.length
        ? condicionantes.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c)}</td><td>${cumprimento[i]
          ? esc(cumprimento[i]) : '<mark class="faltando">[descrever o cumprimento]</mark>'}</td></tr>`).join('')
        : `<tr><td colspan="3">${f.v('amb_condicionantes')}</td></tr>`;
      return `
<h1>RELATÓRIO DE CUMPRIMENTO DE CONDICIONANTES</h1>
${blocoIdentificacao(f)}
<p>Licença de referência: ${f.v('amb_licenca_anterior')}</p>
<table class="grade"><thead><tr><th>#</th><th>Condicionante</th><th>Situação / forma de cumprimento</th></tr></thead>
<tbody>${linhas}</tbody></table>
<p>Seguem anexos relatório fotográfico e comprovantes que evidenciam o atendimento das condicionantes.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}
${f.assinaturaRequerente()}`;
    },
  },

  'plano-supressao': {
    titulo: 'Justificativa técnica da supressão de vegetação',
    descricao: 'Descreve a área, a vegetação e a necessidade da supressão.',
    assinatura: 'Responsável técnico',
    render: (f) => `
<h1>JUSTIFICATIVA TÉCNICA PARA SUPRESSÃO DE VEGETAÇÃO</h1>
${blocoIdentificacao(f)}
<h2>Área, vegetação e justificativa</h2>
${f.paragrafos('amb_vegetacao')}
<h2>Destinação do material lenhoso e medidas mitigadoras</h2>
${f.paragrafos('residuos')}
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}`,
  },

  'ficha-recursos-hidricos': {
    titulo: 'Ficha técnica de uso de recursos hídricos',
    descricao: 'Dados da captação ou obra hídrica para o pedido na AESA.',
    assinatura: 'Responsável técnico e requerente',
    render: (f) => `
<h1>FICHA TÉCNICA — USO DE RECURSOS HÍDRICOS</h1>
${blocoIdentificacao(f)}
<h2>Uso pretendido</h2>
${tabela([
    ['Tipo de captação / uso', f.v('agua_captacao')],
    ['Finalidade', f.v('agua_finalidade')],
    ['Corpo hídrico / aquífero e bacia', f.v('agua_corpo')],
    ['Vazão requerida', `${f.v('agua_vazao')} m³/h`],
    ['Regime de uso', `${f.v('agua_horas')} h/dia · ${f.v('agua_dias')} dias/mês`],
  ])}
<h2>Características da obra hídrica</h2>
${f.paragrafos('agua_obra')}
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}
${f.assinaturaRequerente()}`,
  },

  'solicitacao-viabilidade': {
    titulo: 'Carta de solicitação de viabilidade técnica',
    descricao: 'Pede à concessionária a confirmação de que a rede atende o empreendimento.',
    assinatura: 'Requerente ou responsável técnico',
    render: (f) => {
      const energia = f.servico.orgao === 'ENERGISA';
      const cargas = energia
        ? [['Carga instalada', `${f.v('carga_instalada')} kW`], ['Demanda estimada', `${f.v('demanda')} kVA`]]
        : [['Consumo médio de água', `${f.v('consumo_agua')} m³/dia`],
          ['Vazão de esgoto', `${f.v('vazao_esgoto')} m³/dia`]];
      return `
<p>À<br><strong>${esc(f.servico.orgaoNome)} — ${esc(f.servico.orgao)}</strong></p>
<h1>SOLICITAÇÃO DE VIABILIDADE TÉCNICA</h1>
<p>${f.qualificacao()}, solicita a análise de viabilidade técnica de atendimento de
  <strong>${energia ? 'energia elétrica' : 'abastecimento de água e esgotamento sanitário'}</strong> para o
  empreendimento abaixo:</p>
${blocoIdentificacao(f)}
${tabela([
    ['Área construída', `${f.v('area_m2')} m²`],
    ['Unidades', f.v('unidades')],
    ['População estimada', `${f.v('populacao')} pessoas`],
    ...cargas,
    ['Previsão de ligação', f.v('data_ligacao')],
  ])}
<p>Solicita-se a emissão da carta de viabilidade, com as condições técnicas e eventuais obras necessárias
  para o atendimento.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRequerente()}`;
    },
  },

  'memorial-incendio': {
    titulo: 'Memorial de segurança contra incêndio e pânico',
    descricao: 'Classificação da edificação e medidas de segurança previstas no projeto.',
    assinatura: 'Responsável técnico',
    render: (f) => {
      const medidas = f.linhas('inc_medidas');
      return `
<h1>MEMORIAL DESCRITIVO DE SEGURANÇA CONTRA INCÊNDIO E PÂNICO</h1>
${blocoIdentificacao(f)}
<h2>Classificação da edificação</h2>
${tabela([
    ['Ocupação / grupo / divisão', f.v('inc_ocupacao')],
    ['Área construída', `${f.v('area_m2')} m²`],
    ['Altura', `${f.v('altura')} m`],
    ['Pavimentos', f.v('pavimentos')],
    ['Carga de incêndio', `${f.v('inc_carga')} MJ/m²`],
    ['Lotação', f.v('inc_lotacao')],
  ])}
<h2>Medidas de segurança previstas</h2>
${medidas.length ? `<table class="grade"><thead><tr><th>Medida</th><th>Descrição</th></tr></thead><tbody>${
    medidas.map((m) => { const [nome, ...resto] = m.split(/\s+[—-]\s+/); return `<tr><td>${esc(nome)}</td><td>${esc(resto.join(' — '))}</td></tr>`; }).join('')
  }</tbody></table>` : `<p>${f.v('inc_medidas')}</p>`}
<p>As medidas acima foram dimensionadas conforme as normas técnicas do Corpo de Bombeiros Militar da
  Paraíba e as NBRs aplicáveis, e estão detalhadas nas pranchas do projeto.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}`;
    },
  },

  'memorial-patrimonio': {
    titulo: 'Memorial justificativo de intervenção em patrimônio',
    descricao: 'Estado atual, intervenção proposta e critérios de preservação.',
    assinatura: 'Responsável técnico',
    render: (f) => `
<h1>MEMORIAL JUSTIFICATIVO DE INTERVENÇÃO</h1>
${blocoIdentificacao(f)}
<p>Bem tombado / área de preservação: ${f.v('pat_bem')}</p>
<h2>1. Estado atual</h2>
${f.paragrafos('pat_estado_atual')}
<h2>2. Intervenção proposta</h2>
<p>Tipo: ${f.v('tipo_intervencao')}.</p>
${f.paragrafos('pat_intervencao')}
<h2>3. Justificativa e critérios de preservação</h2>
${f.paragrafos('pat_justificativa')}
<p>Acompanham este memorial o levantamento fotográfico e os desenhos do estado atual e da proposta.</p>
<p class="direita">${f.localData()}</p>
${f.assinaturaRT()}`,
  },
};

const MODELOS_COMUNS = ['procuracao', 'requerimento', 'declaracao-veracidade'];

function modelosDoServico(servico) {
  const comuns = servico.semModelosComuns ? [] : MODELOS_COMUNS;
  return [...new Set([...comuns, ...(servico.modelos || [])])];
}

// Gera um modelo e informa quais campos usou e quais ficaram em branco.
function gerar(codigo, valores, servico, hoje) {
  const modelo = MODELOS[codigo];
  if (!modelo) throw new Error(`Modelo desconhecido: ${codigo}`);
  const f = criarPreenchedor(valores, servico, hoje);
  const html = modelo.render(f);
  return { ...modelo, codigo, html, usados: [...f.usados], faltando: [...f.faltando] };
}

module.exports = { MODELOS, MODELOS_COMUNS, modelosDoServico, gerar };

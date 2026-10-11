// Catálogo dos órgãos e serviços envolvidos no licenciamento de obras na
// Paraíba. Para cada serviço:
//   - documentos: o que o cliente envia (anexos que a plataforma não gera);
//   - modelos: documentos que a plataforma gera preenchidos (ver modelos.js);
//     procuração, requerimento e declaração de veracidade entram em todos,
//     salvo quando semModelosComuns é true.
// Os modelos com assinatura também entram no checklist, como "assinado".
//
// Requisitos mudam com portarias e normas técnicas: revise este arquivo
// periodicamente com os sites e atendimentos de cada órgão.

const DOC = {
  identidade: 'Documento de identificação do requerente (RG/CNH) ou contrato social atualizado e cartão CNPJ',
  imovel: 'Comprovante de propriedade ou posse do imóvel (certidão de inteiro teor da matrícula, escritura ou contrato)',
  artProjeto: 'ART (CREA-PB) ou RRT (CAU/PB) de projeto',
  artExecucao: 'ART (CREA-PB) ou RRT (CAU/PB) de execução da obra',
  localizacao: 'Planta de localização/situação com coordenadas geográficas (SIRGAS 2000) e arquivo KML/KMZ',
  projetoArq: 'Projeto arquitetônico (plantas, cortes, fachadas, situação e coberta) em PDF',
  taxa: 'Comprovante de pagamento da taxa do órgão',
  usoSolo: 'Certidão de uso e ocupação do solo emitida pela prefeitura',
  fotos: 'Relatório fotográfico atualizado do local',
};

const ORGAOS = [
  // ---------------------------------------------------------------- Estaduais
  {
    sigla: 'SUDEMA',
    ambito: 'Estadual',
    nome: 'Superintendência de Administração do Meio Ambiente',
    descricao: 'Licenciamento ambiental estadual de obras e empreendimentos potencialmente poluidores.',
    servicos: [
      {
        codigo: 'sudema-lp',
        nome: 'Licença Prévia (LP)',
        descricao: 'Aprova a localização e a concepção do empreendimento na fase de planejamento.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica', 'publicacao-licenca'],
        documentos: [
          DOC.identidade, DOC.imovel, DOC.usoSolo, DOC.localizacao,
          'Estudo ambiental exigido pelo enquadramento (RAS, RCA/PCA ou EIA/RIMA, conforme o caso)',
          'Cartas de viabilidade de água/esgoto (CAGEPA) e energia (Energisa), quando exigidas',
          DOC.artProjeto,
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
          DOC.taxa,
        ],
      },
      {
        codigo: 'sudema-li',
        nome: 'Licença de Instalação (LI)',
        descricao: 'Autoriza o início da obra conforme os projetos aprovados.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica', 'publicacao-licenca', 'relatorio-condicionantes'],
        documentos: [
          DOC.identidade, 'Cópia da Licença Prévia vigente', DOC.projetoArq,
          'Planos e programas ambientais exigidos nas condicionantes da LP (PGRCC, drenagem, etc.)',
          DOC.artProjeto,
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
          DOC.taxa,
        ],
      },
      {
        codigo: 'sudema-lo',
        nome: 'Licença de Operação (LO)',
        descricao: 'Autoriza o funcionamento após verificação das condicionantes da LI.',
        modelos: ['relatorio-condicionantes', 'publicacao-licenca'],
        documentos: [
          DOC.identidade, 'Cópia da Licença de Instalação vigente', DOC.fotos,
          'Comprovantes de destinação dos resíduos da obra (MTR/CTR)',
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
          DOC.taxa,
        ],
      },
      {
        codigo: 'sudema-renovacao-lo',
        nome: 'Renovação de Licença de Operação',
        descricao: 'Renovação da LO, que deve ser requerida antes do vencimento da licença vigente.',
        modelos: ['relatorio-condicionantes', 'publicacao-licenca'],
        documentos: [
          DOC.identidade, 'Cópia da Licença de Operação vigente', DOC.fotos,
          'Comprovante de publicação do pedido de renovação', DOC.taxa,
        ],
      },
      {
        codigo: 'sudema-supressao',
        nome: 'Autorização de Supressão de Vegetação',
        descricao: 'Necessária quando a obra exige remoção de vegetação nativa.',
        modelos: ['plano-supressao', 'termo-responsabilidade-tecnica', 'publicacao-licenca'],
        documentos: [
          DOC.identidade, DOC.imovel,
          'Inventário florestal / levantamento da vegetação',
          'Poligonal da área a ser suprimida (arquivo georreferenciado)',
          'Inscrição do imóvel no CAR (se rural)', DOC.artProjeto, DOC.taxa,
        ],
      },
    ],
  },
  {
    sigla: 'CBMPB',
    ambito: 'Estadual',
    nome: 'Corpo de Bombeiros Militar da Paraíba',
    descricao: 'Segurança contra incêndio e pânico em edificações.',
    servicos: [
      {
        codigo: 'cbmpb-projeto',
        nome: 'Análise de Projeto de Prevenção e Combate a Incêndio',
        descricao: 'Aprovação do projeto de segurança contra incêndio e pânico antes da execução.',
        modelos: ['memorial-incendio', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade,
          'Projeto de prevenção e combate a incêndio (plantas, cortes e detalhes) em PDF',
          'Memória de cálculo dos sistemas (hidrantes, reserva técnica, saídas de emergência)',
          DOC.artProjeto, DOC.taxa,
        ],
      },
      {
        codigo: 'cbmpb-vistoria',
        nome: 'Vistoria e Certificado de Aprovação',
        descricao: 'Vistoria da edificação concluída para emissão do certificado do Corpo de Bombeiros.',
        modelos: [],
        documentos: [
          DOC.identidade, 'Cópia do projeto aprovado pelo CBMPB',
          'ART/RRT de execução das instalações de prevenção',
          'Laudos e certificados dos sistemas instalados (extintores, hidrantes, SPDA, gás, alarme)',
          DOC.taxa,
        ],
      },
    ],
  },
  {
    sigla: 'AESA',
    ambito: 'Estadual',
    nome: 'Agência Executiva de Gestão das Águas da Paraíba',
    descricao: 'Outorga de uso de recursos hídricos e licença de obras hídricas.',
    servicos: [
      {
        codigo: 'aesa-outorga',
        nome: 'Outorga de Direito de Uso de Recursos Hídricos',
        descricao: 'Para captação de água subterrânea (poço) ou superficial, e lançamento de efluentes.',
        modelos: ['ficha-recursos-hidricos', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel, DOC.localizacao,
          'Perfil construtivo e teste de vazão do poço (quando subterrânea)',
          'Análise físico-química e bacteriológica da água, quando exigida',
          DOC.artProjeto, DOC.taxa,
        ],
      },
      {
        codigo: 'aesa-obra-hidrica',
        nome: 'Licença de Obra Hídrica',
        descricao: "Para perfuração de poços, barragens, açudes e intervenções em corpos d'água.",
        modelos: ['ficha-recursos-hidricos', 'memorial-descritivo', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel, DOC.localizacao,
          'Projeto da obra hídrica', DOC.artProjeto, DOC.taxa,
        ],
      },
    ],
  },
  {
    sigla: 'IPHAEP',
    ambito: 'Estadual',
    nome: 'Instituto do Patrimônio Histórico e Artístico do Estado da Paraíba',
    descricao: 'Obras em bens tombados ou em áreas de preservação de interesse estadual.',
    servicos: [
      {
        codigo: 'iphaep-projeto',
        nome: 'Análise de Projeto em Área de Preservação',
        descricao: 'Construção, reforma ou demolição em imóvel tombado ou em seu entorno.',
        modelos: ['memorial-patrimonio', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel,
          'Levantamento arquitetônico do estado atual (plantas, cortes e fachadas)',
          DOC.fotos, DOC.projetoArq, DOC.artProjeto,
        ],
      },
    ],
  },
  {
    sigla: 'DER-PB',
    ambito: 'Estadual',
    nome: 'Departamento de Estradas de Rodagem da Paraíba',
    descricao: 'Intervenções em rodovias estaduais e suas faixas de domínio.',
    servicos: [
      {
        codigo: 'der-acesso',
        nome: 'Autorização de Acesso / Uso de Faixa de Domínio',
        descricao: 'Acesso a rodovia estadual, travessias e ocupação da faixa de domínio.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel,
          'Projeto geométrico do acesso ou da interferência, com sinalização viária',
          DOC.localizacao, DOC.artProjeto, DOC.taxa,
        ],
      },
    ],
  },
  {
    sigla: 'CAGEPA',
    ambito: 'Estadual',
    nome: 'Companhia de Água e Esgotos da Paraíba',
    descricao: 'Viabilidade e aprovação de ligações e redes de água e esgoto.',
    servicos: [
      {
        codigo: 'cagepa-viabilidade',
        nome: 'Carta de Viabilidade Técnica (água e esgoto)',
        descricao: 'Confirma se a rede atende o empreendimento; costuma ser exigida pela prefeitura e pela SUDEMA.',
        semModelosComuns: true,
        modelos: ['procuracao', 'solicitacao-viabilidade'],
        documentos: [DOC.identidade, DOC.localizacao, 'Quadro de áreas e de unidades do empreendimento'],
      },
      {
        codigo: 'cagepa-projeto',
        nome: 'Aprovação de Projeto Hidrossanitário de Empreendimento',
        descricao: 'Redes de água e esgoto de loteamentos e condomínios a serem interligadas ao sistema.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, 'Carta de viabilidade técnica emitida pela CAGEPA',
          'Projeto das redes de água e esgoto com memorial de cálculo', DOC.artProjeto,
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Municipais
  {
    sigla: 'PREFEITURA',
    ambito: 'Municipal',
    nome: 'Prefeitura Municipal (secretaria de planejamento/urbanismo do município da obra)',
    descricao: 'Uso do solo, alvará de construção e habite-se. Cada município tem seu código de obras e seu sistema.',
    servicos: [
      {
        codigo: 'pm-uso-solo',
        nome: 'Certidão de Uso e Ocupação do Solo',
        descricao: 'Atesta que a atividade é permitida no local; exigida no licenciamento ambiental.',
        modelos: [],
        documentos: [DOC.identidade, DOC.imovel, DOC.localizacao, 'Comprovante de inscrição imobiliária (IPTU)', DOC.taxa],
      },
      {
        codigo: 'pm-alvara',
        nome: 'Alvará de Construção (licença de obra)',
        descricao: 'Aprovação do projeto e licença para construir, ampliar, reformar ou demolir.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel, 'Certidão negativa de débitos municipais (IPTU)',
          DOC.projetoArq, DOC.artProjeto, DOC.artExecucao,
          'Licença ambiental e aprovação do Corpo de Bombeiros, quando exigidas pelo porte/uso',
          DOC.taxa,
        ],
      },
      {
        codigo: 'pm-habitese',
        nome: 'Habite-se (certidão de conclusão de obra)',
        descricao: 'Atesta que a obra foi concluída conforme o projeto aprovado.',
        modelos: [],
        documentos: [
          DOC.identidade, 'Alvará de construção', DOC.artExecucao,
          'Certificado de aprovação do Corpo de Bombeiros, quando exigido',
          'Comprovantes de ligação de água/esgoto e energia', DOC.fotos, DOC.taxa,
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Federais
  {
    sigla: 'RFB',
    ambito: 'Federal',
    nome: 'Receita Federal do Brasil',
    descricao: 'Cadastro da obra (CNO) e regularização previdenciária para averbação no cartório.',
    servicos: [
      {
        codigo: 'rfb-cno',
        nome: 'Inscrição da Obra no CNO',
        descricao: 'Cadastro Nacional de Obras, feito pelo e-CAC/gov.br no início da obra. Procuração eletrônica no e-CAC.',
        semModelosComuns: true,
        modelos: [],
        documentos: [DOC.identidade, 'Alvará de construção ou projeto aprovado', DOC.artExecucao,
          'Contrato de empreitada, se houver'],
      },
      {
        codigo: 'rfb-regularizacao',
        nome: 'Regularização da Obra e Certidão Negativa (CND) para averbação',
        descricao: 'Aferição da obra (SERO/DCTFWeb) e emissão da CND exigida pelo cartório para averbar a construção.',
        semModelosComuns: true,
        modelos: [],
        documentos: [
          'Número do CNO da obra', 'Habite-se', DOC.artExecucao,
          'Notas fiscais de serviços e de concreto/argamassa usinados',
          'Comprovantes de recolhimento de contribuições previdenciárias da obra',
        ],
      },
    ],
  },
  {
    sigla: 'IPHAN',
    ambito: 'Federal',
    nome: 'Instituto do Patrimônio Histórico e Artístico Nacional — Superintendência na Paraíba',
    descricao: 'Obras em bens tombados pela União ou em seu entorno (ex.: Centro Histórico de João Pessoa).',
    servicos: [
      {
        codigo: 'iphan-intervencao',
        nome: 'Autorização de Intervenção em Bem Tombado ou Entorno',
        descricao: 'Aprovação prévia de construção, reforma, demolição ou publicidade em área protegida federal.',
        modelos: ['memorial-patrimonio', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, DOC.imovel,
          'Levantamento arquitetônico do estado atual', DOC.fotos, DOC.projetoArq, DOC.artProjeto,
        ],
      },
    ],
  },
  {
    sigla: 'SPU',
    ambito: 'Federal',
    nome: 'Superintendência do Patrimônio da União na Paraíba',
    descricao: 'Imóveis da União, como terrenos de marinha no litoral (João Pessoa, Cabedelo, Conde, Lucena, Pitimbu).',
    servicos: [
      {
        codigo: 'spu-obra',
        nome: 'Regularização / Autorização de Obra em Imóvel da União',
        descricao: 'Situação cadastral (RIP), regularização da ocupação/aforamento e anuência para obras em terreno de marinha.',
        modelos: ['memorial-descritivo'],
        documentos: [
          DOC.identidade, DOC.imovel, 'Número do RIP do imóvel e comprovante de quitação das taxas da SPU',
          DOC.localizacao, DOC.projetoArq,
        ],
      },
    ],
  },
  {
    sigla: 'DECEA',
    ambito: 'Federal',
    nome: 'Departamento de Controle do Espaço Aéreo (Comando da Aeronáutica)',
    descricao: 'Edificações altas ou próximas a aeródromos (ex.: entorno do aeroporto de João Pessoa/Bayeux e Campina Grande).',
    servicos: [
      {
        codigo: 'decea-opea',
        nome: 'Análise de Objeto Projetado no Espaço Aéreo (OPEA)',
        descricao: 'Pedido pelo sistema do DECEA para verificar se a altura da edificação interfere na navegação aérea.',
        semModelosComuns: true,
        modelos: ['memorial-descritivo'],
        documentos: [
          'Coordenadas geográficas dos vértices da edificação (SIRGAS 2000)',
          'Altitude do terreno e altura total da edificação, incluindo antenas e para-raios',
          'Planta de situação e cortes', DOC.artProjeto,
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Concessionárias
  {
    sigla: 'ENERGISA',
    ambito: 'Concessionária',
    nome: 'Energisa Paraíba',
    descricao: 'Viabilidade de atendimento de energia e aprovação de projetos elétricos de empreendimentos.',
    servicos: [
      {
        codigo: 'energisa-viabilidade',
        nome: 'Consulta de Viabilidade de Atendimento (carga)',
        descricao: 'Confirma se a rede atende a carga do empreendimento e quais obras são necessárias.',
        semModelosComuns: true,
        modelos: ['procuracao', 'solicitacao-viabilidade'],
        documentos: [DOC.identidade, DOC.localizacao, 'Quadro de cargas / cálculo de demanda', DOC.artProjeto],
      },
      {
        codigo: 'energisa-projeto',
        nome: 'Aprovação de Projeto Elétrico (rede, subestação ou entrada coletiva)',
        descricao: 'Análise do projeto elétrico de loteamentos, condomínios e edificações com carga elevada.',
        modelos: ['memorial-descritivo', 'termo-responsabilidade-tecnica'],
        documentos: [
          DOC.identidade, 'Carta de viabilidade da Energisa',
          'Projeto elétrico com memorial de cálculo', DOC.artProjeto,
        ],
      },
    ],
  },
];

const SERVICOS = new Map();
for (const orgao of ORGAOS) {
  for (const servico of orgao.servicos) {
    SERVICOS.set(servico.codigo, { ...servico, orgao: orgao.sigla, orgaoNome: orgao.nome, ambito: orgao.ambito });
  }
}

const STATUS = {
  recebido: { rotulo: 'Recebido', descricao: 'Pedido recebido; aguardando conferência.' },
  em_analise: { rotulo: 'Em análise documental', descricao: 'Os documentos estão sendo conferidos.' },
  pendencia_cliente: { rotulo: 'Pendência do cliente', descricao: 'Precisamos de documentos ou informações suas.' },
  protocolado: { rotulo: 'Protocolado no órgão', descricao: 'Pedido protocolado; aguardando análise do órgão.' },
  exigencia_orgao: { rotulo: 'Exigência do órgão', descricao: 'O órgão fez exigências; estamos respondendo.' },
  deferido: { rotulo: 'Deferido', descricao: 'Licença/documento emitido.' },
  indeferido: { rotulo: 'Indeferido', descricao: 'O órgão negou o pedido. Veja as observações.' },
  cancelado: { rotulo: 'Cancelado', descricao: 'Pedido cancelado.' },
};

const STATUS_FINAIS = new Set(['deferido', 'indeferido', 'cancelado']);

// Cidades com mais demanda primeiro; o campo aceita qualquer município da PB.
const MUNICIPIOS_SUGERIDOS = [
  'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cabedelo',
  'Cajazeiras', 'Guarabira', 'Sapé', 'Mamanguape', 'Queimadas', 'Conde', 'Pombal',
  'Monteiro', 'Esperança', 'Catolé do Rocha', 'Itabaiana', 'Lucena', 'Pitimbu',
];

module.exports = { ORGAOS, SERVICOS, STATUS, STATUS_FINAIS, MUNICIPIOS_SUGERIDOS };

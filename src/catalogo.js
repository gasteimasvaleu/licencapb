// Catálogo de órgãos estaduais da Paraíba e dos serviços que a plataforma
// protocola em nome do cliente. As listas de documentos são o ponto de partida
// do checklist de cada pedido; a equipe pode pedir documentos extras ao longo
// da análise. Requisitos mudam com portarias e normas técnicas: revise este
// arquivo periodicamente com os sites e atendimentos de cada órgão.

const DOCS_COMUNS = {
  docIdentidade: 'Documento de identificação do requerente (RG/CNH) ou contrato social e cartão CNPJ',
  docImovel: 'Comprovante de propriedade ou posse do imóvel (certidão de inteiro teor, escritura ou contrato)',
  artRrt: 'ART (CREA-PB) ou RRT (CAU/PB) do responsável técnico pelo projeto',
  procuracao: 'Procuração do proprietário autorizando a plataforma a protocolar em seu nome',
  localizacao: 'Planta de localização/situação com coordenadas geográficas (UTM ou lat/long)',
};

const ORGAOS = [
  {
    sigla: 'SUDEMA',
    nome: 'Superintendência de Administração do Meio Ambiente',
    descricao: 'Licenciamento ambiental estadual de obras e empreendimentos potencialmente poluidores.',
    servicos: [
      {
        codigo: 'sudema-lp',
        nome: 'Licença Prévia (LP)',
        descricao: 'Aprova a localização e a concepção do empreendimento na fase de planejamento.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          'Certidão da prefeitura declarando conformidade com a legislação de uso e ocupação do solo',
          DOCS_COMUNS.localizacao,
          'Memorial descritivo do empreendimento',
          'Estudo ambiental exigido pelo enquadramento (RAS, RCA/PCA ou EIA/RIMA, conforme o caso)',
          DOCS_COMUNS.artRrt,
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
        ],
      },
      {
        codigo: 'sudema-li',
        nome: 'Licença de Instalação (LI)',
        descricao: 'Autoriza o início da obra conforme os projetos aprovados.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Cópia da Licença Prévia vigente',
          'Projeto executivo e memorial descritivo',
          'Planos e programas ambientais exigidos nas condicionantes da LP',
          DOCS_COMUNS.artRrt,
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
        ],
      },
      {
        codigo: 'sudema-lo',
        nome: 'Licença de Operação (LO)',
        descricao: 'Autoriza o funcionamento após verificação das condicionantes da LI.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Cópia da Licença de Instalação vigente',
          'Relatório de cumprimento das condicionantes da LI',
          'Relatório fotográfico da obra concluída',
          'Comprovante de publicação do pedido de licença (jornal e/ou Diário Oficial)',
        ],
      },
      {
        codigo: 'sudema-renovacao-lo',
        nome: 'Renovação de Licença de Operação',
        descricao: 'Renovação da LO, que deve ser requerida antes do vencimento da licença vigente.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Cópia da Licença de Operação vigente',
          'Relatório de cumprimento das condicionantes da LO',
          'Comprovante de publicação do pedido de renovação',
        ],
      },
      {
        codigo: 'sudema-supressao',
        nome: 'Autorização de Supressão de Vegetação',
        descricao: 'Necessária quando a obra exige remoção de vegetação nativa.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          'Inventário florestal / levantamento da vegetação',
          'Planta com a poligonal da área a ser suprimida (arquivo georreferenciado)',
          'Inscrição do imóvel no CAR (se rural)',
          DOCS_COMUNS.artRrt,
        ],
      },
    ],
  },
  {
    sigla: 'CBMPB',
    nome: 'Corpo de Bombeiros Militar da Paraíba',
    descricao: 'Segurança contra incêndio e pânico em edificações.',
    servicos: [
      {
        codigo: 'cbmpb-projeto',
        nome: 'Análise de Projeto de Prevenção e Combate a Incêndio',
        descricao: 'Aprovação do projeto de segurança contra incêndio e pânico antes da execução.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Projeto de prevenção e combate a incêndio (plantas, cortes e detalhes)',
          'Memorial descritivo e de cálculo dos sistemas de prevenção',
          DOCS_COMUNS.artRrt,
          'Comprovante de pagamento da taxa de análise',
        ],
      },
      {
        codigo: 'cbmpb-vistoria',
        nome: 'Vistoria e Certificado de Aprovação',
        descricao: 'Vistoria da edificação concluída para emissão do certificado do Corpo de Bombeiros.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Cópia do projeto aprovado pelo CBMPB',
          'ART/RRT de execução das instalações de prevenção',
          'Laudos e certificados dos sistemas instalados (extintores, hidrantes, SPDA, gás, etc.)',
          'Comprovante de pagamento da taxa de vistoria',
        ],
      },
    ],
  },
  {
    sigla: 'AESA',
    nome: 'Agência Executiva de Gestão das Águas da Paraíba',
    descricao: 'Outorga de uso de recursos hídricos e licença de obras hídricas.',
    servicos: [
      {
        codigo: 'aesa-outorga',
        nome: 'Outorga de Direito de Uso de Recursos Hídricos',
        descricao: 'Para captação de água subterrânea (poço) ou superficial, e lançamento de efluentes.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          DOCS_COMUNS.localizacao,
          'Formulário técnico de outorga com vazões e regime de uso',
          'Perfil construtivo e teste de vazão do poço (quando subterrânea)',
          DOCS_COMUNS.artRrt,
        ],
      },
      {
        codigo: 'aesa-obra-hidrica',
        nome: 'Licença de Obra Hídrica',
        descricao: 'Para perfuração de poços, barragens, açudes e intervenções em corpos d\'água.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          DOCS_COMUNS.localizacao,
          'Projeto da obra hídrica e memorial descritivo',
          DOCS_COMUNS.artRrt,
        ],
      },
    ],
  },
  {
    sigla: 'IPHAEP',
    nome: 'Instituto do Patrimônio Histórico e Artístico do Estado da Paraíba',
    descricao: 'Obras em bens tombados ou em áreas de preservação de interesse estadual.',
    servicos: [
      {
        codigo: 'iphaep-projeto',
        nome: 'Análise de Projeto em Área de Preservação',
        descricao: 'Construção, reforma ou demolição em imóvel tombado ou em seu entorno.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          'Levantamento arquitetônico e fotográfico do estado atual',
          'Projeto arquitetônico proposto (plantas, cortes, fachadas)',
          'Memorial descritivo e justificativo da intervenção',
          DOCS_COMUNS.artRrt,
        ],
      },
    ],
  },
  {
    sigla: 'DER-PB',
    nome: 'Departamento de Estradas de Rodagem da Paraíba',
    descricao: 'Intervenções em rodovias estaduais e suas faixas de domínio.',
    servicos: [
      {
        codigo: 'der-acesso',
        nome: 'Autorização de Acesso / Uso de Faixa de Domínio',
        descricao: 'Acesso a rodovia estadual, travessias e ocupação da faixa de domínio.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.docImovel,
          'Projeto geométrico do acesso ou da interferência, com sinalização',
          DOCS_COMUNS.localizacao,
          DOCS_COMUNS.artRrt,
        ],
      },
    ],
  },
  {
    sigla: 'CAGEPA',
    nome: 'Companhia de Água e Esgotos da Paraíba',
    descricao: 'Viabilidade e aprovação de ligações e redes de água e esgoto.',
    servicos: [
      {
        codigo: 'cagepa-viabilidade',
        nome: 'Carta de Viabilidade Técnica (água e esgoto)',
        descricao: 'Confirma se a rede atende o empreendimento; costuma ser exigida pela prefeitura e pela SUDEMA.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          DOCS_COMUNS.localizacao,
          'Quadro de áreas e número de unidades / população estimada',
          'Estimativa de consumo de água e vazão de esgoto',
        ],
      },
      {
        codigo: 'cagepa-projeto',
        nome: 'Aprovação de Projeto Hidrossanitário de Empreendimento',
        descricao: 'Redes de água e esgoto de loteamentos e condomínios a serem interligadas ao sistema.',
        documentos: [
          DOCS_COMUNS.procuracao,
          DOCS_COMUNS.docIdentidade,
          'Carta de viabilidade técnica emitida pela CAGEPA',
          'Projeto das redes de água e esgoto com memorial de cálculo',
          DOCS_COMUNS.artRrt,
        ],
      },
    ],
  },
];

const SERVICOS = new Map();
for (const orgao of ORGAOS) {
  for (const servico of orgao.servicos) {
    SERVICOS.set(servico.codigo, { ...servico, orgao: orgao.sigla, orgaoNome: orgao.nome });
  }
}

const STATUS = {
  recebido: { rotulo: 'Recebido', descricao: 'Pedido recebido; aguardando conferência da equipe.' },
  em_analise: { rotulo: 'Em análise documental', descricao: 'Nossa equipe está conferindo os documentos.' },
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

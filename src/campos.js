// Campos usados pelos modelos de documentos. Os de fonte 'pedido' vêm das
// colunas do pedido; os demais ficam em pedidos.dados (JSON) e são editados
// na tela "Dados para os documentos". O formulário mostra apenas os campos
// que os modelos do serviço realmente usam.

const GRUPOS = [
  'Requerente', 'Procurador', 'Responsável técnico', 'Imóvel', 'Empreendimento',
  'Infraestrutura', 'Recursos hídricos', 'Segurança contra incêndio', 'Ambiental', 'Patrimônio',
  'Assinatura',
];

const CAMPOS = [
  // Requerente
  { id: 'proprietario', grupo: 'Requerente', rotulo: 'Nome ou razão social do requerente', fonte: 'pedido' },
  { id: 'proprietario_doc', grupo: 'Requerente', rotulo: 'CPF ou CNPJ do requerente', fonte: 'pedido' },
  { id: 'req_nacionalidade', grupo: 'Requerente', rotulo: 'Nacionalidade (pessoa física)', padrao: 'brasileiro(a)' },
  { id: 'req_estado_civil', grupo: 'Requerente', rotulo: 'Estado civil (pessoa física)' },
  { id: 'req_profissao', grupo: 'Requerente', rotulo: 'Profissão (pessoa física)' },
  { id: 'req_rg', grupo: 'Requerente', rotulo: 'RG e órgão emissor (pessoa física)' },
  { id: 'req_endereco', grupo: 'Requerente', rotulo: 'Endereço completo do requerente (residência ou sede), com CEP' },
  { id: 'req_representante_nome', grupo: 'Requerente', rotulo: 'Representante legal (pessoa jurídica)' },
  { id: 'req_representante_cpf', grupo: 'Requerente', rotulo: 'CPF do representante legal' },
  { id: 'req_representante_cargo', grupo: 'Requerente', rotulo: 'Cargo do representante (ex.: sócio-administrador)' },
  { id: 'req_email', grupo: 'Requerente', rotulo: 'E-mail do requerente', tipo: 'email' },
  { id: 'req_telefone', grupo: 'Requerente', rotulo: 'Telefone do requerente' },

  // Procurador (a empresa/equipe que protocola)
  { id: 'proc_nome', grupo: 'Procurador', rotulo: 'Procurador (nome ou razão social)', padraoEnv: 'PLATAFORMA_NOME' },
  { id: 'proc_doc', grupo: 'Procurador', rotulo: 'CPF/CNPJ do procurador', padraoEnv: 'PLATAFORMA_CNPJ' },
  { id: 'proc_endereco', grupo: 'Procurador', rotulo: 'Endereço do procurador', padraoEnv: 'PLATAFORMA_ENDERECO' },

  // Responsável técnico
  { id: 'rt_nome', grupo: 'Responsável técnico', rotulo: 'Nome do responsável técnico' },
  { id: 'rt_titulo', grupo: 'Responsável técnico', rotulo: 'Título profissional (ex.: Engenheiro Civil, Arquiteto e Urbanista)' },
  { id: 'rt_registro', grupo: 'Responsável técnico', rotulo: 'Registro no CREA-PB ou CAU/PB' },
  { id: 'rt_art', grupo: 'Responsável técnico', rotulo: 'Número da ART/RRT' },
  { id: 'rt_contato', grupo: 'Responsável técnico', rotulo: 'E-mail e telefone do responsável técnico' },

  // Imóvel
  { id: 'endereco', grupo: 'Imóvel', rotulo: 'Endereço da obra', fonte: 'pedido' },
  { id: 'municipio', grupo: 'Imóvel', rotulo: 'Município da obra', fonte: 'pedido' },
  { id: 'imovel_bairro_cep', grupo: 'Imóvel', rotulo: 'Bairro e CEP da obra' },
  { id: 'imovel_matricula', grupo: 'Imóvel', rotulo: 'Matrícula do imóvel' },
  { id: 'imovel_cartorio', grupo: 'Imóvel', rotulo: 'Cartório de registro de imóveis' },
  { id: 'imovel_inscricao', grupo: 'Imóvel', rotulo: 'Inscrição imobiliária municipal (IPTU) ou CCIR/CAR, se rural' },
  { id: 'coordenadas', grupo: 'Imóvel', rotulo: 'Coordenadas geográficas (lat/long ou UTM, com datum SIRGAS 2000)' },
  { id: 'area_terreno', grupo: 'Imóvel', rotulo: 'Área do terreno (m²)' },

  // Empreendimento
  { id: 'titulo_obra', grupo: 'Empreendimento', rotulo: 'Nome do empreendimento', fonte: 'pedido' },
  { id: 'area_m2', grupo: 'Empreendimento', rotulo: 'Área construída (m²)', fonte: 'pedido' },
  { id: 'atividade', grupo: 'Empreendimento', rotulo: 'Atividade / tipologia (ex.: edifício residencial multifamiliar)' },
  { id: 'tipo_intervencao', grupo: 'Empreendimento', rotulo: 'Tipo de intervenção (construção nova, ampliação, reforma, demolição)' },
  { id: 'pavimentos', grupo: 'Empreendimento', rotulo: 'Número de pavimentos' },
  { id: 'altura', grupo: 'Empreendimento', rotulo: 'Altura da edificação (m)' },
  { id: 'unidades', grupo: 'Empreendimento', rotulo: 'Número de unidades (apartamentos, lotes, salas)' },
  { id: 'populacao', grupo: 'Empreendimento', rotulo: 'População estimada (pessoas)' },
  { id: 'investimento', grupo: 'Empreendimento', rotulo: 'Valor estimado do investimento (R$)' },
  { id: 'prazo_obra', grupo: 'Empreendimento', rotulo: 'Prazo estimado da obra' },
  { id: 'descricao', grupo: 'Empreendimento', rotulo: 'Descrição geral do empreendimento', tipo: 'texto' },

  // Infraestrutura
  { id: 'abastecimento_agua', grupo: 'Infraestrutura', rotulo: 'Abastecimento de água (rede CAGEPA, poço, etc.)' },
  { id: 'esgotamento', grupo: 'Infraestrutura', rotulo: 'Esgotamento sanitário (rede pública, fossa e sumidouro, ETE própria)' },
  { id: 'drenagem', grupo: 'Infraestrutura', rotulo: 'Drenagem de águas pluviais' },
  { id: 'residuos', grupo: 'Infraestrutura', rotulo: 'Gestão dos resíduos da obra e da operação', tipo: 'texto' },
  { id: 'consumo_agua', grupo: 'Infraestrutura', rotulo: 'Consumo médio de água estimado (m³/dia)' },
  { id: 'vazao_esgoto', grupo: 'Infraestrutura', rotulo: 'Vazão de esgoto estimada (m³/dia)' },
  { id: 'carga_instalada', grupo: 'Infraestrutura', rotulo: 'Carga instalada (kW)' },
  { id: 'demanda', grupo: 'Infraestrutura', rotulo: 'Demanda estimada (kVA)' },
  { id: 'data_ligacao', grupo: 'Infraestrutura', rotulo: 'Data prevista para ligação' },

  // Recursos hídricos
  { id: 'agua_captacao', grupo: 'Recursos hídricos', rotulo: 'Tipo de captação (poço tubular, poço amazonas, rio, açude, lançamento de efluente)' },
  { id: 'agua_finalidade', grupo: 'Recursos hídricos', rotulo: 'Finalidade do uso (consumo humano, obra, irrigação, industrial)' },
  { id: 'agua_vazao', grupo: 'Recursos hídricos', rotulo: 'Vazão requerida (m³/h)' },
  { id: 'agua_horas', grupo: 'Recursos hídricos', rotulo: 'Horas de uso por dia' },
  { id: 'agua_dias', grupo: 'Recursos hídricos', rotulo: 'Dias de uso por mês' },
  { id: 'agua_corpo', grupo: 'Recursos hídricos', rotulo: 'Corpo hídrico / aquífero e bacia hidrográfica' },
  { id: 'agua_obra', grupo: 'Recursos hídricos', rotulo: 'Características da obra hídrica (profundidade, diâmetro, barramento, etc.)', tipo: 'texto' },

  // Incêndio
  { id: 'inc_ocupacao', grupo: 'Segurança contra incêndio', rotulo: 'Ocupação/uso, grupo e divisão (classificação das normas do CBMPB)' },
  { id: 'inc_carga', grupo: 'Segurança contra incêndio', rotulo: 'Carga de incêndio (MJ/m²)' },
  { id: 'inc_lotacao', grupo: 'Segurança contra incêndio', rotulo: 'Lotação / população máxima' },
  { id: 'inc_medidas', grupo: 'Segurança contra incêndio', rotulo: 'Medidas de segurança (uma por linha: medida — descrição)', tipo: 'texto' },

  // Ambiental
  { id: 'amb_licenca_anterior', grupo: 'Ambiental', rotulo: 'Número e validade da licença anterior' },
  { id: 'amb_condicionantes', grupo: 'Ambiental', rotulo: 'Condicionantes da licença (uma por linha)', tipo: 'texto' },
  { id: 'amb_cumprimento', grupo: 'Ambiental', rotulo: 'Como cada condicionante foi cumprida (uma por linha, na mesma ordem)', tipo: 'texto' },
  { id: 'amb_vegetacao', grupo: 'Ambiental', rotulo: 'Área de supressão (ha), tipo de vegetação e justificativa', tipo: 'texto' },
  { id: 'jornal_publicacao', grupo: 'Ambiental', rotulo: 'Jornal de grande circulação onde será publicado' },

  // Patrimônio
  { id: 'pat_bem', grupo: 'Patrimônio', rotulo: 'Bem tombado ou área de preservação em que se insere o imóvel' },
  { id: 'pat_estado_atual', grupo: 'Patrimônio', rotulo: 'Estado atual do imóvel', tipo: 'texto' },
  { id: 'pat_intervencao', grupo: 'Patrimônio', rotulo: 'Intervenção proposta', tipo: 'texto' },
  { id: 'pat_justificativa', grupo: 'Patrimônio', rotulo: 'Justificativa e critérios de preservação adotados', tipo: 'texto' },

  // Assinatura
  { id: 'local_assinatura', grupo: 'Assinatura', rotulo: 'Cidade onde os documentos serão assinados' },
];

const CAMPOS_POR_ID = new Map(CAMPOS.map((c) => [c.id, c]));

module.exports = { GRUPOS, CAMPOS, CAMPOS_POR_ID };

# LicençaPB

Plataforma web para construtores, arquitetos e engenheiros da Paraíba
**terceirizarem a emissão de licenças estaduais**. O profissional abre o
pedido e envia os documentos. A equipe da plataforma (o "despachante")
confere tudo, protocola no órgão, responde às exigências e entrega a licença
emitida pelo próprio painel.

## Órgãos e serviços no catálogo

| Âmbito | Órgão | Serviços |
|---|---|---|
| Estadual | SUDEMA | LP, LI, LO, renovação de LO, autorização de supressão de vegetação |
| Estadual | CBMPB (Bombeiros) | Análise de projeto de incêndio, vistoria e certificado de aprovação |
| Estadual | AESA | Outorga de uso de água, licença de obra hídrica |
| Estadual | IPHAEP | Projeto em área de preservação / imóvel tombado |
| Estadual | DER-PB | Acesso e uso da faixa de domínio de rodovia estadual |
| Estadual | CAGEPA | Carta de viabilidade técnica, aprovação de projeto hidrossanitário |
| Municipal | Prefeitura | Certidão de uso do solo, alvará de construção, habite-se |
| Federal | Receita Federal | Inscrição no CNO, regularização da obra e CND para averbação |
| Federal | IPHAN | Intervenção em bem tombado federal ou entorno |
| Federal | SPU | Obras em imóvel da União (terreno de marinha) |
| Federal | DECEA | Análise de objeto projetado no espaço aéreo (OPEA) |
| Concessionária | Energisa Paraíba | Viabilidade de carga, aprovação de projeto elétrico |

O checklist de cada serviço fica em `src/catalogo.js`. Os documentos ali são
uma referência e **precisam ser validados com cada órgão antes de entrar em
produção**: portarias, taxas e formulários mudam.

## Modelos de documentos gerados automaticamente

O cliente preenche **uma tela de dados** por pedido (só com os campos que os
modelos daquele serviço usam, já adaptada para pessoa física ou jurídica) e a
plataforma gera os documentos prontos para assinar, em HTML para
imprimir/salvar em PDF ou em Word:

| Modelo | Usado em |
|---|---|
| Procuração particular | Todos os serviços com protocolo em nome do cliente |
| Requerimento ao órgão | Todos, adaptado ao órgão e ao serviço |
| Declaração de veracidade | Todos |
| Termo de responsabilidade técnica | Serviços com projeto/estudo técnico |
| Memorial descritivo do empreendimento | SUDEMA, AESA, DER-PB, CAGEPA, prefeitura, SPU, DECEA, Energisa |
| Texto para publicação do pedido de licença | SUDEMA |
| Relatório de cumprimento de condicionantes | SUDEMA (LI, LO, renovação) |
| Justificativa técnica de supressão de vegetação | SUDEMA |
| Ficha técnica de uso de recursos hídricos | AESA |
| Carta de solicitação de viabilidade | CAGEPA, Energisa |
| Memorial de segurança contra incêndio | CBMPB |
| Memorial justificativo de intervenção em patrimônio | IPHAEP, IPHAN |

Campos em branco aparecem destacados em amarelo no documento e são contados
como pendências no pedido. Os modelos que precisam de assinatura entram
automaticamente no checklist ("— assinado"). Os modelos ficam em
`src/modelos.js` e os campos em `src/campos.js`.

**Os textos são modelos de referência**: revise-os com um advogado e confira
se o órgão exige formulário próprio antes de usá-los com clientes.

## Inteligência artificial (Claude)

Com `ANTHROPIC_API_KEY` configurada, a plataforma usa o Claude (modelo
`claude-opus-5-5`) para:

- **Redigir os textos técnicos**: na tela de dados, o botão "Redigir com IA"
  escreve os campos de texto ainda vazios (descrição do empreendimento,
  memoriais, justificativas, medidas de incêndio, etc.) a partir dos dados já
  informados. Nada já preenchido é sobrescrito; onde falta informação, a IA
  deixa um marcador `[informar ...]` em vez de inventar. O cliente revisa.
- **Conferir os documentos enviados**: cada PDF/JPG/PNG enviado no checklist
  é analisado em segundo plano. O parecer ("parece correto", "pontos de
  atenção" ou "não corresponde ao item", com a lista de problemas, como CNPJ
  divergente ou validade vencida) aparece no pedido para o cliente e para a
  equipe. A aprovação continua sendo da equipe.

As chamadas usam saída estruturada (JSON validado) e *fallback* automático de
modelo em caso de recusa. Sem a chave, o app funciona normalmente sem esses
recursos (`IA_ATIVA=0` também desliga). Código em `src/ia.js`.

**Validação da chave:** ao iniciar, o servidor confere a chave consultando o
modelo configurado na API de modelos (não consome tokens). Chave inválida,
sem permissão, com espaços/aspas ou modelo indisponível desligam a IA com uma
mensagem no log; falhas passageiras (rede, 5xx) mantêm a IA ativa com um
aviso. Para conferir a chave sem subir o servidor: `npm run validar-chave`.

## Funcionalidades

- **Cliente:** cadastro com CREA/CAU, abertura de pedido, checklist de
  documentos com upload, acompanhamento do status, nº de protocolo, previsão,
  mensagens com a equipe e download da licença emitida.
- **Equipe:** fila de pedidos ativos, aprovação/rejeição de documentos (com
  motivo), solicitação de documentos extras, mudança de status
  (recebido → em análise → pendência → protocolado → exigência → deferido/indeferido),
  registro de protocolo e anexação do documento emitido.
- Histórico completo de cada pedido; o cliente só vê os próprios pedidos.
- Segurança: senhas com scrypt, sessão em cookie httpOnly, proteção CSRF,
  validação de tipo e tamanho dos arquivos (25 MB), downloads autorizados por pedido.

## Como rodar

Requer Node.js 22.13 ou superior (usa o SQLite embutido, `node:sqlite`).

```bash
npm install
OPERADOR_EMAIL=equipe@suaempresa.com.br OPERADOR_SENHA='troque-esta-senha' npm start
# http://localhost:3000
npm test
```

| Variável | Uso |
|---|---|
| `PORT` | Porta HTTP (padrão 3000) |
| `DATA_DIR` | Pasta do banco e dos uploads (padrão `./dados`) |
| `OPERADOR_EMAIL` / `OPERADOR_SENHA` / `OPERADOR_NOME` | Cria o primeiro usuário da equipe |
| `NODE_ENV=production` | Cookies só via HTTPS |
| `ANTHROPIC_API_KEY` | Ativa os recursos de IA |
| `IA_MODELO` | Modelo do Claude (padrão `claude-opus-5-5`) |
| `PLATAFORMA_NOME` / `PLATAFORMA_CNPJ` / `PLATAFORMA_ENDERECO` | Dados da empresa que aparece como procuradora nos documentos |

## Próximos passos sugeridos

- Fila para o Claude Cowork protocolar nos sites dos órgãos e acompanhar o andamento.
- Notificações por e-mail/WhatsApp a cada mudança de status.
- Pagamento online (honorários + taxas dos órgãos, ex.: DAE).
- Assinatura digital (gov.br / ICP-Brasil) da procuração.
- Serviços municipais (alvará de construção, habite-se) começando por
  João Pessoa e Campina Grande.
- Armazenamento de arquivos em object storage (S3) e backups do banco.

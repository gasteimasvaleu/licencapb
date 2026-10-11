# LicençaPB

Plataforma web para construtores, arquitetos e engenheiros da Paraíba
**terceirizarem a emissão de licenças estaduais**. O profissional abre o
pedido e envia os documentos. A equipe da plataforma (o "despachante")
confere tudo, protocola no órgão, responde às exigências e entrega a licença
emitida pelo próprio painel.

## Órgãos e serviços no catálogo

| Órgão | Serviços |
|---|---|
| SUDEMA | LP, LI, LO, renovação de LO, autorização de supressão de vegetação |
| CBMPB (Bombeiros) | Análise de projeto de incêndio, vistoria e certificado de aprovação |
| AESA | Outorga de uso de água, licença de obra hídrica |
| IPHAEP | Projeto em área de preservação / imóvel tombado |
| DER-PB | Acesso e uso da faixa de domínio de rodovia estadual |
| CAGEPA | Carta de viabilidade técnica, aprovação de projeto hidrossanitário |

O checklist de cada serviço fica em `src/catalogo.js`. Os documentos ali são
uma referência e **precisam ser validados com cada órgão antes de entrar em
produção**: portarias, taxas e formulários mudam.

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

## Próximos passos sugeridos

- Notificações por e-mail/WhatsApp a cada mudança de status.
- Pagamento online (honorários + taxas dos órgãos, ex.: DAE).
- Assinatura digital (gov.br / ICP-Brasil) da procuração.
- Serviços municipais (alvará de construção, habite-se) começando por
  João Pessoa e Campina Grande.
- Armazenamento de arquivos em object storage (S3) e backups do banco.

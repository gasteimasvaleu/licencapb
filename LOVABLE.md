# Recriar o LicençaPB no Lovable

O Lovable não roda este código (Node/Express + SQLite). O caminho é recriar o
app lá, em React + Supabase (Lovable Cloud), colando os prompts abaixo **um de
cada vez**, esperando cada etapa ficar pronta e testando antes de seguir.

Os textos do catálogo e dos modelos de documentos já estão prontos neste
repositório. Quando um prompt pedir, abra o arquivo no GitHub
(github.com/gasteimasvaleu/licencapb), clique em **Raw**, copie tudo e cole no
chat do Lovable junto com o prompt.

---

## Prompt 1 — Base, login e banco

```
Crie o app "LicençaPB": plataforma para construtores, arquitetos e engenheiros
da Paraíba terceirizarem a emissão de licenças de obras (SUDEMA, Bombeiros,
AESA, IPHAEP, DER-PB, CAGEPA, prefeituras, Receita Federal, IPHAN, SPU, DECEA,
Energisa). O cliente abre um pedido e envia documentos; a nossa equipe confere,
protocola no órgão e entrega a licença pelo painel. Tudo em português do Brasil.

Use Lovable Cloud (Supabase) com autenticação por e-mail e senha.

Papéis: "cliente" (padrão no cadastro) e "operador" (equipe). Guarde o papel
numa tabela user_roles, nunca no perfil editável pelo usuário.

Tabelas:
- profiles: id (= auth.users), nome, telefone, profissao (Engenheiro(a),
  Arquiteto(a), Construtora, Outro), registro_profissional (CREA/CAU).
- pedidos: id, cliente_id, servico_codigo, status, titulo_obra, municipio,
  endereco, proprietario, proprietario_doc (CPF/CNPJ), area_m2, observacoes,
  protocolo_orgao, previsao (data), responsavel_id, dados (jsonb, padrão {}),
  criado_em, atualizado_em.
- documentos: id, pedido_id, item (texto), origem (checklist | extra | emitido),
  modelo (texto, opcional), situacao (pendente | enviado | aprovado | rejeitado),
  nota, arquivo_nome, arquivo_path, ia_situacao, ia_parecer (jsonb), atualizado_em.
- eventos: id, pedido_id, autor_id, tipo (sistema | status | mensagem | documento),
  texto, criado_em.

Status do pedido: recebido, em_analise, pendencia_cliente, protocolado, exigencia_orgao,
deferido, indeferido, cancelado (deferido, indeferido e cancelado são finais).

Segurança (RLS): o cliente só vê e altera os próprios pedidos, documentos e
eventos; o operador vê tudo. Arquivos num bucket privado "documentos", na pasta
do pedido, com as mesmas regras.

Páginas: início (apresentação + botão cadastrar), cadastro, entrar, e um
painel do cliente vazio por enquanto.
```

## Prompt 2 — Catálogo de serviços

Cole junto o conteúdo de `src/catalogo.js`.

```
Este é o catálogo de órgãos e serviços (arquivo abaixo). Converta para
src/data/catalogo.ts mantendo todos os órgãos, serviços, descrições e listas
de documentos exatamente como estão. Crie a página "Serviços" listando por
âmbito (Estadual, Municipal, Federal, Concessionária) e órgão, com botão
"Solicitar" em cada serviço.

[cole aqui o conteúdo de src/catalogo.js]
```

## Prompt 3 — Pedidos (cliente)

```
Crie o fluxo de pedidos do cliente:
- "Novo pedido": escolhe o serviço do catálogo e preenche obra, município,
  endereço, proprietário e CPF/CNPJ (validar 11 ou 14 dígitos), área e
  observações. Ao criar: insere um documento "checklist" para cada item do
  serviço, um documento "emitido" com o nome do serviço, e um evento
  "Pedido aberto".
- Painel do cliente: lista dos pedidos com status, progresso
  (documentos aprovados / total) e última atualização.
- Página do pedido: dados, status, protocolo, previsão; checklist com upload
  de arquivo por item (pdf, jpg, png, dwg, dxf, zip, kml, kmz; até 25 MB),
  situação e nota de cada item; histórico de eventos; campo de mensagem para
  a equipe; download do documento emitido quando existir.
- O cliente não pode reenviar item já aprovado nem enviar o item "emitido".
```

## Prompt 4 — Painel da equipe

```
Crie a área do operador:
- Fila de pedidos (padrão: ativos, mais antigos primeiro), com filtro por
  status e "todos".
- Na página do pedido o operador pode: mudar status, registrar protocolo e
  previsão (cada mudança gera evento); aprovar ou rejeitar documentos (rejeição
  exige nota explicando o motivo); solicitar documento extra; anexar o
  documento emitido (o cliente vê e baixa).
- O primeiro operador eu crio manualmente; me diga como marcar meu usuário
  como operador.
```

## Prompt 5 — Modelos de documentos

Cole junto o conteúdo de `src/campos.js` e `src/modelos.js` (se o Lovable
reclamar do tamanho, mande `campos.js` primeiro e `modelos.js` na mensagem
seguinte).

```
Implemente os modelos de documentos gerados automaticamente, a partir dos
arquivos abaixo (campos e textos dos modelos). Para cada pedido:
- Tela "Dados para os documentos" mostrando só os campos usados pelos modelos
  daquele serviço, agrupados, salvos em pedidos.dados.
- Cada modelo abre numa página pronta para imprimir/salvar em PDF; campos em
  branco aparecem destacados em amarelo.
Mantenha os textos dos modelos exatamente como estão.

[cole aqui src/campos.js e src/modelos.js]
```

## Prompt 6 — IA com Claude (é aqui que entra a chave)

```
Adicione IA com a API da Anthropic (Claude), sempre numa Edge Function do
Supabase, nunca no navegador. Use o secret ANTHROPIC_API_KEY e o modelo
claude-opus-5-5.

1. Edge function "validar-chave": chama GET https://api.anthropic.com/v1/models/claude-opus-5-5
   com os headers x-api-key e anthropic-version: 2023-06-01. Responde
   { ok: true } ou { ok: false, motivo } (401 = chave inválida, 403 = sem
   permissão, 404 = modelo indisponível). Mostre o resultado numa página
   "Configurações" visível só para operadores, com botão "Testar chave".
2. Botão "Redigir com IA" na tela de dados: preenche só os campos de texto
   vazios a partir dos dados do pedido, sem inventar números ou normas
   (usar marcador [informar ...] quando faltar dado).
3. Ao enviar PDF/JPG/PNG no checklist, conferir o arquivo e salvar em
   ia_situacao (ok | atencao | incompativel) e ia_parecer (resumo e lista de
   problemas). Mostrar o parecer no item. A aprovação continua com a equipe.
```

Quando o Lovable pedir a chave, ele abre um formulário para guardar o secret
`ANTHROPIC_API_KEY`: cole a chave **lá**, nunca no chat. Depois use o botão
"Testar chave" na página Configurações.

## Prompt 7 — Fila do Cowork

```
Crie a página "Fila do Cowork" (rota /equipe/cowork), visível só para
operadores. Ela será usada por um agente de IA (Claude Cowork) que opera o
navegador como um funcionário, então precisa ser simples, sem menus escondidos,
modais ou rolagem infinita: tudo em texto visível, com rótulos claros.

1. Sites dos órgãos (configurável)
   - Crie a tabela orgaos_config: sigla (chave), site_protocolo (URL),
     site_consulta (URL), forma_protocolo (online | email | presencial),
     instrucoes (texto livre). RLS: só operadores leem e editam.
   - Na página "Configurações", uma seção "Órgãos" com uma linha por órgão do
     catálogo para o operador preencher esses campos. Não invente URLs: deixe
     em branco até o operador preencher.

2. Lista "Prontos para protocolar"
   Mostre os pedidos que cumprem TODAS as condições:
   - status recebido, em_analise ou pendencia_cliente;
   - todos os documentos de origem checklist e extra com situacao = aprovado
     (o documento de origem emitido não conta);
   - pelo menos um documento.
   Ordene do mais antigo para o mais novo.

   Para cada pedido, um cartão com:
   - Nº do pedido, órgão e serviço, data de abertura.
   - Obra, município, endereço, área.
   - Requerente (nome e CPF/CNPJ) e o cliente responsável (nome, e-mail, telefone,
     CREA/CAU).
   - Órgão: site de protocolo, forma de protocolo e instruções (de
     orgaos_config). Se o site não estiver configurado, mostrar em destaque
     "Site do órgão não configurado".
   - Lista de documentos aprovados: nome do item + link de download do arquivo
     (URL assinada do storage, válida por 1 hora, gerada ao abrir a página) +
     nome original do arquivo.
   - Links para os modelos gerados (procuração, requerimento etc.) do pedido.
   - Campos e botões de ação:
     a) "Registrar protocolo": campos nº de protocolo e previsão (data).
        Salva no pedido, muda o status para protocolado e registra evento
        "Protocolado no órgão: <nº> (Cowork)".
     b) "Precisa de ajuda humana": campo de texto obrigatório com o motivo
        (ex.: login gov.br, certificado digital, captcha, pagamento de taxa).
        Registra evento e marca o pedido com a flag aguardando_humano = true
        (nova coluna em pedidos, padrão false). Pedidos com essa flag saem
        desta lista e aparecem na seção 4.
     c) "Devolver ao cliente": campo de texto obrigatório com a pendência
        encontrada. Muda o status para pendencia_cliente e registra a mensagem
        no histórico do pedido, visível ao cliente.

3. Lista "Acompanhar no órgão"
   Pedidos com status protocolado ou exigencia_orgao, do protocolo mais antigo
   para o mais novo, com: nº do pedido, órgão, serviço, nº de protocolo,
   previsão, site de consulta (orgaos_config) e data da última atualização.
   Ações:
   - "Sem novidade": registra evento "Consulta no órgão sem alterações" (só
     para registrar que foi verificado).
   - "Exigência do órgão": campo de texto obrigatório; muda o status para
     exigencia_orgao e registra a mensagem para o cliente.
   - "Licença emitida": upload do arquivo no documento de origem emitido
     e muda o status para deferido.

4. Lista "Aguardando humano"
   Pedidos com aguardando_humano = true, com o motivo mais recente, e um botão
   "Resolvido" (só para operadores humanos) que volta a flag para false.

Topo da página: contadores de cada lista e a data/hora da última atualização.
Todas as ações registram no histórico quem fez (o usuário logado).
```

## Prompt 8 — Pacote pronto para protocolo

```
Na Fila do Cowork, adicione a cada pedido um "Pacote para protocolo"
(rota /equipe/pedidos/:id/pacote), usado tanto pelo agente de IA quanto por um
operador humano. O objetivo é que quem for protocolar não precise procurar nada.
Página simples, tudo visível, sem modais.

1. Configuração por órgão (em orgaos_config, editável em Configurações → Órgãos)
   - passo_a_passo: texto com os passos do protocolo naquele órgão, um por linha.
   - exige: lista de marcações com o que precisa de uma pessoa:
     login com código no celular, certificado digital, captcha,
     aplicativo de celular, pagamento de taxa, entrega presencial.

2. Cabeçalho do pacote
   - Pedido, órgão, serviço, forma de protocolo e link do site de protocolo.
   - Em destaque, as marcações de "exige" do órgão, com o aviso:
     "Estas etapas precisam de uma pessoa".

3. Dados para copiar
   Lista de campos, cada um com rótulo, valor e um botão "Copiar" ao lado:
   requerente (nome, CPF/CNPJ, endereço, e-mail, telefone, representante legal),
   procurador (nome, CPF/CNPJ, endereço), responsável técnico (nome, título,
   registro, ART/RRT), obra (nome, endereço, município, área, coordenadas,
   pavimentos, unidades, uso) e os textos longos preenchidos em pedidos.dados
   (descrição do empreendimento, memoriais, justificativas). Usar os mesmos
   campos da tela "Dados para os documentos"; mostrar só os que têm valor e
   marcar em vermelho "não preenchido" os que os modelos do serviço usam e
   estão vazios.

4. Arquivos
   - Lista dos documentos aprovados na ordem do checklist, numerados:
     "01 - <item>", "02 - <item>"..., com link de download de cada um.
   - Botão "Baixar todos (ZIP)": edge function que monta um ZIP com os arquivos
     aprovados renomeados como "01 - <item>.<extensão>", nessa ordem, e devolve
     uma URL assinada válida por 1 hora.
   - Links para abrir cada modelo gerado (procuração, requerimento etc.) para
     imprimir/salvar em PDF.

5. Passo a passo com progresso
   Mostre o passo_a_passo do órgão como checklist. Ao marcar um passo, salve
   quem marcou e quando (tabela pacote_passos: pedido_id, passo, feito_por,
   feito_em). Assim o agente pode fazer parte, passar para uma pessoa, e ela
   continua de onde parou.
   No fim da lista, os passos fixos:
   "Arquivos enviados ao órgão", "Taxa paga (se houver)",
   "Protocolo registrado no LicençaPB".

6. Passar a vez
   - Botão "Preciso de uma pessoa": campo obrigatório "o que falta" (ex.:
     "digitar código do gov.br", "assinar com certificado", "abrir no app da
     prefeitura"). Marca aguardando_humano = true, registra evento com o
     último passo concluído e o motivo.
   - Na lista "Aguardando humano" da Fila do Cowork, cada pedido tem o link
     "Abrir pacote", e o pacote mostra no topo, em amarelo, o motivo e em que
     passo parou.
   - Botão "Devolver para o Cowork" (só para operador humano): volta
     aguardando_humano para false com um comentário.

7. Registrar protocolo
   Repita no fim do pacote os campos "nº de protocolo" e "previsão" com o mesmo
   comportamento da Fila do Cowork (status protocolado + evento).
```

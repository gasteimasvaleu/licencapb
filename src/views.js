const { ORGAOS, SERVICOS, STATUS, MUNICIPIOS_SUGERIDOS } = require('./catalogo');
const { GRUPOS } = require('./campos');
const { MODELOS, modelosDoServico } = require('./modelos');

const AMBITOS = {
  Estadual: 'Órgãos estaduais',
  Municipal: 'Prefeituras',
  Federal: 'Órgãos federais',
  Concessionária: 'Concessionárias',
};

const NOME_APP = 'LicençaPB';

function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function data(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  return d.toLocaleString('pt-BR', { timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short' });
}

function selo(status) {
  return `<span class="selo selo-${esc(status)}">${esc(STATUS[status]?.rotulo || status)}</span>`;
}

function csrf(ctx) {
  return `<input type="hidden" name="_csrf" value="${esc(ctx.csrf)}">`;
}

function layout(ctx, titulo, corpo) {
  const u = ctx.usuario;
  const nav = u
    ? `<a href="/painel">Meus pedidos</a>
       ${u.papel === 'operador' ? '<a href="/equipe">Fila da equipe</a>' : '<a href="/pedidos/novo">Novo pedido</a>'}
       <form method="post" action="/sair" class="inline">${csrf(ctx)}<button class="link">Sair (${esc(u.nome.split(' ')[0])})</button></form>`
    : '<a href="/servicos">Serviços</a><a href="/entrar">Entrar</a><a href="/cadastro" class="botao">Criar conta</a>';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · ${NOME_APP}</title>
<link rel="stylesheet" href="/estilo.css">
</head>
<body>
<header class="topo">
  <a href="/" class="marca">${NOME_APP}</a>
  <nav>${nav}</nav>
</header>
<main>
${ctx.aviso ? `<p class="aviso">${esc(ctx.aviso)}</p>` : ''}
${corpo}
</main>
<footer>
  ${NOME_APP} — licenças para obras na Paraíba. Os requisitos de cada órgão podem mudar;
  a equipe confere tudo antes de protocolar.
</footer>
</body>
</html>`;
}

function inicio(ctx) {
  const orgaos = Object.entries(AMBITOS).map(([a, titulo]) => `
    <div><h3>${titulo}</h3><ul>
    ${ORGAOS.filter((o) => o.ambito === a).map((o) => `<li><strong>${esc(o.sigla)}</strong> — ${esc(o.descricao)}</li>`).join('')}
    </ul></div>`).join('');
  return layout(ctx, 'Início', `
<section class="hero">
  <h1>Licenças da sua obra, sem fila e sem papelada.</h1>
  <p>Para construtores, arquitetos e engenheiros na Paraíba. Você informa os dados da obra uma vez; a
  plataforma gera requerimentos, procurações e memoriais prontos, confere os anexos, protocola nos órgãos
  e avisa você a cada etapa.</p>
  <p><a class="botao" href="/cadastro">Começar agora</a> <a href="/servicos">Ver serviços e documentos</a></p>
</section>
<section class="passos">
  <div><span>1</span><h3>Escolha o serviço</h3><p>Licença ambiental, Bombeiros, outorga de água, patrimônio, rodovias, saneamento.</p></div>
  <div><span>2</span><h3>Informe os dados</h3><p>Geramos requerimento, procuração, memoriais e declarações preenchidos para você assinar.</p></div>
  <div><span>3</span><h3>Nós protocolamos</h3><p>Conferimos, protocolamos e acompanhamos o processo no órgão.</p></div>
  <div><span>4</span><h3>Acompanhe aqui</h3><p>Status, número de protocolo, exigências e a licença emitida em um só lugar.</p></div>
</section>
<section>
  <h2>Órgãos atendidos</h2>
  <div class="orgaos">${orgaos}</div>
</section>`);
}

function servicos(ctx) {
  const blocos = ORGAOS.map((o) => `
<section class="orgao">
  <h2>${esc(o.sigla)} <small>${esc(o.ambito)} · ${esc(o.nome)}</small></h2>
  ${o.servicos.map((s) => `
  <details>
    <summary><strong>${esc(s.nome)}</strong> — ${esc(s.descricao)}</summary>
    ${modelosDoServico(s).length ? `<p><strong>Gerados pela plataforma:</strong> ${modelosDoServico(s).map((m) => esc(MODELOS[m].titulo)).join(' · ')}</p>` : ''}
    <p><strong>Você envia:</strong></p>
    <ol>${s.documentos.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
    ${ctx.usuario?.papel === 'cliente' ? `<a class="botao" href="/pedidos/novo?servico=${esc(s.codigo)}">Solicitar</a>` : ''}
  </details>`).join('')}
</section>`).join('');
  return layout(ctx, 'Serviços', `<h1>Serviços e documentos</h1>
<p>Lista de documentos de referência de cada pedido. Após a conferência, a equipe pode solicitar itens específicos do seu caso.</p>
${blocos}`);
}

function campo(rotulo, nome, extra = '') {
  return `<label>${esc(rotulo)}<input name="${nome}" ${extra}></label>`;
}

function cadastro(ctx, valores = {}) {
  const v = (k) => `value="${esc(valores[k] || '')}"`;
  return layout(ctx, 'Criar conta', `
<form method="post" action="/cadastro" class="cartao estreito">
  <h1>Criar conta</h1>
  ${csrf(ctx)}
  ${campo('Nome completo', 'nome', `required ${v('nome')}`)}
  ${campo('E-mail', 'email', `type="email" required ${v('email')}`)}
  ${campo('Telefone / WhatsApp', 'telefone', v('telefone'))}
  <label>Profissão
    <select name="profissao">
      ${['Engenheiro(a) civil', 'Arquiteto(a)', 'Construtora / incorporadora', 'Outro'].map((p) =>
        `<option ${valores.profissao === p ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
  </label>
  ${campo('Registro profissional (CREA/CAU), se houver', 'registro_profissional', v('registro_profissional'))}
  ${campo('Senha (mínimo 8 caracteres)', 'senha', 'type="password" minlength="8" required')}
  <button class="botao">Criar conta</button>
  <p>Já tem conta? <a href="/entrar">Entrar</a></p>
</form>`);
}

function entrar(ctx, voltar = '') {
  return layout(ctx, 'Entrar', `
<form method="post" action="/entrar" class="cartao estreito">
  <h1>Entrar</h1>
  ${csrf(ctx)}
  <input type="hidden" name="voltar" value="${esc(voltar)}">
  ${campo('E-mail', 'email', 'type="email" required')}
  ${campo('Senha', 'senha', 'type="password" required')}
  <button class="botao">Entrar</button>
  <p>Não tem conta? <a href="/cadastro">Criar conta</a></p>
</form>`);
}

function tabelaPedidos(pedidos, comCliente) {
  if (!pedidos.length) return '<p class="vazio">Nenhum pedido por aqui.</p>';
  return `<table>
<thead><tr><th>#</th><th>Serviço</th><th>Obra</th>${comCliente ? '<th>Cliente</th>' : ''}<th>Status</th><th>Docs</th><th>Atualizado</th></tr></thead>
<tbody>${pedidos.map((p) => {
    const s = SERVICOS.get(p.servico_codigo);
    return `<tr>
  <td><a href="/pedidos/${p.id}">${p.id}</a></td>
  <td>${esc(s?.orgao)} · ${esc(s?.nome || p.servico_codigo)}</td>
  <td>${esc(p.titulo_obra)}<br><small>${esc(p.municipio)}</small></td>
  ${comCliente ? `<td>${esc(p.cliente_nome)}</td>` : ''}
  <td>${selo(p.status)}</td>
  <td>${p.docs_ok}/${p.docs_total}</td>
  <td>${data(p.atualizado_em)}</td>
</tr>`;
  }).join('')}</tbody></table>`;
}

function painel(ctx, pedidos) {
  return layout(ctx, 'Meus pedidos', `
<div class="cabecalho"><h1>Meus pedidos</h1>
${ctx.usuario.papel === 'cliente' ? '<a class="botao" href="/pedidos/novo">Novo pedido</a>' : ''}</div>
${tabelaPedidos(pedidos, false)}`);
}

function equipe(ctx, pedidos, filtro) {
  const opcoes = ['ativos', ...Object.keys(STATUS), 'todos'].map((s) =>
    `<option value="${s}" ${filtro === s ? 'selected' : ''}>${esc(STATUS[s]?.rotulo || s[0].toUpperCase() + s.slice(1))}</option>`).join('');
  return layout(ctx, 'Fila da equipe', `
<div class="cabecalho"><h1>Fila da equipe</h1>
<form method="get"><select name="status" onchange="this.form.submit()">${opcoes}</select></form></div>
${tabelaPedidos(pedidos, true)}`);
}

function novoPedido(ctx, servicoEscolhido, valores = {}) {
  const v = (k) => `value="${esc(valores[k] || '')}"`;
  const opcoes = ORGAOS.map((o) => `<optgroup label="${esc(o.sigla)} — ${esc(o.nome)}">
    ${o.servicos.map((s) => `<option value="${s.codigo}" ${s.codigo === servicoEscolhido ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}
  </optgroup>`).join('');
  return layout(ctx, 'Novo pedido', `
<form method="post" action="/pedidos" class="cartao">
  <h1>Novo pedido</h1>
  ${csrf(ctx)}
  <label>Serviço<select name="servico" required>${opcoes}</select></label>
  <fieldset><legend>Obra</legend>
    ${campo('Nome da obra / empreendimento', 'titulo_obra', `required ${v('titulo_obra')}`)}
    <label>Município<input name="municipio" list="municipios" required ${v('municipio')}></label>
    <datalist id="municipios">${MUNICIPIOS_SUGERIDOS.map((m) => `<option value="${esc(m)}">`).join('')}</datalist>
    ${campo('Endereço completo', 'endereco', `required ${v('endereco')}`)}
    ${campo('Área construída (m²)', 'area_m2', `type="number" min="0" step="0.01" ${v('area_m2')}`)}
  </fieldset>
  <fieldset><legend>Proprietário / requerente</legend>
    ${campo('Nome ou razão social', 'proprietario', `required ${v('proprietario')}`)}
    ${campo('CPF ou CNPJ', 'proprietario_doc', `required ${v('proprietario_doc')}`)}
  </fieldset>
  <label>Observações para a equipe<textarea name="observacoes" rows="3">${esc(valores.observacoes || '')}</textarea></label>
  <p>Depois de criar o pedido você verá o checklist de documentos e poderá enviá-los.</p>
  <button class="botao">Criar pedido</button>
</form>`);
}

const ROTULOS_IA = {
  analisando: 'IA conferindo o arquivo…',
  ok: 'IA: parece correto',
  atencao: 'IA: pontos de atenção',
  incompativel: 'IA: arquivo não corresponde ao item',
  erro: 'IA: não foi possível conferir',
};

function parecerIA(d) {
  if (!d.ia_situacao || !d.arquivo_caminho) return '';
  let parecer = null;
  try { parecer = JSON.parse(d.ia_parecer || 'null'); } catch { /* parecer inválido: mostra só o rótulo */ }
  return `<div class="ia ia-${esc(d.ia_situacao)}"><strong>${esc(ROTULOS_IA[d.ia_situacao] || d.ia_situacao)}</strong>
    ${parecer?.resumo ? `<br>${esc(parecer.resumo)}` : ''}
    ${parecer?.problemas?.length ? `<ul>${parecer.problemas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
}

function pedido(ctx, p, documentos, eventos, gerados = []) {
  const s = SERVICOS.get(p.servico_codigo);
  const operador = ctx.usuario.papel === 'operador';
  const acao = (caminho) => `/pedidos/${p.id}/${caminho}`;

  const docsChecklist = documentos.filter((d) => d.origem !== 'emitido');
  const emitidos = documentos.filter((d) => d.origem === 'emitido');

  // A equipe vê também os documentos emitidos no checklist, para anexá-los.
  const linhasDocs = (operador ? documentos : docsChecklist).map((d) => {
    const arquivo = d.arquivo_caminho
      ? `<a href="${acao(`documentos/${d.id}/arquivo`)}">${esc(d.arquivo_nome)}</a>` : '<em>sem arquivo</em>';
    const envio = (!operador && d.origem !== 'emitido' && d.situacao !== 'aprovado') || (operador && d.origem === 'emitido')
      ? `<form method="post" enctype="multipart/form-data" action="${acao(`documentos/${d.id}/arquivo`)}?_csrf=${esc(ctx.csrf)}" class="envio">
          <input type="file" name="arquivo" required><button class="pequeno">Enviar</button></form>` : '';
    const revisao = operador && d.origem !== 'emitido' && d.arquivo_caminho
      ? `<form method="post" action="${acao(`documentos/${d.id}/revisao`)}" class="envio">${csrf(ctx)}
          <input name="nota" placeholder="Nota (obrigatória se rejeitar)">
          <button class="pequeno" name="situacao" value="aprovado">Aprovar</button>
          <button class="pequeno perigo" name="situacao" value="rejeitado">Rejeitar</button></form>` : '';
    return `<tr class="doc-${d.situacao}">
  <td>${esc(d.item)}${d.origem === 'extra' ? ' <small>(solicitado pela equipe)</small>' : ''}
    ${d.modelo ? `<br><a href="${acao(`modelos/${esc(d.modelo)}`)}" target="_blank">Abrir modelo preenchido</a>` : ''}
    ${d.nota ? `<br><small class="nota">${esc(d.nota)}</small>` : ''}</td>
  <td><span class="situacao">${esc(d.situacao)}</span></td>
  <td>${arquivo}${parecerIA(d)}${envio}${revisao}</td>
</tr>`;
  }).join('');

  const pendentes = new Set(gerados.flatMap((g) => g.faltando)).size;
  const linhasModelos = gerados.map((g) => `<tr>
  <td><strong>${esc(g.titulo)}</strong><br><small>${esc(g.descricao)}</small></td>
  <td>${g.assinatura ? esc(g.assinatura) : '<small>não precisa de assinatura</small>'}</td>
  <td>${g.faltando.length ? `<span class="falta">${g.faltando.length} informação(ões) pendente(s)</span>` : '<span class="ok">Completo</span>'}</td>
  <td><a href="${acao(`modelos/${g.codigo}`)}" target="_blank">Ver / imprimir</a> ·
      <a href="${acao(`modelos/${g.codigo}`)}?formato=doc">Word</a></td>
</tr>`).join('');
  const secaoModelos = gerados.length ? `
<section class="cartao" id="modelos">
  <div class="cabecalho"><h2>Documentos gerados pela plataforma</h2>
  <a class="botao" href="${acao('dados')}">${pendentes ? `Preencher dados (${pendentes} pendentes)` : 'Revisar dados'}</a></div>
  <p><small>Preenchidos automaticamente com os dados do pedido. Campos em amarelo ainda faltam. Depois de assinar,
  envie cada um no item correspondente do checklist.</small></p>
  <table><thead><tr><th>Documento</th><th>Assinatura</th><th>Situação</th><th></th></tr></thead>
  <tbody>${linhasModelos}</tbody></table>
</section>` : '';

  const historico = eventos.map((e) => `
<li class="evento evento-${e.tipo}">
  <div><strong>${esc(e.autor_nome || 'Sistema')}</strong> <small>${data(e.criado_em)}</small></div>
  <p>${esc(e.texto)}</p>
</li>`).join('');

  const painelOperador = operador ? `
<section class="cartao">
  <h2>Ações da equipe</h2>
  <form method="post" action="${acao('status')}">${csrf(ctx)}
    <label>Novo status<select name="status">${Object.entries(STATUS).map(([k, st]) =>
      `<option value="${k}" ${k === p.status ? 'selected' : ''}>${esc(st.rotulo)}</option>`).join('')}</select></label>
    <label>Número de protocolo no órgão<input name="protocolo_orgao" value="${esc(p.protocolo_orgao || '')}"></label>
    <label>Previsão de resposta<input type="date" name="previsao" value="${esc(p.previsao || '')}"></label>
    <label>Comentário para o cliente<textarea name="texto" rows="2"></textarea></label>
    <button class="botao">Atualizar pedido</button>
  </form>
  <form method="post" action="${acao('documentos')}">${csrf(ctx)}
    <label>Solicitar documento adicional<input name="item" required placeholder="Ex.: Certidão negativa de débitos ambientais"></label>
    <label><input type="checkbox" name="emitido" value="1"> É a licença/documento emitido pelo órgão (para entregar ao cliente)</label>
    <button class="pequeno">Adicionar item</button>
  </form>
</section>` : '';

  return layout(ctx, `Pedido #${p.id}`, `
<div class="cabecalho">
  <h1>Pedido #${p.id} — ${esc(s?.nome || p.servico_codigo)}</h1>
  ${selo(p.status)}
</div>
<p class="status-desc">${esc(STATUS[p.status]?.descricao || '')}</p>
<section class="grade">
  <div class="cartao">
    <h2>Dados</h2>
    <dl>
      <dt>Órgão</dt><dd>${esc(s?.orgao)} — ${esc(s?.orgaoNome)}</dd>
      <dt>Obra</dt><dd>${esc(p.titulo_obra)}</dd>
      <dt>Local</dt><dd>${esc(p.endereco)}, ${esc(p.municipio)} – PB</dd>
      ${p.area_m2 ? `<dt>Área</dt><dd>${esc(p.area_m2)} m²</dd>` : ''}
      <dt>Requerente</dt><dd>${esc(p.proprietario)} (${esc(p.proprietario_doc)})</dd>
      ${operador ? `<dt>Cliente</dt><dd>${esc(p.cliente_nome)} · ${esc(p.cliente_email)} · ${esc(p.cliente_telefone || '')}</dd>` : ''}
      <dt>Protocolo no órgão</dt><dd>${esc(p.protocolo_orgao || 'ainda não protocolado')}</dd>
      ${p.previsao ? `<dt>Previsão</dt><dd>${esc(new Date(`${p.previsao}T12:00:00`).toLocaleDateString('pt-BR'))}</dd>` : ''}
      ${p.observacoes ? `<dt>Observações</dt><dd>${esc(p.observacoes)}</dd>` : ''}
    </dl>
  </div>
  ${painelOperador}
</section>
${emitidos.length ? `<section class="cartao destaque"><h2>Documentos emitidos</h2>
<table><tbody>${emitidos.map((d) => `<tr><td>${esc(d.item)}</td><td>${d.arquivo_caminho
    ? `<a class="botao" href="${acao(`documentos/${d.id}/arquivo`)}">Baixar</a>` : 'aguardando emissão'}</td></tr>`).join('')}</tbody></table></section>` : ''}
${secaoModelos}
<section class="cartao">
  <h2>Checklist de documentos <small>${docsChecklist.filter((d) => d.situacao === 'aprovado').length}/${docsChecklist.length} aprovados</small></h2>
  <p><small>Formatos aceitos: PDF, JPG, PNG, DWG, ZIP — até 25 MB por arquivo.</small></p>
  <table><thead><tr><th>Documento</th><th>Situação</th><th>Arquivo</th></tr></thead><tbody>
  ${linhasDocs}
  </tbody></table>
</section>
<section class="cartao">
  <h2>Histórico e mensagens</h2>
  <form method="post" action="${acao('mensagens')}">${csrf(ctx)}
    <textarea name="texto" rows="2" required placeholder="Escreva uma mensagem para ${operador ? 'o cliente' : 'a equipe'}"></textarea>
    <button class="pequeno">Enviar mensagem</button>
  </form>
  <ul class="historico">${historico}</ul>
</section>`);
}

function dadosDocumentos(ctx, p, campos, valores) {
  const s = SERVICOS.get(p.servico_codigo);
  const grupos = GRUPOS.map((g) => {
    const lista = campos.filter((c) => c.grupo === g);
    if (!lista.length) return '';
    return `<fieldset><legend>${esc(g)}</legend>${lista.map((c) => {
      const valor = valores[c.id] || '';
      return c.tipo === 'texto'
        ? `<label>${esc(c.rotulo)}<textarea name="${c.id}" rows="4">${esc(valor)}</textarea></label>`
        : `<label>${esc(c.rotulo)}<input name="${c.id}" type="${c.tipo === 'email' ? 'email' : 'text'}" value="${esc(valor)}"></label>`;
    }).join('')}</fieldset>`;
  }).join('');
  const textosVazios = campos.filter((c) => c.tipo === 'texto' && !String(valores[c.id] ?? '').trim()).length;
  const blocoIA = ctx.ia && textosVazios ? `
<form method="post" action="/pedidos/${p.id}/ia/textos" class="cartao destaque ia-form">${csrf(ctx)}
  <div><strong>Redigir textos com IA</strong><br><small>A IA escreve os ${textosVazios} texto(s) técnico(s) ainda vazios
  (descrições, memoriais, justificativas) com base nos dados já informados. Salve antes os dados que alterou.
  Pode levar até 1 minuto; revise o resultado.</small></div>
  <button class="botao">Redigir com IA</button>
</form>` : '';
  return layout(ctx, `Dados — pedido #${p.id}`, `${blocoIA}
<form method="post" action="/pedidos/${p.id}/dados" class="cartao">
  <h1>Dados para os documentos</h1>
  <p>Pedido #${p.id} — ${esc(s?.orgao)} · ${esc(s?.nome)}. Estas informações preenchem automaticamente
  ${modelosDoServico(s).length} documento(s). Você pode salvar e voltar depois; os campos vazios aparecem
  destacados nos documentos.</p>
  ${csrf(ctx)}
  ${grupos}
  <button class="botao">Salvar dados</button> <a href="/pedidos/${p.id}">Voltar ao pedido</a>
</form>`);
}

const ESTILO_DOCUMENTO = `
@page { size: A4; margin: 2.5cm 2cm; }
body { font: 12pt/1.6 "Times New Roman", Times, serif; color: #000; max-width: 17cm; margin: 0 auto; padding: 24px; background: #fff; }
h1 { font-size: 14pt; text-align: center; margin: 24px 0; letter-spacing: .05em; }
h2 { font-size: 12pt; margin: 20px 0 8px; }
p { text-align: justify; margin: 0 0 12px; }
.direita { text-align: right; margin-top: 32px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 11pt; }
th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; vertical-align: top; }
table.dados th { width: 32%; background: #f2f2f2; }
table.grade thead th { background: #f2f2f2; }
.assinatura { margin: 56px auto 0; width: 70%; text-align: center; font-size: 11pt; }
.assinatura .linha { border-top: 1px solid #000; margin-bottom: 4px; }
mark.faltando { background: #fff3a3; color: #7a4b00; font-family: system-ui, sans-serif; font-size: 10pt; }
.edital { border: 1px solid #000; padding: 12px 16px; }
.aviso-doc, .barra { font-family: system-ui, sans-serif; font-size: 10pt; background: #eef6f3; padding: 8px 12px; border-radius: 6px; }
.barra { display: flex; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.barra.pendente { background: #fff3a3; }
@media print { .barra { display: none; } body { padding: 0; } }
`;

function documentoGerado(p, gerado, paraWord) {
  const barra = paraWord ? '' : `
<div class="barra ${gerado.faltando.length ? 'pendente' : ''}">
  <span>${gerado.faltando.length
    ? `${gerado.faltando.length} informação(ões) pendente(s), destacadas em amarelo. <a href="/pedidos/${p.id}/dados">Preencher dados</a>`
    : 'Documento completo. Revise, imprima ou salve em PDF e assine.'}</span>
  <span><button onclick="window.print()">Imprimir / salvar PDF</button>
  <a href="/pedidos/${p.id}/modelos/${esc(gerado.codigo)}?formato=doc">Baixar Word</a>
  <a href="/pedidos/${p.id}">Voltar</a></span>
</div>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(gerado.titulo)} — pedido #${p.id}</title>
<style>${ESTILO_DOCUMENTO}</style></head>
<body>${barra}
${gerado.html}
</body></html>`;
}

function erro(ctx, codigo, mensagem) {
  return layout(ctx, `Erro ${codigo}`, `<section class="cartao estreito"><h1>${codigo}</h1><p>${esc(mensagem)}</p><a href="/">Voltar ao início</a></section>`);
}

module.exports = {
  esc, inicio, servicos, cadastro, entrar, painel, equipe, novoPedido, pedido, dadosDocumentos, documentoGerado, erro,
};

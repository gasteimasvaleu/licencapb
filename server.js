const path = require('node:path');
const { criarApp } = require('./src/app');
const { criarIA, iaConfigurada, problemaNoFormatoDaChave } = require('./src/ia');

const PORTA = Number(process.env.PORT) || 3000;
const DADOS = process.env.DATA_DIR || path.join(__dirname, 'dados');

let operadorInicial;
if (process.env.OPERADOR_EMAIL && process.env.OPERADOR_SENHA) {
  operadorInicial = {
    nome: process.env.OPERADOR_NOME || 'Equipe LicençaPB',
    email: process.env.OPERADOR_EMAIL,
    senha: process.env.OPERADOR_SENHA,
  };
} else {
  console.warn('OPERADOR_EMAIL/OPERADOR_SENHA não definidos: nenhum usuário da equipe será criado.');
}

// Valida a chave antes de subir: com chave inválida, a IA fica desligada em
// vez de falhar a cada pedido. Falhas passageiras (rede, 5xx) mantêm a IA ativa.
async function prepararIA() {
  if (!iaConfigurada()) {
    console.warn('ANTHROPIC_API_KEY não definida: recursos de IA desativados.');
    return null;
  }
  const formato = problemaNoFormatoDaChave();
  if (formato) {
    console.error(`${formato} Recursos de IA desativados.`);
    return null;
  }
  const ia = criarIA();
  const r = await ia.validarChave();
  if (r.ok) {
    console.log('Chave da API validada: recursos de IA ativos.');
  } else if (r.definitivo) {
    console.error(`${r.motivo} Recursos de IA desativados.`);
    return null;
  } else {
    console.warn(`Não foi possível validar a chave agora (${r.motivo}). IA mantida ativa.`);
  }
  return ia;
}

prepararIA().then((ia) => {
  const app = criarApp({
    arquivoBanco: path.join(DADOS, 'licencas.db'),
    pastaUploads: path.join(DADOS, 'uploads'),
    cookieSeguro: process.env.NODE_ENV === 'production',
    operadorInicial,
    ia,
  });
  app.listen(PORTA, () => console.log(`LicençaPB rodando em http://localhost:${PORTA}`));
});

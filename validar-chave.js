// Uso: npm run validar-chave — confere ANTHROPIC_API_KEY e o acesso ao modelo.
const { criarIA, iaConfigurada, problemaNoFormatoDaChave } = require('./src/ia');

(async () => {
  if (!iaConfigurada()) {
    console.error('ANTHROPIC_API_KEY não definida (ou IA_ATIVA=0).');
    process.exit(1);
  }
  const formato = problemaNoFormatoDaChave();
  if (formato) {
    console.error(formato);
    process.exit(1);
  }
  const r = await criarIA().validarChave();
  if (r.ok) {
    console.log('Chave válida e modelo disponível.');
  } else {
    console.error(r.motivo);
    process.exit(1);
  }
})();

const path = require('node:path');
const { criarApp } = require('./src/app');

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

const app = criarApp({
  arquivoBanco: path.join(DADOS, 'licencas.db'),
  pastaUploads: path.join(DADOS, 'uploads'),
  cookieSeguro: process.env.NODE_ENV === 'production',
  operadorInicial,
});

app.listen(PORTA, () => console.log(`LicençaPB rodando em http://localhost:${PORTA}`));

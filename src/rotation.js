// Lógica de rotação semanal entre Grupo 1 e Grupo 2.
//
// Âncora: a semana de 2026-09-28 (segunda-feira) a 2026-10-02 é do
// Grupo 1. A semana seguinte (2026-10-05 a 2026-10-09) é do Grupo 2.
// A partir daí os grupos se alternam toda semana (semana par de
// distância da âncora = Grupo 1, semana ímpar = Grupo 2).
//
// Para evitar bugs de fuso horário, todas as contas aqui são feitas
// em termos de "dia de calendário" (ano/mês/dia), usando os campos
// UTC de um Date como representação desse dia de calendário. Quem
// chama a função deve garantir que o Date passado representa o dia
// certo (veja `getSaoPauloToday`).

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Segunda-feira da semana-âncora (Grupo 1), em UTC "puro" (sem hora).
const ANCHOR_MONDAY_UTC = Date.UTC(2026, 8, 28); // 2026-09-28

/**
 * Recebe uma data (Date, ou string 'YYYY-MM-DD') e devolve o timestamp
 * UTC (ms) da segunda-feira da semana ISO (segunda a domingo) que
 * contém essa data.
 */
function mondayOfWeekUTC(date) {
  let y, m, d;

  if (typeof date === 'string') {
    const parts = date.split('-').map(Number);
    [y, m, d] = [parts[0], parts[1] - 1, parts[2]];
  } else if (date instanceof Date) {
    y = date.getUTCFullYear();
    m = date.getUTCMonth();
    d = date.getUTCDate();
  } else {
    throw new TypeError('date deve ser um Date ou uma string "YYYY-MM-DD"');
  }

  const dayTimestamp = Date.UTC(y, m, d);
  const jsDay = new Date(dayTimestamp).getUTCDay(); // 0=domingo ... 6=sábado
  const isoOffsetFromMonday = (jsDay + 6) % 7; // 0=segunda ... 6=domingo

  return dayTimestamp - isoOffsetFromMonday * MS_PER_DAY;
}

/**
 * Função pura: dado uma data, retorna 'group1' ou 'group2', o grupo
 * ativo (de plantão) naquela semana.
 *
 * Aceita um Date ou uma string 'YYYY-MM-DD'.
 */
function getActiveGroup(date) {
  const monday = mondayOfWeekUTC(date);
  const weeksSinceAnchor = Math.round((monday - ANCHOR_MONDAY_UTC) / (7 * MS_PER_DAY));

  // Módulo que também funciona corretamente para números negativos
  // (datas anteriores à âncora).
  const isEven = ((weeksSinceAnchor % 2) + 2) % 2 === 0;

  return isEven ? 'group1' : 'group2';
}

/**
 * Retorna um Date "de calendário" (meia-noite UTC) representando o
 * dia de hoje no fuso horário America/Sao_Paulo. Usar isso (em vez de
 * `new Date()` puro) evita que o servidor, se estiver em outro fuso,
 * calcule a semana errada perto da virada do dia.
 */
function getSaoPauloToday(referenceDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA formata como YYYY-MM-DD
  const isoDate = formatter.format(referenceDate);
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

module.exports = { getActiveGroup, getSaoPauloToday, mondayOfWeekUTC };

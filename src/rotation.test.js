// Testes de sanidade para getActiveGroup.
//
// Roda tanto com Jest (`npx jest src/rotation.test.js`) quanto direto
// com Node (`node src/rotation.test.js`), graças ao pequeno shim no
// final do arquivo.

const { getActiveGroup } = require('./rotation');

const cases = [
  ['2026-09-28', 'group1'],
  ['2026-10-01', 'group1'],
  ['2026-10-05', 'group2'],
  ['2026-10-12', 'group1'],
  ['2026-10-19', 'group2'],
];

function runWithNode() {
  let failures = 0;
  for (const [date, expected] of cases) {
    const actual = getActiveGroup(date);
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${date} -> ${actual} (esperado ${expected})`);
  }
  if (failures > 0) {
    console.error(`\n${failures} teste(s) falharam.`);
    process.exit(1);
  } else {
    console.log(`\nTodos os ${cases.length} testes passaram.`);
  }
}

// Detecta se está rodando sob Jest (variável global `test`/`expect`
// só existe nesse caso).
if (typeof test === 'function' && typeof expect === 'function') {
  describe('getActiveGroup', () => {
    for (const [date, expected] of cases) {
      test(`${date} -> ${expected}`, () => {
        expect(getActiveGroup(date)).toBe(expected);
      });
    }
  });
} else {
  runWithNode();
}

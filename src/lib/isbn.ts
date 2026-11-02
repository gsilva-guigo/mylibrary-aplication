/**
 * ISBN: limpeza, validação pelo dígito verificador e conversão 10 → 13.
 * Funções puras, sem dependência de React Native, testadas em src/lib/__tests__.
 */

/** Remove tudo que não for dígito ou X (maiúsculo). */
export function cleanIsbn(raw: string): string {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^0-9X]/g, '');
}

/** ISBN-10 válido: 9 dígitos + dígito verificador (0-9 ou X), soma ponderada divisível por 11. */
export function isValidIsbn10(raw: string): boolean {
  const s = cleanIsbn(raw);
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const c = s[i];
    const v = c === 'X' ? 10 : Number(c);
    sum += v * (10 - i);
  }
  return sum % 11 === 0;
}

/** ISBN-13 válido: 13 dígitos começando com 978 ou 979, pesos 1 e 3 alternados. */
export function isValidIsbn13(raw: string): boolean {
  const s = cleanIsbn(raw);
  if (!/^97[89]\d{10}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(s[i]) * (i % 2 ? 3 : 1);
  return sum % 10 === 0;
}

export function isValidIsbn(raw: string): boolean {
  return isValidIsbn10(raw) || isValidIsbn13(raw);
}

/** Converte para ISBN-13 (forma canônica usada para comparar duplicatas). Retorna null se inválido. */
export function toIsbn13(raw: string): string | null {
  const s = cleanIsbn(raw);
  if (isValidIsbn13(s)) return s;
  if (!isValidIsbn10(s)) return null;
  const core = '978' + s.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 ? 3 : 1);
  return core + String((10 - (sum % 10)) % 10);
}

/**
 * Procura ISBNs válidos num texto lido por OCR.
 * Aceita hífens, espaços e pontos no meio ("85-359-0277-5", "978 85 359 0277 8"),
 * e erros comuns de OCR em dígitos (O→0, I/l→1). Devolve ISBN-13 sem repetição.
 */
export function findIsbns(text: string): string[] {
  const found = new Set<string>();
  // Trechos que parecem número de ISBN: dígitos com separadores, opcionalmente após "ISBN".
  const candidates = String(text ?? '').match(/(?:\d[\d\s.\-–OoIl]{8,20}[\dXx])/g) ?? [];
  for (const cand of candidates) {
    const fixed = cand.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
    const digits = cleanIsbn(fixed);
    if (digits.length === 10 || digits.length === 13) {
      const isbn = toIsbn13(digits);
      if (isbn) found.add(isbn);
      continue;
    }
    // Trecho mais longo (dois números colados pelo OCR): procura janelas de 13 dígitos
    // e só cai para janelas de 10 se nenhuma de 13 for válida, para evitar falsos positivos.
    let hit = false;
    for (let i = 0; i + 13 <= digits.length; i++) {
      const isbn = toIsbn13(digits.slice(i, i + 13));
      if (isbn) {
        found.add(isbn);
        hit = true;
      }
    }
    if (!hit) {
      for (let i = 0; i + 10 <= digits.length; i++) {
        const isbn = isValidIsbn10(digits.slice(i, i + 10)) ? toIsbn13(digits.slice(i, i + 10)) : null;
        if (isbn) found.add(isbn);
      }
    }
  }
  return [...found];
}

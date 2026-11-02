/**
 * Normalização de texto para comparar livros: sem acentos, minúsculas,
 * sem pontuação, espaços únicos.
 */

export function normalize(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const LEADING_ARTICLES = /^(o|a|os|as|um|uma|the|an|el|la|los|las|le|les|der|die|das|il|lo)\s/;

/** Título normalizado sem artigo inicial: "O Cortiço" e "cortico" ficam iguais. */
export function normalizeTitle(s: string | null | undefined): string {
  return normalize(s).replace(LEADING_ARTICLES, '');
}

/**
 * Sobrenomes dos autores, para comparar autoria de forma tolerante.
 * Aceita "Machado de Assis; José de Alencar", "Assis, Machado de" e "A e B".
 */
export function authorSurnames(authors: string | null | undefined): Set<string> {
  const out = new Set<string>();
  const people = String(authors ?? '').split(/;|&|\se\s|\sand\s/i);
  for (const person of people) {
    const p = person.trim();
    if (!p) continue;
    // "Sobrenome, Nome" → o sobrenome vem antes da vírgula.
    const surnamePart = p.includes(',') ? p.split(',')[0] : p.split(/\s+/).pop() ?? '';
    const words = normalize(surnamePart).split(' ').filter((w) => w.length > 2);
    const last = words.pop();
    if (last) out.add(last);
  }
  return out;
}

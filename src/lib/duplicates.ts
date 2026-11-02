import { toIsbn13 } from './isbn';
import { authorSurnames, normalize, normalizeTitle } from './normalize';

/** Campos mínimos de um livro usados na conferência de duplicatas. */
export interface BookLike {
  id: string;
  titulo?: string | null;
  autores?: string | null;
  edicao?: string | null;
  isbn?: string | null;
}

export type DuplicateReason = 'mesmo ISBN' | 'mesmo título e autor' | 'mesmo título, edição diferente';

export interface DuplicateMatch<T extends BookLike> {
  book: T;
  reason: DuplicateReason;
}

/**
 * Procura no acervo livros iguais ao candidato.
 * Regras (as mesmas do app web de casa):
 * 1. ISBN igual, comparando sempre em ISBN-13 (aceita 10 ou 13 dígitos).
 * 2. Título normalizado igual e pelo menos um sobrenome de autor em comum
 *    (se um dos dois não tiver autor, basta o título).
 * 3. Título igual com edições diferentes aparece marcado, para a pessoa decidir.
 */
export function findDuplicates<T extends BookLike>(
  candidate: Omit<BookLike, 'id'> & { id?: string },
  library: Iterable<T>,
  limit = 5,
): DuplicateMatch<T>[] {
  const isbn = candidate.isbn ? toIsbn13(candidate.isbn) : null;
  const title = normalizeTitle(candidate.titulo);
  const surnames = authorSurnames(candidate.autores);
  const edition = normalize(candidate.edicao);
  const out: DuplicateMatch<T>[] = [];

  for (const book of library) {
    if (candidate.id && book.id === candidate.id) continue;

    const otherIsbn = book.isbn ? toIsbn13(book.isbn) : null;
    if (isbn && otherIsbn && isbn === otherIsbn) {
      out.push({ book, reason: 'mesmo ISBN' });
    } else if (title && normalizeTitle(book.titulo) === title) {
      const other = authorSurnames(book.autores);
      const authorMatches = !surnames.size || !other.size || [...surnames].some((s) => other.has(s));
      if (authorMatches) {
        const otherEdition = normalize(book.edicao);
        const differentEdition = edition && otherEdition && edition !== otherEdition;
        out.push({ book, reason: differentEdition ? 'mesmo título, edição diferente' : 'mesmo título e autor' });
      }
    }
    if (out.length >= limit) break;
  }
  return out;
}

import { describe, expect, it } from '@jest/globals';
import { cleanIsbn, findIsbns, isValidIsbn10, isValidIsbn13, toIsbn13 } from '../isbn';

describe('isbn', () => {
  it('limpa separadores', () => {
    expect(cleanIsbn('85-359-0277-5')).toBe('8535902775');
    expect(cleanIsbn('0-8044-2957-x')).toBe('080442957X');
  });

  it('valida ISBN-10, inclusive com X', () => {
    expect(isValidIsbn10('85-359-0277-5')).toBe(true);
    expect(isValidIsbn10('0-8044-2957-X')).toBe(true);
    expect(isValidIsbn10('85-359-0277-4')).toBe(false);
  });

  it('valida ISBN-13', () => {
    expect(isValidIsbn13('978-85-359-0277-8')).toBe(true);
    expect(isValidIsbn13('978-85-359-0277-7')).toBe(false);
    expect(isValidIsbn13('123-45-678-9012-3')).toBe(false);
  });

  it('converte ISBN-10 para ISBN-13', () => {
    expect(toIsbn13('8535902775')).toBe('9788535902778');
    expect(toIsbn13('9788535902778')).toBe('9788535902778');
    expect(toIsbn13('1234567890')).toBeNull();
  });

  it('acha ISBN em texto de ficha catalográfica', () => {
    const text = [
      'Dados Internacionais de Catalogação na Publicação (CIP)',
      'Assis, Machado de, 1839-1908',
      'Dom Casmurro / Machado de Assis. - São Paulo : Companhia das Letras, 2016.',
      'ISBN 978-85-359-0277-8',
      '1. Romance brasileiro I. Título. CDD-869.93',
    ].join('\n');
    expect(findIsbns(text)).toEqual(['9788535902778']);
  });

  it('corrige O e l lidos no lugar de 0 e 1', () => {
    expect(findIsbns('ISBN 85-359-O277-5')).toEqual(['9788535902778']);
  });

  it('não confunde anos e números de página com ISBN', () => {
    expect(findIsbns('1ª edição, 1985. 320 p. 21 cm')).toEqual([]);
  });
});

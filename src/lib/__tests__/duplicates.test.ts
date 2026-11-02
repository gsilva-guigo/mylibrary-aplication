import { describe, expect, it } from '@jest/globals';
import { findDuplicates } from '../duplicates';
import { authorSurnames, normalizeTitle } from '../normalize';
import { toCsv } from '../csv';
import { summarizeOcr } from '../ocr';

const library = [
  { id: '1', titulo: 'Dom Casmurro', autores: 'Machado de Assis', edicao: '1ª ed.', isbn: '8535902775' },
  { id: '2', titulo: 'O Cortiço', autores: 'Aluísio Azevedo', edicao: '', isbn: '' },
  { id: '3', titulo: 'Memórias Póstumas de Brás Cubas', autores: 'Assis, Machado de', edicao: '3ª ed.', isbn: '' },
];

describe('normalização', () => {
  it('ignora acento, caixa e artigo inicial', () => {
    expect(normalizeTitle('O Cortiço')).toBe('cortico');
    expect(normalizeTitle('  cortico ')).toBe('cortico');
  });

  it('extrai sobrenomes nos dois formatos', () => {
    expect([...authorSurnames('Machado de Assis')]).toEqual(['assis']);
    expect([...authorSurnames('Assis, Machado de')]).toEqual(['assis']);
    expect([...authorSurnames('Jorge Amado; Zélia Gattai')]).toEqual(['amado', 'gattai']);
  });
});

describe('findDuplicates', () => {
  it('acha pelo ISBN mesmo com 10 e 13 dígitos', () => {
    const r = findDuplicates({ titulo: 'Outro título', isbn: '978-85-359-0277-8' }, library);
    expect(r.map((m) => [m.book.id, m.reason])).toEqual([['1', 'mesmo ISBN']]);
  });

  it('acha por título e sobrenome do autor', () => {
    const r = findDuplicates({ titulo: 'cortico', autores: 'Azevedo, Aluísio' }, library);
    expect(r.map((m) => [m.book.id, m.reason])).toEqual([['2', 'mesmo título e autor']]);
  });

  it('marca edição diferente', () => {
    const r = findDuplicates({ titulo: 'Memorias postumas de Bras Cubas', autores: 'Machado de Assis', edicao: '5ª ed.' }, library);
    expect(r[0].reason).toBe('mesmo título, edição diferente');
  });

  it('não acusa duplicata quando o autor é outro', () => {
    expect(findDuplicates({ titulo: 'Dom Casmurro', autores: 'Fulano de Tal' }, library)).toEqual([]);
  });

  it('ignora o próprio livro ao editar', () => {
    expect(findDuplicates({ id: '1', titulo: 'Dom Casmurro', isbn: '8535902775' }, library)).toEqual([]);
  });
});

describe('csv e resumo do OCR', () => {
  it('gera CSV para Excel brasileiro', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'diz "oi"']])).toBe('﻿a;b\r\n"x;y";"diz ""oi"""');
  });

  it('separa ISBN e ano sem confundir os dois', () => {
    const s = summarizeOcr(['São Paulo : Brasiliense, 1985', 'ISBN 85-359-0277-5'], 2026);
    expect(s.isbns).toEqual(['9788535902778']);
    expect(s.years).toEqual([1985]);
    expect(s.lineCount).toBe(2);
  });
});

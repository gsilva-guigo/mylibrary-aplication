import { findIsbns } from './isbn';

/** O que o app consegue tirar sozinho, sem IA, do texto lido pelo celular. */
export interface OcrSummary {
  text: string;
  lineCount: number;
  charCount: number;
  isbns: string[];
  years: number[];
}

/**
 * Junta as linhas devolvidas pelo reconhecimento de texto e extrai o que dá
 * sem IA: ISBNs válidos e anos plausíveis de edição (1800 até o ano atual).
 */
export function summarizeOcr(lines: string[], currentYear = new Date().getFullYear()): OcrSummary {
  const cleaned = lines.map((l) => l.trim()).filter(Boolean);
  const text = cleaned.join('\n');
  const isbns = findIsbns(text);

  // Anos: tira os dígitos dos ISBNs antes, para não confundir "978-85-359-..." com um ano.
  let withoutIsbn = text;
  for (const m of text.match(/(?:\d[\d\s.\-–]{8,20}[\dXx])/g) ?? []) withoutIsbn = withoutIsbn.replace(m, ' ');
  const years = [
    ...new Set(
      (withoutIsbn.match(/\b(1[89]\d{2}|20\d{2})\b/g) ?? []).map(Number).filter((y) => y >= 1800 && y <= currentYear),
    ),
  ];

  return { text, lineCount: cleaned.length, charCount: text.length, isbns, years };
}

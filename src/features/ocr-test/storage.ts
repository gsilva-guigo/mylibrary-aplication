import { File, Paths } from 'expo-file-system';

import { toCsv } from '@/lib/csv';

/** Como a pessoa avaliou o texto lido pelo celular. */
export type Verdict = 'legivel' | 'com-erros' | 'ilegivel';

export const VERDICT_LABEL: Record<Verdict, string> = {
  legivel: 'Legível',
  'com-erros': 'Com erros',
  ilegivel: 'Ilegível',
};

/** Um teste de leitura de uma folha de rosto. */
export interface OcrTrial {
  id: string;
  createdAt: string;
  ms: number;
  lineCount: number;
  charCount: number;
  isbn: string | null;
  years: number[];
  verdict: Verdict | null;
  text: string;
}

const LOG_FILE = 'ocr-trials.json';

function logFile(): File {
  return new File(Paths.document, LOG_FILE);
}

export async function loadTrials(): Promise<OcrTrial[]> {
  try {
    const f = logFile();
    if (!f.exists) return [];
    const data = JSON.parse(await f.text());
    return Array.isArray(data) ? (data as OcrTrial[]) : [];
  } catch {
    return [];
  }
}

export async function saveTrials(trials: OcrTrial[]): Promise<void> {
  await logFile().write(JSON.stringify(trials));
}

/** Gera o CSV dos testes num arquivo temporário e devolve o endereço para compartilhar. */
export async function writeTrialsCsv(trials: OcrTrial[]): Promise<string> {
  const csv = toCsv(
    ['data', 'avaliacao', 'segundos', 'linhas', 'caracteres', 'isbn', 'anos', 'texto'],
    trials.map((t) => [
      t.createdAt.slice(0, 16).replace('T', ' '),
      t.verdict ? VERDICT_LABEL[t.verdict] : '',
      (t.ms / 1000).toFixed(1).replace('.', ','),
      t.lineCount,
      t.charCount,
      t.isbn ?? '',
      t.years.join(', '),
      t.text,
    ]),
  );
  const f = new File(Paths.cache, `testes-leitura-${new Date().toISOString().slice(0, 10)}.csv`);
  await f.write(csv);
  return f.uri;
}

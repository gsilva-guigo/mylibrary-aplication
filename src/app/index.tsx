import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type OcrTrial,
  type Verdict,
  VERDICT_LABEL,
  loadTrials,
  saveTrials,
  writeTrialsCsv,
} from '@/features/ocr-test/storage';
import { summarizeOcr } from '@/lib/ocr';
import { type Theme, useTheme } from '@/theme';

/**
 * Etapa 1 do roteiro: testar se o reconhecimento de texto do próprio celular
 * lê bem as folhas de rosto do acervo. Nada sai do aparelho; os testes ficam
 * salvos localmente e podem ser exportados em CSV para análise.
 */
export default function OcrTestScreen() {
  const t = useTheme();
  const s = useMemo(() => styles(t), [t]);

  const [trials, setTrials] = useState<OcrTrial[]>([]);
  const [current, setCurrent] = useState<{ uri: string; trial: OcrTrial } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTrials().then(setTrials);
  }, []);

  async function read(source: 'camera' | 'library') {
    setMessage(null);
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setMessage('Sem acesso à câmera. Libere em Ajustes > MyLibrary > Câmera.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      setBusy(true);
      const started = Date.now();
      const lines = await extractTextFromImage(uri);
      const summary = summarizeOcr(lines);
      const trial: OcrTrial = {
        id: `${started}`,
        createdAt: new Date(started).toISOString(),
        ms: Date.now() - started,
        lineCount: summary.lineCount,
        charCount: summary.charCount,
        isbn: summary.isbns[0] ?? null,
        years: summary.years,
        verdict: null,
        text: summary.text,
      };
      setCurrent({ uri, trial });
    } catch (e) {
      setMessage(`Não foi possível ler a foto: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function rate(verdict: Verdict) {
    if (!current) return;
    const next = [{ ...current.trial, verdict }, ...trials];
    setTrials(next);
    setCurrent(null);
    await saveTrials(next);
    setMessage(`Teste salvo como "${VERDICT_LABEL[verdict]}". Fotografe o próximo livro.`);
  }

  async function exportCsv() {
    try {
      const uri = await writeTrialsCsv(trials);
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Exportar testes de leitura' });
    } catch (e) {
      setMessage(`Não foi possível exportar: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const stats = useMemo(() => {
    const n = trials.length;
    const pct = (k: number) => (n ? Math.round((k / n) * 100) : 0);
    return {
      n,
      legivel: pct(trials.filter((x) => x.verdict === 'legivel').length),
      comErros: pct(trials.filter((x) => x.verdict === 'com-erros').length),
      ilegivel: pct(trials.filter((x) => x.verdict === 'ilegivel').length),
      isbn: pct(trials.filter((x) => x.isbn).length),
      seconds: n ? (trials.reduce((a, x) => a + x.ms, 0) / n / 1000).toFixed(1) : '0',
    };
  }, [trials]);

  if (!isSupported) {
    return (
      <View style={[s.screen, s.center]}>
        <Text style={s.body}>Este aparelho não oferece reconhecimento de texto.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.lead}>
        Fotografe a folha de rosto de livros do acervo e avalie se o texto lido pelo celular está correto. Comece pelos
        mais antigos: são eles que decidem se a ideia funciona.
      </Text>

      <View style={s.row}>
        <Button t={t} label="Fotografar" onPress={() => read('camera')} primary disabled={busy} />
        <Button t={t} label="Escolher foto" onPress={() => read('library')} disabled={busy} />
      </View>

      {busy && (
        <View style={s.notice}>
          <ActivityIndicator color={t.accent} />
          <Text style={s.body}>Lendo o texto no aparelho…</Text>
        </View>
      )}
      {message && <Text style={[s.body, s.notice]}>{message}</Text>}

      {current && (
        <View style={s.card}>
          <Image source={{ uri: current.uri }} style={s.photo} resizeMode="contain" />
          <View style={s.metaRow}>
            <Meta t={t} label="Tempo" value={`${(current.trial.ms / 1000).toFixed(1)} s`} />
            <Meta t={t} label="Linhas" value={String(current.trial.lineCount)} />
            <Meta t={t} label="ISBN" value={current.trial.isbn ?? 'não achado'} />
            <Meta t={t} label="Ano" value={current.trial.years.join(', ') || '—'} />
          </View>
          <Text style={s.label}>Texto lido</Text>
          <Text style={s.mono} selectable>
            {current.trial.text || '(nenhum texto reconhecido)'}
          </Text>
          <Text style={s.label}>Comparando com a página, o texto está:</Text>
          <View style={s.row}>
            <Button t={t} label="Legível" onPress={() => rate('legivel')} tone="good" />
            <Button t={t} label="Com erros" onPress={() => rate('com-erros')} tone="warn" />
            <Button t={t} label="Ilegível" onPress={() => rate('ilegivel')} tone="bad" />
          </View>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.h2}>Resultado até agora</Text>
        {stats.n === 0 ? (
          <Text style={s.body}>Nenhum livro testado. A meta é testar pelo menos 20, misturando épocas e editoras.</Text>
        ) : (
          <>
            <View style={s.metaRow}>
              <Meta t={t} label="Testados" value={String(stats.n)} />
              <Meta t={t} label="Legíveis" value={`${stats.legivel}%`} />
              <Meta t={t} label="Com erros" value={`${stats.comErros}%`} />
              <Meta t={t} label="Ilegíveis" value={`${stats.ilegivel}%`} />
              <Meta t={t} label="Com ISBN" value={`${stats.isbn}%`} />
              <Meta t={t} label="Tempo médio" value={`${stats.seconds} s`} />
            </View>
            <Button t={t} label="Exportar testes (CSV)" onPress={exportCsv} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Button({
  t,
  label,
  onPress,
  primary,
  disabled,
  tone,
}: {
  t: Theme;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const color = tone ? t[tone] : primary ? t.accentText : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          paddingVertical: 13,
          paddingHorizontal: 14,
          borderRadius: 10,
          alignItems: 'center',
          backgroundColor: primary ? t.accent : t.sunk,
          borderWidth: tone ? 1.5 : 0,
          borderColor: tone ? color : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={{ color, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

function Meta({ t, label, value }: { t: Theme; label: string; value: string }) {
  return (
    <View style={{ minWidth: '30%', flexGrow: 1, gap: 2 }}>
      <Text style={{ color: t.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { padding: 16, gap: 16, paddingBottom: 48 },
    lead: { color: t.muted, fontSize: 15, lineHeight: 21 },
    body: { color: t.text, fontSize: 15, lineHeight: 21 },
    h2: { color: t.text, fontSize: 18, fontWeight: '700' },
    label: { color: t.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    notice: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: t.accentSoft, padding: 12, borderRadius: 10 },
    card: { backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 16, gap: 14 },
    photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: t.sunk },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 12 },
    mono: { color: t.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, lineHeight: 19, backgroundColor: t.sunk, padding: 12, borderRadius: 8 },
  });

// ============================================================================
//  Biblioteca de metricas — regras do sistema (com tratamento de indisponivel)
//
//  REGRAS IMPORTANTES:
//   - Metrica ausente = null = "Nao disponivel". NUNCA vira 0.
//   - Taxa geral: soma todas as interacoes e todo o alcance, DEPOIS divide.
//     Nunca a media simples das taxas individuais.
//   - Toda divisao trata denominador 0 -> null (Nao disponivel).
// ============================================================================

export type Snapshot = {
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  profile_visits: number | null;
  followers_generated: number | null;
  video_duration_s: number | null;
  video_avg_watch_s: number | null;
};

export const NA = "Nao disponivel";

/** Soma que ignora null. Retorna null se TODOS forem null (nada disponivel). */
export function sumOrNull(values: (number | null | undefined)[]): number | null {
  let acc = 0;
  let any = false;
  for (const v of values) {
    if (v != null) {
      acc += v;
      any = true;
    }
  }
  return any ? acc : null;
}

/** Divisao segura: denominador 0/null/negativo -> null. */
export function safeDiv(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** Interacoes = curtidas + comentarios + compartilhamentos + salvamentos. */
export function interactions(m: Partial<Snapshot> | null | undefined): number | null {
  if (!m) return null;
  return sumOrNull([m.likes, m.comments, m.shares, m.saves]);
}

/** Engajamento do post = interacoes / alcance * 100. */
export function engagement(m: Snapshot | null | undefined): number | null {
  if (!m) return null;
  const r = safeDiv(interactions(m), m.reach);
  return r == null ? null : r * 100;
}

export const shareRate = (m: Snapshot) => pctOrNull(m.shares, m.reach);
export const saveRate = (m: Snapshot) => pctOrNull(m.saves, m.reach);
export const commentRate = (m: Snapshot) => pctOrNull(m.comments, m.reach);
export const followerConversion = (m: Snapshot) => pctOrNull(m.followers_generated, m.reach);
export const profileVisitConversion = (m: Snapshot) =>
  pctOrNull(m.followers_generated, m.profile_visits);

function pctOrNull(a: number | null, b: number | null): number | null {
  const r = safeDiv(a, b);
  return r == null ? null : r * 100;
}

/** Retencao media de video = tempo medio assistido / duracao * 100. */
export function retention(m: Snapshot): number | null {
  return pctOrNull(m.video_avg_watch_s, m.video_duration_s);
}

/** Indice de repeticao = visualizacoes / alcance (acima de 1 = pessoas reviram). */
export function repetition(m: Snapshot): number | null {
  return safeDiv(m.views, m.reach);
}

/** Taxa geral do periodo: soma interacoes / soma alcance * 100 (agregada). */
export function generalEngagement(snaps: Snapshot[]): number | null {
  const totalInter = sumOrNull(snaps.map((s) => interactions(s)));
  const totalReach = sumOrNull(snaps.map((s) => s.reach));
  const r = safeDiv(totalInter, totalReach);
  return r == null ? null : r * 100;
}

/** Formatacao pt-BR; null vira "Nao disponivel". */
export function fmtInt(n: number | null): string {
  return n == null ? NA : Math.round(n).toLocaleString("pt-BR");
}
export function fmtPct(n: number | null, dec = 2): string {
  return n == null ? NA : n.toFixed(dec).replace(".", ",") + "%";
}
export function fmtNum(n: number | null, dec = 2): string {
  return n == null ? NA : n.toFixed(dec).replace(".", ",");
}

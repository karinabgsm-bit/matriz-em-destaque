import { supabase } from "./supabase";
import type { Snapshot } from "./metrics";

export type Status =
  | "ideia"
  | "em_producao"
  | "aguardando_aprovacao"
  | "aprovado"
  | "reprovado"
  | "agendado"
  | "publicado"
  | "arquivado";

export const STATUS_LABEL: Record<Status, string> = {
  ideia: "Ideia",
  em_producao: "Em produção",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  agendado: "Agendado",
  publicado: "Publicado",
  arquivado: "Arquivado",
};
export const STATUS_ORDER: Status[] = [
  "ideia",
  "em_producao",
  "aguardando_aprovacao",
  "aprovado",
  "reprovado",
  "agendado",
  "publicado",
  "arquivado",
];

export type Matrix = "hero" | "hub" | "help" | null;
export type Perm = "aderencia" | "profundidade" | null;

export type Content = {
  id: string;
  title: string;
  description: string | null;
  matrix_type: Matrix;
  permeability: Perm;
  audience: string | null;
  objective: string | null;
  cta: string | null;
  hook: string | null;
  script: string | null;
  caption: string | null;
  keywords: string | null;
  guests: string | null;
  collaborators: string | null;
  media_path: string | null;
  status: Status;
  scheduled_date: string | null;
  scheduled_time: string | null;
  published_at: string | null;
  origin: string;
  is_imported: boolean;
  is_unplanned: boolean;
  permalink: string | null;
  facebook_link: string | null;
  external_media_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentWithMetric = Content & { metric: Snapshot | null };

const METRIC_COLS =
  "reach,views,likes,comments,shares,saves,profile_visits,followers_generated,video_duration_s,video_avg_watch_s,captured_at";

/** Busca conteudos + o snapshot de metrica mais recente de cada um. */
export async function listContent(): Promise<ContentWithMetric[]> {
  const { data: items, error } = await supabase
    .from("content_items")
    .select("*")
    .order("scheduled_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const { data: snaps } = await supabase
    .from("metric_snapshots")
    .select("content_id," + METRIC_COLS)
    .order("captured_at", { ascending: false });

  const latest = new Map<string, Snapshot>();
  for (const s of (snaps as any[]) ?? []) {
    if (!latest.has(s.content_id)) latest.set(s.content_id, s as Snapshot);
  }
  return (items as Content[]).map((c) => ({ ...c, metric: latest.get(c.id) ?? null }));
}

export async function createContent(patch: Partial<Content>): Promise<Content> {
  const { data, error } = await supabase
    .from("content_items")
    .insert({ title: "Novo conteúdo", ...patch })
    .select("*")
    .single();
  if (error) throw error;
  return data as Content;
}

export async function updateContent(id: string, patch: Partial<Content>): Promise<void> {
  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  if (error) throw error;
}

/** Aprovar/reprovar (César): unico caminho permitido pelo banco. */
export async function decide(contentId: string, decision: "aprovado" | "reprovado", motivo?: string) {
  const { error } = await supabase.rpc("approve_content", {
    p_content: contentId,
    p_decision: decision,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
}

export async function listComments(contentId: string) {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("content_id", contentId)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function integrationStatus() {
  const { data } = await supabase
    .from("integration_accounts")
    .select("*")
    .eq("provider", "instagram")
    .maybeSingle();
  return data;
}

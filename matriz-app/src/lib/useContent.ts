import { useCallback, useEffect, useState } from "react";
import { listContent, ContentWithMetric } from "./db";

export function useContent() {
  const [items, setItems] = useState<ContentWithMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const data = await listContent();
      setItems(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}

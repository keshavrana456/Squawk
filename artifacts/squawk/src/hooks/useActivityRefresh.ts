import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const DEBOUNCE_MS = 2000;

export function useActivityRefresh() {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        qc.invalidateQueries();
      }, DEBOUNCE_MS);
    };

    const unsubscribe = qc.getMutationCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        (event.mutation?.state.status === "success" ||
          event.mutation?.state.status === "error")
      ) {
        schedule();
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [qc]);
}

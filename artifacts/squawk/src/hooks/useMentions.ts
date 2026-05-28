import { useState, useEffect, useRef, useCallback, RefObject } from "react";

export interface MentionUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export function useMentions(
  text: string,
  setText: (val: string) => void,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
) {
  const [query, setQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectMention = useCallback((val: string, cursorPos?: number) => {
    const pos = cursorPos ?? val.length;
    const before = val.slice(0, pos);
    const match = before.match(/@(\w*)$/);
    setQuery(match ? match[1] : null);
  }, []);

  const handleChange = useCallback(
    (val: string) => {
      setText(val);
      const el = inputRef.current;
      const pos = el ? (el.selectionStart ?? val.length) : val.length;
      detectMention(val, pos);
    },
    [setText, inputRef, detectMention]
  );

  useEffect(() => {
    if (query === null) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.users || []).slice(0, 6));
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const insertMention = useCallback(
    (username: string) => {
      const el = inputRef.current;
      const pos = el ? (el.selectionStart ?? text.length) : text.length;
      const before = text.slice(0, pos);
      const after = text.slice(pos);
      const newBefore = before.replace(/@\w*$/, `@${username} `);
      const newText = newBefore + after;
      setText(newText);
      setQuery(null);
      setSuggestions([]);
      setTimeout(() => {
        if (!el) return;
        el.focus();
        const newPos = newBefore.length;
        el.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [text, setText, inputRef]
  );

  const dismiss = useCallback(() => {
    setQuery(null);
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    isOpen: query !== null && (suggestions.length > 0 || loading),
    handleChange,
    insertMention,
    dismiss,
  };
}

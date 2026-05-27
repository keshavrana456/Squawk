import React, { createContext, useContext, useState, useCallback } from "react";

interface ActiveChatContextValue {
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
}

const ActiveChatContext = createContext<ActiveChatContextValue>({
  activeConversationId: null,
  setActiveConversationId: () => {},
});

export function ActiveChatProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationIdState] = useState<number | null>(null);

  const setActiveConversationId = useCallback((id: number | null) => {
    setActiveConversationIdState(id);
  }, []);

  return (
    <ActiveChatContext.Provider value={{ activeConversationId, setActiveConversationId }}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  return useContext(ActiveChatContext);
}

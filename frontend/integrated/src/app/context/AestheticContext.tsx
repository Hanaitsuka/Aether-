import React, { createContext, useContext, useState, ReactNode } from 'react';

type AestheticMode = '3d' | '2d';

interface AestheticContextType {
  mode: AestheticMode;
  toggleMode: () => void;
}

const AestheticContext = createContext<AestheticContextType | undefined>(undefined);

export function AestheticProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AestheticMode>('3d');

  const toggleMode = () => {
    setMode(prev => prev === '3d' ? '2d' : '3d');
  };

  return (
    <AestheticContext.Provider value={{ mode, toggleMode }}>
      {children}
    </AestheticContext.Provider>
  );
}

export function useAesthetic() {
  const context = useContext(AestheticContext);
  if (!context) {
    throw new Error('useAesthetic must be used within AestheticProvider');
  }
  return context;
}

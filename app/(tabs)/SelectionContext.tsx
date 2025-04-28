// app/(tabs)/SelectionContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

type SelectionContextType = {
  isSelecting: boolean;
  setIsSelecting: (flag: boolean) => void;
};

const SelectionContext = createContext<SelectionContextType>({
  isSelecting: false,
  setIsSelecting: () => {},
});

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  return (
    <SelectionContext.Provider value={{ isSelecting, setIsSelecting }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => useContext(SelectionContext);

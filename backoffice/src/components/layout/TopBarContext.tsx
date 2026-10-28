import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

interface TopBarContextType {
  breadcrumbEl: HTMLDivElement | null;
  actionsEl: HTMLDivElement | null;
  setBreadcrumbEl: (el: HTMLDivElement | null) => void;
  setActionsEl: (el: HTMLDivElement | null) => void;
}

const TopBarContext = createContext<TopBarContextType>({
  breadcrumbEl: null,
  actionsEl: null,
  setBreadcrumbEl: () => {},
  setActionsEl: () => {},
});

export const TopBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [breadcrumbEl, setBreadcrumbEl] = useState<HTMLDivElement | null>(null);
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);

  return (
    <TopBarContext.Provider
      value={{
        breadcrumbEl,
        actionsEl,
        setBreadcrumbEl,
        setActionsEl,
      }}
    >
      {children}
    </TopBarContext.Provider>
  );
};

export const useTopBar = () => useContext(TopBarContext);

export const TopBarBreadcrumb: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { breadcrumbEl } = useContext(TopBarContext);
  if (!breadcrumbEl) return null;
  return createPortal(children, breadcrumbEl);
};

export const TopBarActions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actionsEl } = useContext(TopBarContext);
  if (!actionsEl) return null;
  return createPortal(children, actionsEl);
};

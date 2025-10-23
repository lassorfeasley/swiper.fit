import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavBarVisibilityContextType {
  navBarVisible: boolean;
  setNavBarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavBarVisibilityContext = createContext<NavBarVisibilityContextType | null>(null);

interface NavBarVisibilityProviderProps {
  children: ReactNode;
}

export function NavBarVisibilityProvider({ children }: NavBarVisibilityProviderProps) {
  const [navBarVisible, setNavBarVisible] = useState<boolean>(true);
  return (
    <NavBarVisibilityContext.Provider value={{ navBarVisible, setNavBarVisible }}>
      {children}
    </NavBarVisibilityContext.Provider>
  );
}

export function useNavBarVisibility(): NavBarVisibilityContextType {
  const context = useContext(NavBarVisibilityContext);
  if (!context) {
    throw new Error('useNavBarVisibility must be used within a NavBarVisibilityProvider');
  }
  return context;
}

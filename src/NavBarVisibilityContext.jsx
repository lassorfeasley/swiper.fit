import React, { createContext, useContext, useState } from 'react';

const NavBarVisibilityContext = createContext();

export function NavBarVisibilityProvider({ children }) {
  const [navBarVisible, setNavBarVisible] = useState(true);
  return (
    <NavBarVisibilityContext.Provider value={{ navBarVisible, setNavBarVisible }}>
      {children}
    </NavBarVisibilityContext.Provider>
  );
}

export function useNavBarVisibility() {
  return useContext(NavBarVisibilityContext);
} 
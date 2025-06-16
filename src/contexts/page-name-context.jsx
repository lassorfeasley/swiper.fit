import React, { createContext, useState } from "react";

export const PageNameContext = createContext({
  setPageName: () => {},
  pageName: "",
});

export function PageNameProvider({ children }) {
  const [pageName, setPageName] = useState("");

  return (
    <PageNameContext.Provider value={{ pageName, setPageName }}>
      {children}
    </PageNameContext.Provider>
  );
}

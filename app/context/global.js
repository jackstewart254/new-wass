"use client";
import React, { createContext, useContext, useState } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [global, setGlobal] = useState({
    render: "cal",
    blocks: [],
    closeSelect: false,
    movingDate: new Date(),
    showPopup: false,
    popupContentType: "block", //block, date, new, edit and meeting
    popupContent: undefined,
    role: undefined,
  });

  return (
    <GlobalContext.Provider value={{ global, setGlobal }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);

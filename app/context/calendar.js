"use client";
import React, { createContext, useContext, useState } from "react";

const CalendarContext = createContext();



export const CalendarProvider = ({ children }) => {
  const [calendar, setCalendar] = useState({
    blocks: [],
    instances: [],
    meetings: [],
  });

  return (
    <CalendarContext.Provider value={{ calendar, setCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => useContext(CalendarContext);
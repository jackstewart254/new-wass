"use client";
import { motion } from "motion/react";
import { useCalendar } from "../context/calendar";

const InfoPopup = () => {
  const { calendar, setCalendar } = useCalendar();
  const { showPopup } = calendar;

  const confirmDeleteBlock = () => (
    <div
      className="w-[20%] border border-[#d9d9d9] flex bg-white absolute rounded-md p-5 gap-[10px] flex-col"
      style={{ zIndex: 1000 }}
    >
      <p className="text-sm font-[500] text-black">Block delete confirmation</p>
      <p className="text-sm font-[400] text-black">
        Deleting this block will include all meetings during those dates
      </p>
      <button className="w-full py-1 rounded-md bg-red-600">
        <p className="text-white text-sm font-[400]">Cancel</p>
      </button>
    </div>
  );

  return (
    <motion.div
      className="w-full h-full absolute items-center justify-center flex"
      initial={{ zIndex: -100, opacity: 0 }}
      animate={{ zIndex: 102, opacity: 1 }}
    >
      <div className="w-full h-full bg-black opacity-20" />
      {confirmDeleteBlock()}
    </motion.div>
  );
};

export default InfoPopup;

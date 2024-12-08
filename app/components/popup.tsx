"use client";
import { motion, useScroll } from "motion/react";
import { useGlobal } from "../context/global";

const Popup = () => {
  const { global, setGlobal } = useGlobal();
  const { showPopup, popupContentType, popupContent } = global;

  return (
    <motion.div
      initial={{ zIndex: -100, opacity: 0 }}
      transition={{ duration: 0.2 }}
      animate={{
        zIndex: showPopup === true ? 100 : -100,
        opacity: showPopup === true ? 1 : 0,
      }}
      className="w-screen h-screen absolute flex items-center justify-center"
    >
      <button
        className="w-full h-full absolute bg-black opacity-10"
        onClick={() => {
          setGlobal({ ...global, showPopup: false });
        }}
      />
      <div className="w-1/2 h-2/3 bg-white z-10 rounded-md border border-[#d9d9d9]"></div>
    </motion.div>
  );
};

export default Popup;

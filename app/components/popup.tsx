"use client";
import { motion } from "motion/react";
import { useGlobal } from "../context/global";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const Popup = () => {
  const { global, setGlobal } = useGlobal();
  const { showPopup, popupContentType, popupContent } = global;
  const time = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [dropdownContent, setDropdownContent] = useState<string>();

  useEffect(() => {
    console.log(popupContent, popupContentType);
  }, [popupContentType, popupContent]);

  const returnTimeOfDay = (time: number) => {
    console.log(time);
    if (time > 11) {
      if (time === 12) {
        return time.toString() + ":00pm";
      } else {
        return (time - 2).toString()[1] + ":00pm";
      }
    } else {
      return time.toString() + ":00am";
    }
  };

  const handleDropdownPress = (content: string) => {
    if (content === dropdownContent) {
      // Toggle dropdown visibility when the same content is pressed
      setShowDropdown(!showDropdown);
    } else {
      // Update the content and ensure dropdown is visible
      setDropdownContent(content);
      setShowDropdown(true);
    }
  };

  const dropdown = () => {
    return (
      <motion.div
        className="absolute top-[40px] border border-[#d9d9d9] bg-white rounded-md z-10 h-[calc(100vh/5)] overflow-auto no-scrollbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: showDropdown === true ? 1 : 0 }}
        style={{ width: dropdownContent === "date" ? "75%" : "100%" }}
      >
        {time.map((item, index) => {
          return (
            <div key={index} className="w-full">
              <button
                className="py-1 px-3 w-full flex items-start"
                style={{
                  borderBottom:
                    index + 1 < time.length
                      ? "1px solid #d9d9d9"
                      : "0px solid white",
                }}
              >
                <p className="text-sm font-[400]">
                  {item > 12
                    ? (item - 2).toString()[1] + ":00pm"
                    : item === 12
                    ? "12:00pm"
                    : item + ":00am"}
                </p>
              </button>
            </div>
          );
        })}
      </motion.div>
    );
  };

  const dateRender = () => (
    <div className="w-full h-full flex flex-col gap-[10px]">
      <div className="w-full flex flex-row justify-between">
        <p className="text-xl font-[500]">
          Edit<span className="text-[#0795ff]"> Date</span>
        </p>
        <p>X</p>
      </div>
      <div className="w-full grid grid-cols-2 justify-between gap-[10px]">
        <div className="w-full border border-[#d9d9d9] rounded-md h-9"></div>
        <div className="w-full border border-[#d9d9d9] rounded-md h-9"></div>
      </div>
    </div>
  );

  const blockRender = () => (
    <div className="w-full h-full gap-[10px] flex flex-col">
      <div className="w-full flex flex-row justify-between">
        <p className="text-base font-[400]">
          Edit <span className="font-[500]">{popupContent.title}</span>
        </p>
        <p className="text-sm font-[400]">
          {popupContent.type === true ? "Recurring" : "One-off"}
        </p>
      </div>
      <div className="flex flex-col gap-[5px]">
        <div className="w-full flex flex-row justify-between gap-[10px]">
          <p className="text-sm font-[400] text-[#a8a8a8]">Start date</p>
          <p className="text-sm font-[400] text-[#a8a8a8]">Recurring length</p>
        </div>
        <div className="flex flex-row w-full gap-[10px]">
          <div className="w-[90%] relative">
            <button
              className="w-full flex items-start px-3 py-1 border border-[#d9d9d9] rounded-md justify-between"
              onClick={() => {
                handleDropdownPress("date");
              }}
            >
              <p className="text-sm font-[400]">
                {format(popupContent.date, "EEEE, d, MMMM")}
              </p>
            </button>
            {dropdownContent === "date" && dropdown()}
          </div>
          <div className="w-[10%] relative">
            <button
              className="w-full px-3 py-1 border border-[#d9d9d9] rounded-md justify-between"
              onClick={() => {
                handleDropdownPress("length");
              }}
            >
              <p className="text-sm font-[400]">
                {popupContent.recurring_length}
              </p>
            </button>
            {dropdownContent === "length" && dropdown()}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[5px]">
        <div className="w-full flex flex-row justify-between gap-[10px]">
          <p className="text-sm font-[400] text-[#a8a8a8]">Start time</p>
          <p className="text-sm font-[400] text-[#a8a8a8]">End time</p>
        </div>
        <div className="w-full grid grid-cols-2 justify-between gap-[10px]">
          <div className="w-full relative">
            <button
              className="w-full border border-[#d9d9d9] rounded-md py-1 px-3 items-start flex"
              onClick={() => {
                handleDropdownPress("starttime");
              }}
            >
              <p className="text-sm font-[400]">
                {returnTimeOfDay(popupContent.start_time)}
              </p>
            </button>
            {dropdownContent === "starttime" && dropdown()}
          </div>
          <div className="w-full relative">
            <button
              className="w-full border border-[#d9d9d9] rounded-md py-1 px-3 items-start flex"
              onClick={() => {
                handleDropdownPress("endtime");
              }}
            >
              <p className="text-sm font-[400]">
                {returnTimeOfDay(popupContent.end_time)}
              </p>
            </button>
            {dropdownContent === "endtime" && dropdown()}
          </div>
        </div>
      </div>
      <div className="w-full flex flex-row rounded-md justify-between gap-[10px]">
        <button className="w-[30%] px-3 py-1 rounded-md bg-red-600">
          <p className="text-sm font-[400] text-white">Delete</p>
        </button>
        <button className="w-[70%] bg-blue-700 px-3 py-1 rounded-md">
          <p className="text-sm font-[400] text-white">Save</p>
        </button>
      </div>
    </div>
  );

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
      <div className="flex flex-col lg:w-[40%] gap-[10px] items-center z-10">
        <div className="w-1/2 h-9 bg-white border border-[#d9d9d9] items-center justify-center flex rounded-md">
          <p className="text-sm font-[400] text-black">
            Press off the popup to close
          </p>
        </div>
        <div className="w-full h-auto bg-white z-10 rounded-md border border-[#d9d9d9] flex flex-col p-5">
          {popupContent !== undefined && popupContentType === "block" ? (
            blockRender()
          ) : popupContentType === "date" ? (
            dateRender()
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Popup;

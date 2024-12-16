"use client";
import { motion } from "motion/react";
import { useGlobal } from "../context/global";
import { useEffect, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
} from "date-fns";

import Meeting from "../types/meeting";
import Block from "../types/block";
import { leftChevron, rightChevron } from "../calendar/components/svg";
import { apiConnection } from "../hooks/calls";
import { useCalendar } from "../context/calendar";

const Popup = () => {
  const { global, setGlobal } = useGlobal();
  const { showPopup, popupContentType, popupContent } = global;
  const time = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const weeks = [1, 2, 3, 4];
  const duration = [5, 10, 15, 20, 25, 30, 35, 40];
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [dropdownContent, setDropdownContent] = useState<string>();
  const [content, setContent] = useState<Block>();
  const [daysInMonth, setDaysInMonth] = useState<Date[]>();
  const [movingDate, setMovingDate] = useState<Date>();
  const today = new Date();
  const [changes, setChanges] = useState<boolean>(false);
  const { calendar, setCalendar } = useCalendar();

  useEffect(() => {
    if (popupContent !== undefined) {
      setMovingDate(popupContent.date);
      setContent(popupContent);
      generateDatesInMonth(popupContent.date);
    }
  }, [popupContent]);

  useEffect(() => {
    if (popupContentType === "new") {
      setMovingDate(today);
      setContent({
        id: "todaking",
        created_at: today,
        start_time: 8,
        end_time: 17,
        staff_id: "todaking",
        type: false,
        date: today,
        appointment_duration: 20,
        recurring_length: 0,
        title: "",
        room: "",
      });
      generateDatesInMonth(today);
    }
  }, [popupContentType]);

  const callSetBlock = async () => {
    const { blocks, instances, meetings } = await apiConnection(
      content,
      "insertBlock"
    );
    setCalendar({
      ...calendar,
      blocks: blocks,
      instances: instances,
    });
  };

  useEffect(() => {
    if (popupContentType !== "new") {
      const val = compareObjectValues();
    }
  }, [content]);

  const compareObjectValues = () => {
    for (let key in content) {
      if (content[key as keyof Block] !== popupContent[key as keyof Block]) {
        setChanges(true);
        return false;
      }
    }
    setChanges(false);
    return true;
  };

  const generateDatesInMonth = (inputDate: Date) => {
    const start = startOfMonth(new Date(inputDate));
    const end = endOfMonth(new Date(inputDate));
    const datesArray = eachDayOfInterval({ start, end });
    setDaysInMonth(datesArray);
  };

  const returnTimeOfDay = (time: number) => {
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
      setShowDropdown(!showDropdown);
    } else {
      setDropdownContent(content);
      setShowDropdown(true);
    }
  };

  const handleSelectTime = (time: number, property: boolean) => {
    if (property === false) {
      setContent({ ...content, start_time: time });
    } else {
      setContent({ ...content, end_time: time });
    }
    handleDropdownPress(property === true ? "endtime" : "starttime");
  };

  const handleUpdateRecurringLength = (length: number) => {
    setContent({ ...content, recurring_length: length });
    handleDropdownPress("length");
  };

  const handleUpdatingDIM = (call: boolean) => {
    if (call === true) {
      const newDate = addMonths(movingDate, 1);
      setMovingDate(newDate);
      generateDatesInMonth(newDate);
    } else {
      const newDate = addMonths(movingDate, -1);
      setMovingDate(newDate);
      generateDatesInMonth(newDate);
    }
  };

  const handleSelectDate = (date: Date) => {
    setContent({ ...content, date: date });
    handleDropdownPress("date");
  };

  const updateMeetingRoom = (room: string) => {
    setContent({ ...content, room: room });
  };

  const updateMeetingDuration = (duration: number) => {
    setContent({ ...content, appointment_duration: duration });
    handleDropdownPress("duration");
  };

  const handleUpdateContentType = (type: boolean) => {
    setContent({ ...content, type: type });
  };

  const dropdown = () => {
    return (
      <motion.div
        className="absolute top-[38px] rounded-md z-10 max-h-[calc(100vh/5)] overflow-auto scrollbar-hide w-full"
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: showDropdown === true ? 1 : 0,
          height: showDropdown === true ? "auto" : 0,
        }}
        transition={{ duration: 0.2 }}
        style={{
          backgroundColor: dropdownContent === "date" ? "transparent" : "white",
          border:
            dropdownContent === "date"
              ? "0px solid white"
              : "1px solid #d9d9d9",
          // height: showDropdown === true ? "auto" : 0,
        }}
      >
        {dropdownContent === "starttime" ? (
          time.map((item, index) => {
            return (
              <div key={index} className="w-full">
                {item < content.end_time ? (
                  <button
                    onClick={() => {
                      handleSelectTime(item, false);
                    }}
                    className="py-1 px-3 w-full flex items-start"
                    style={{
                      backgroundColor:
                        content.start_time === item ? "#0795FF" : "white",
                      borderBottom:
                        index + 1 < time.length
                          ? "1px solid #d9d9d9"
                          : "0px solid white",
                    }}
                  >
                    <p
                      className="text-sm font-[400]"
                      style={{
                        color: item === content?.start_time ? "white" : "black",
                      }}
                    >
                      {item > 12
                        ? (item - 2).toString()[1] + ":00pm"
                        : item === 12
                        ? "12:00pm"
                        : item + ":00am"}
                    </p>
                  </button>
                ) : (
                  <div
                    className="py-1 px-3 w-full flex items-start opacity-60"
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
                  </div>
                )}
              </div>
            );
          })
        ) : dropdownContent === "endtime" ? (
          time.map((item, index) => {
            return (
              <div key={index} className="w-full">
                {item > content?.start_time ? (
                  <button
                    onClick={() => {
                      handleSelectTime(item, true);
                    }}
                    className="py-1 px-3 w-full flex items-start"
                    style={{
                      backgroundColor:
                        content?.end_time === item ? "#0795FF" : "white",
                      borderBottom:
                        index + 1 < time.length
                          ? "1px solid #d9d9d9"
                          : "0px solid white",
                    }}
                  >
                    <p
                      className="text-sm font-[400]"
                      style={{
                        color: item === content?.end_time ? "white" : "black",
                      }}
                    >
                      {item > 12
                        ? (item - 2).toString()[1] + ":00pm"
                        : item === 12
                        ? "12:00pm"
                        : item + ":00am"}
                    </p>
                  </button>
                ) : (
                  <div
                    className="py-1 px-3 w-full flex items-start opacity-60"
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
                  </div>
                )}
              </div>
            );
          })
        ) : dropdownContent === "date" ? (
          <div className="flex flex-row gap-[10px] items-start">
            <div className="w-[70%] h-full grid grid-cols-7 grid-auto-rows bg-white rounded-md border border-[#d9d9d9] overflow-clip">
              {daysInMonth?.map((item, index) => {
                return (
                  <button
                    onClick={() => {
                      handleSelectDate(item);
                    }}
                    key={index}
                    className="w-full flex items-center justify-center py-1"
                    style={{
                      borderRight:
                        (index + 1) % 7 === 0
                          ? "0px solid white"
                          : "1px solid #d9d9d9",
                      borderBottom:
                        index + 1 > 28
                          ? "0px solid white"
                          : "1px solid #d9d9d9",
                      backgroundColor:
                        format(item, "dd:MM:yyyy") ===
                        format(content?.date, "dd:MM:yyyy")
                          ? "#0795FF"
                          : format(item, "dd:MM:yyyy") ===
                            format(today, "dd:MM:yyyy")
                          ? "#d9d9d9"
                          : "transparent",
                    }}
                  >
                    <p
                      className="text-sm font-[400]"
                      style={{
                        color:
                          format(item, "dd:MM:yyyy") ===
                          format(content?.date, "dd:MM:yyyy")
                            ? "white"
                            : "black",
                      }}
                    >
                      {format(item, "d")}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="w-[30%] rounded-md border border-[#d9d9d9] bg-white flex flex-row py-1 px-3 items-center">
              <button
                onClick={() => {
                  handleUpdatingDIM(false);
                }}
              >
                {leftChevron(12)}
              </button>
              <p className="w-full text-center text-sm font-[400]">
                {format(movingDate, "MMMM")}
              </p>
              <button
                onClick={() => {
                  handleUpdatingDIM(true);
                }}
              >
                {rightChevron(12)}
              </button>
            </div>
          </div>
        ) : // ) : (
        //   <div></div>
        // )
        dropdownContent === "length" ? (
          weeks.map((item, index) => {
            return (
              <div key={index} className="w-full">
                {item === content.recurring_length ? (
                  <div
                    className="flex px-3 py-1 items-center justify-center w-full"
                    style={{
                      backgroundColor:
                        content?.recurring_length === item
                          ? "#0795FF"
                          : "white",
                      borderBottom:
                        index + 1 < weeks.length
                          ? "1px solid #d9d9d9"
                          : "1px solid white",
                    }}
                  >
                    <p
                      className="text-sm font-[400]"
                      style={{
                        color:
                          content?.recurring_length === item
                            ? "white"
                            : "black",
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdateRecurringLength(item);
                    }}
                    className="flex px-3 py-1 items-center justify-center w-full"
                    style={{
                      backgroundColor:
                        content?.recurring_length === item
                          ? "#0795FF"
                          : "white",
                      borderBottom:
                        index + 1 < weeks.length
                          ? "1px solid #d9d9d9"
                          : "1px solid white",
                    }}
                  >
                    <p
                      className="text-sm font-[400]"
                      style={{
                        color:
                          content?.recurring_length === item
                            ? "white"
                            : "black",
                      }}
                    >
                      {item}
                    </p>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          duration.map((item, index) => {
            return (
              <button
                onClick={() => {
                  updateMeetingDuration(item);
                }}
                key={index}
                className="w-full items-center flex justify-center px-3 py-1"
                style={{
                  borderBottom:
                    index + 1 < duration.length
                      ? "1px solid #d9d9d9"
                      : "0px solid #d9d9d9",
                  backgroundColor:
                    content?.appointment_duration === item
                      ? "#0795FF"
                      : "white",
                }}
              >
                <p
                  className="text-sm font-[400]"
                  style={{
                    color:
                      content?.appointment_duration === item
                        ? "white"
                        : "black",
                  }}
                >
                  {item}
                </p>
              </button>
            );
          })
        )}
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
          Edit <span className="font-[500]">{content.title}</span>
        </p>
        <p className="text-sm font-[400]">
          {content.type === true ? "Recurring" : "One-off"}
        </p>
      </div>
      <div className="flex flex-col gap-[5px]">
        <div className="w-full flex flex-row justify-between gap-[10px]">
          <p className="text-sm font-[400] text-[#a8a8a8]">Start date</p>
          <p className="text-sm font-[400] text-[#a8a8a8]">Recurring length</p>
        </div>
        <div className="flex flex-row w-full gap-[10px]">
          <div className="w-full relative">
            <button
              className="w-full flex items-start px-3 py-1 border border-[#d9d9d9] rounded-md justify-between"
              onClick={() => {
                handleDropdownPress("date");
              }}
            >
              <p className="text-sm font-[400]">
                {format(content.date, "EEEE, d, MMMM")}
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
              <p className="text-sm font-[400]">{content.recurring_length}</p>
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
                {returnTimeOfDay(content.start_time)}
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
                {returnTimeOfDay(content.end_time)}
              </p>
            </button>
            {dropdownContent === "endtime" && dropdown()}
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full gap-[5px]">
        <div className="flex flex-row w-full justify-between">
          <p className="text-sm font-[400] text-[#a8a8a8]">Meeting duration</p>
          <p className="text-sm font-[400] text-[#a8a8a8]">Meeting room</p>
        </div>
        <div className="w-full flex flex-row gap-[10px]">
          <div className="w-[10%] relative">
            <button
              onClick={() => {
                handleDropdownPress("duration");
              }}
              className="border border-[#d9d9d9] w-full rounded-md px-3 py-1 text-sm font-[400]"
            >
              <p>{content?.appointment_duration}</p>
            </button>
            {dropdownContent === "duration" && dropdown()}
          </div>
          <input
            className="border border-[#d9d9d9] w-full rounded-md px-3 py-1 text-sm font-[400] focus:border-[#0795FF]"
            value={content?.room}
            onChange={(event) => {
              updateMeetingRoom(event.target.value);
            }}
          />
        </div>
      </div>
      <div className="w-full flex flex-row rounded-md justify-between gap-[10px]">
        <button className="w-[30%] px-3 py-1 rounded-md bg-red-600">
          <p className="text-sm font-[400] text-white">Delete</p>
        </button>
        {changes === true ? (
          <button className="w-[70%] bg-[#0795FF] px-3 py-1 rounded-md">
            <p className="text-sm font-[400] text-white">Save</p>
          </button>
        ) : (
          <div className="w-[70%] bg-[#0795FF] px-3 py-1 rounded-md opacity-40 flex items-center justify-center">
            <p className="text-sm font-[400] text-white">Save</p>
          </div>
        )}
      </div>
    </div>
  );

  const newBlockRender = () => {
    return (
      <div className="w-full flex flex-col gap-[10px]">
        <div className="w-full flex flex-col gap-[5px]">
          <div className="flex flex-row w-full justify-between">
            <p className="text-sm font-[400] text-[#a8a8a8]">Title</p>
            <p className="text-sm font-[400] text-[#a8a8a8]">Type</p>
          </div>
          <div className="flex flex-row items-center justify-between gap-[10px]">
            <div
              className="border border-[#d9d9d9] rounded-md py-1 px-3  w-full"
              // placeholder="Wednesday recurring"
            >
              <p className="text-sm font-[400]">
                {format(content?.date, "eeee")}{" "}
                {content.type === true ? "recurring" : "one-off"}
              </p>
            </div>
            <div className="w-[200px] grid grid-cols-2 rounded-md overflow-auto border border-[#d9d9d9] relative">
              <motion.div
                className="bg-[#0795FF] w-[50%] h-full absolute"
                animate={{ left: content?.type === true ? "50%" : 0 }}
                transition={{ duration: 0.2 }}
              />
              <button
                className="w-full z-10 h-full py-1"
                onClick={() => {
                  handleUpdateContentType(false);
                }}
              >
                <motion.p
                  animate={{
                    color: content?.type === false ? "white" : "black",
                  }}
                  className="text-sm font-[400]"
                >
                  One-off
                </motion.p>
              </button>
              <button
                className="w-full h-full py-1 z-10"
                onClick={() => {
                  handleUpdateContentType(true);
                }}
              >
                <motion.p
                  animate={{
                    color: content?.type === true ? "white" : "black",
                  }}
                  className="text-sm font-[400]"
                >
                  Recurring
                </motion.p>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[5px]">
          <div className="w-full flex flex-row justify-between gap-[10px]">
            <p className="text-sm font-[400] text-[#a8a8a8]">Start date</p>
            {content.type === true && (
              <p className="text-sm font-[400] text-[#a8a8a8]">
                Recurring length
              </p>
            )}
          </div>
          <div className="flex flex-row w-full gap-[10px]">
            <div className="w-full relative">
              <button
                className="w-full flex items-start px-3 py-1 border border-[#d9d9d9] rounded-md justify-between"
                onClick={() => {
                  handleDropdownPress("date");
                }}
              >
                <p className="text-sm font-[400]">
                  {format(content?.date, "EEEE, d, MMMM")}
                </p>
              </button>
              {dropdownContent === "date" && dropdown()}
            </div>
            {content.type === true && (
              <div className="w-[10%] relative">
                <button
                  className="w-full px-3 py-1 border border-[#d9d9d9] rounded-md justify-between"
                  onClick={() => {
                    handleDropdownPress("length");
                  }}
                >
                  <p className="text-sm font-[400]">
                    {content?.recurring_length}
                  </p>
                </button>
                {dropdownContent === "length" && dropdown()}
              </div>
            )}
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
                  {returnTimeOfDay(content?.start_time)}
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
                  {returnTimeOfDay(content?.end_time)}
                </p>
              </button>
              {dropdownContent === "endtime" && dropdown()}
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full gap-[5px]">
          <div className="flex flex-row w-full justify-between">
            <p className="text-sm font-[400] text-[#a8a8a8]">
              Meeting duration
            </p>
            <p className="text-sm font-[400] text-[#a8a8a8]">Meeting room</p>
          </div>
          <div className="w-full flex flex-row gap-[10px]">
            <div className="w-[10%] relative">
              <button
                onClick={() => {
                  handleDropdownPress("duration");
                }}
                className="border border-[#d9d9d9] w-full rounded-md px-3 py-1 text-sm font-[400]"
              >
                <p>{content?.appointment_duration}</p>
              </button>
              {dropdownContent === "duration" && dropdown()}
            </div>
            <input
              className="border border-[#d9d9d9] w-full rounded-md px-3 py-1 text-sm font-[400] focus:border-[#0795FF]"
              value={content?.room}
              onChange={(event) => {
                updateMeetingRoom(event.target.value);
              }}
            />
          </div>
        </div>
        {popupContentType === "block" ? (
          <div className="w-full flex flex-row rounded-md justify-between gap-[10px]">
            <button className="w-[30%] px-3 py-1 rounded-md bg-red-600">
              <p className="text-sm font-[400] text-white">Delete</p>
            </button>
            {changes === true ? (
              <button className="w-[70%] bg-[#0795FF] px-3 py-1 rounded-md">
                <p className="text-sm font-[400] text-white">Save</p>
              </button>
            ) : (
              <div className="w-[70%] bg-[#0795FF] px-3 py-1 rounded-md opacity-40 flex items-center justify-center">
                <p className="text-sm font-[400] text-white">Save</p>
              </div>
            )}
          </div>
        ) : popupContentType === "new" ? (
          <div className="w-full flex flex-row rounded-md justify-between gap-[10px]">
            <button className="w-[30%] px-3 py-1 rounded-md bg-red-600">
              <p className="text-sm font-[400] text-white">Delete</p>
            </button>
            <button
              className="w-full py-1 bg-[#0795FF] rounded-md"
              onClick={callSetBlock}
            >
              <p className="text-sm font-[400] text-white">Set Block</p>
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

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
          {content !== undefined && popupContentType === "block" ? (
            blockRender()
          ) : popupContentType === "date" ? (
            dateRender()
          ) : popupContentType === "new" ? (
            content !== undefined && newBlockRender()
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Popup;

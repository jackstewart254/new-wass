"use client";
import { use, useEffect, useState } from "react";
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
} from "date-fns";
import { downChevron, leftChevron, rightChevron } from "./svg";
import {
  fetchBlocks,
  insertBlock,
  updateBlock,
  deleteBlock,
  updateCancelEmail,
  fetchCancellationEmail,
} from "@/app/api/calls";
import {
  setMilliseconds,
  setSeconds,
  setMinutes,
  setHours,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { SyncLoader } from "react-spinners";
import { defaultMaxListeners } from "events";
import { setGlobal } from "next/dist/trace";
import { useGlobal } from "@/app/context/global";

type block = {
  id: string;
  type: boolean;
  date: Date;
  start_time: number;
  end_time: number;
  appointment_duration: number;
  recurring_length: number;
  title: string;
  room: string;
};

type expandedBlock = {
  id: string;
  created_at: Date;
  staff_id: string;
  type: boolean;
  date: Date;
  start_time: number;
  end_time: number;
  appointment_duration: number;
  recurring_length: number;
  title: string;
};

const SettingsPanel = ({
  height,
  email,
}: {
  height: number;
  email: string;
}) => {
  const { global, setGlobal } = useGlobal();
  const { blocks: globalBlocks } = global;
  const [render, setRender] = useState(0);
  const [addBlock, setAddBlock] = useState(false);
  const [daysInMonth, setDaysInMonth] = useState<Date[]>();
  const today = new Date();
  const [selectedStartDate, setSelectedStartDate] = useState<Date>();
  const [addBlockRender, setAddBlockRender] = useState(0);
  const [showDropDown, setShowDropDown] = useState(-1);
  const [dropDownContent, setDropDownContent] = useState<string>();
  const [blockObject, setBlockObject] = useState<block>({
    id: "",
    type: false,
    date: new Date(),
    start_time: 8,
    end_time: 17,
    appointment_duration: 20,
    recurring_length: 0,
    title: "",
    room: "",
  });
  const [daysInWeek, setDaysInWeek] = useState<Date[]>();
  const [blocks, setBlocks] = useState<expandedBlock[]>();
  const durationArray = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const times = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const recurring_length = [2, 3, 4, 5];
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelEmail, setCancelEmail] = useState<string>();
  const [movingDate, setMovingDate] = useState<Date>(new Date());

  useEffect(() => {
    setBlocks(globalBlocks);
  }, [globalBlocks]);

  useEffect(() => {
    callFetchCancelEmail(email);
  }, [email]);

  const callFetchCancelEmail = async (email: string) => {
    const response = await fetchCancellationEmail(email);
    setCancelEmail(response.data.data);
  };

  const callUpdateCancelEmail = async () => {
    const response = await updateCancelEmail(cancelEmail, email);
    console.log(response);
  };

  const getDaysOfCurrentWeek = (date: Date) => {
    const daysOfWeek = eachDayOfInterval({
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    });

    return daysOfWeek;
  };

  const callDeleteBlock = async (id: string) => {
    console.log("id", id);
    const { data } = await deleteBlock(id);
    console.log(data.data);
    if (data.error === null) {
      console.log("error");
      setBlocks(data.fetchAll);
    }
  };

  const generateDate = (date: Date, hour: number) => {
    const specificTime = setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(date), hour), 0), 0),
      0
    );
    return specificTime;
  };

  const callUpdateBlock = async () => {
    const { data, error } = await updateBlock(blockObject);
    console.log(data, error);
    setLoading(false);
    setAddBlock(false);
  };

  const callInsertBlock = async () => {
    let newTitle;
    const {
      type,
      date,
      start_time,
      end_time,
      appointment_duration,
      recurring_length,
      title,
      room,
    } = blockObject;
    if (title === "") {
      newTitle =
        format(date, "EEEE") + " " + (type === true ? "Recurring" : "One-off");
    } else {
      newTitle = title;
    }
    const response = await insertBlock(
      type,
      date,
      start_time,
      end_time,
      appointment_duration,
      recurring_length,
      newTitle,
      email,
      room
    );
    console.log("response", response.data);
    setLoading(false);
    setAddBlock(false);
    setBlockObject({
      id: "",
      type: false,
      date: new Date(),
      start_time: 8,
      end_time: 17,
      appointment_duration: 20,
      recurring_length: 0,
      title: "",
      room: "",
    });
    if (response.data.allBookingsError === null) {
      setGlobal({ ...global, blocks: response.data.allBookings });
      setBlocks(response.data.allBookings);
      setRender(0);
    }
  };

  const handleUpdateBlock = ({
    num,
    str,
    bool,
    call,
    date,
  }: {
    num: number;
    str: string;
    bool: boolean;
    call: number;
    date: Date;
  }) => {
    if (call === 0) {
      setBlockObject({ ...blockObject, title: str });
    }
    if (call === 1) {
      setBlockObject({ ...blockObject, appointment_duration: num });
    }
    if (call === 2) {
      setBlockObject({ ...blockObject, start_time: num });
    }
    if (call === 3) {
      setBlockObject({ ...blockObject, end_time: num });
    }
    if (call === 4) {
      setBlockObject({ ...blockObject, date: date });
    }
    if (call === 5) {
      setBlockObject({ ...blockObject, recurring_length: num });
    }
    if (call === 6) {
      setBlockObject({ ...blockObject, type: bool });
    }
    if (call === 7) {
      setBlockObject({ ...blockObject, room: str });
    }
  };

  const getDaysInMonth = (date: Date) => {
    return eachDayOfInterval({
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  };

  const handlePressDropdown = (content: number) => {
    if (showDropDown === content) {
      setShowDropDown(-1);
    } else {
      setShowDropDown(content);
    }
  };

  useEffect(() => {
    setDaysInMonth(getDaysInMonth(movingDate));
    setDaysInWeek(getDaysOfCurrentWeek(movingDate));
  }, [movingDate]);

  useEffect(() => {
    console.log(daysInWeek);
  }, [daysInWeek]);

  const dropDown = () => (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: height * 0.18,
        backgroundColor: "white",
        borderRadius: 4,
        border: "1px solid #d9d9d9",
        top: 31,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        padding: 10,
        overflowY: "auto",
      }}
    >
      {showDropDown > 0 &&
        showDropDown < 5 &&
        times.map((time, index) => {
          let endTimeSet = false;
          if (blockObject.end_time > 0) {
            endTimeSet = true;
          }
          if (showDropDown === 1 || showDropDown === 3) {
            if (endTimeSet) {
              if (time < blockObject.end_time) {
                return (
                  <button
                    onClick={() => {
                      showDropDown === 1
                        ? handleUpdateBlock({ num: time, call: 2 })
                        : handleUpdateBlock({ num: time, call: 3 });
                      setShowDropDown(-1);
                    }}
                    key={index}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      // marginBottom: index + 1 === times.length ? 10 : 0,
                    }}
                  >
                    <p>
                      {index > 4 ? (time - 2).toString()[1] : time}
                      {index > 4 ? "pm" : "am"}
                    </p>
                    <div
                      style={{
                        width: "100%",
                        height: 1,
                        backgroundColor:
                          index + 1 === times.length ? "white" : "#d9d9d9",
                        marginTop: index + 1 === times.length ? 0 : 10,
                        marginBottom: index + 1 === times.length ? 0 : 10,
                      }}
                    />
                  </button>
                );
              } else {
                return (
                  <div
                    key={index}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      // marginBottom: index + 1 === times.length ? 10 : 0,
                    }}
                  >
                    <p style={{ color: "#a8a8a8" }}>
                      {index > 4 ? (time - 2).toString()[1] : time}
                      {index > 4 ? "pm" : "am"}
                    </p>
                    <div
                      style={{
                        width: "100%",
                        height: 1,
                        backgroundColor:
                          index + 1 === times.length ? "white" : "#d9d9d9",
                        marginTop: index + 1 === times.length ? 0 : 10,
                        marginBottom: index + 1 === times.length ? 0 : 10,
                      }}
                    />
                  </div>
                );
              }
            } else {
              return (
                <button
                  onClick={() => {
                    showDropDown === 1
                      ? handleUpdateBlock({ num: time, call: 2 })
                      : handleUpdateBlock({ num: time, call: 3 });
                    setShowDropDown(-1);
                  }}
                  key={index}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    // marginBottom: index + 1 === times.length ? 10 : 0,
                  }}
                >
                  <p>
                    {index > 4 ? (time - 2).toString()[1] : time}
                    {index > 4 ? "pm" : "am"}
                  </p>
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      backgroundColor:
                        index + 1 === times.length ? "white" : "#d9d9d9",
                      marginTop: index + 1 === times.length ? 0 : 10,
                      marginBottom: index + 1 === times.length ? 0 : 10,
                    }}
                  />
                </button>
              );
            }
          }
          if (showDropDown === 2 || showDropDown === 4) {
            if (time > blockObject.start_time) {
              return (
                <button
                  onClick={() => {
                    showDropDown === 1
                      ? handleUpdateBlock({ num: time, call: 2 })
                      : handleUpdateBlock({ num: time, call: 3 });
                    setShowDropDown(-1);
                  }}
                  key={index}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    // marginBottom: index + 1 === times.length ? 10 : 0,
                  }}
                >
                  <p>
                    {index > 4 ? (time - 2).toString()[1] : time}
                    {index > 4 ? "pm" : "am"}
                  </p>
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      backgroundColor:
                        index + 1 === times.length ? "white" : "#d9d9d9",
                      marginTop: index + 1 === times.length ? 0 : 10,
                      marginBottom: index + 1 === times.length ? 0 : 10,
                    }}
                  />
                </button>
              );
            } else {
              return (
                <div
                  key={index}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    // marginBottom: index + 1 === times.length ? 10 : 0,
                  }}
                >
                  <p style={{ color: "#a8a8a8" }}>
                    {index > 4 ? (time - 2).toString()[1] : time}
                    {index > 4 ? "pm" : "am"}
                  </p>
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      backgroundColor:
                        index + 1 === times.length ? "white" : "#d9d9d9",
                      marginTop: index + 1 === times.length ? 0 : 10,
                      marginBottom: index + 1 === times.length ? 0 : 10,
                    }}
                  />
                </div>
              );
            }
          }
        })}
      {showDropDown === 0 &&
        durationArray.map((duration, index) => (
          <button
            onClick={() => {
              handleUpdateBlock({ num: duration, call: 1 });
              setShowDropDown(-1);
            }}
            key={index}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              // marginBottom: index + 1 === times.length ? 10 : 0,
            }}
          >
            <p>{duration}m</p>
            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor:
                  index + 1 === durationArray.length ? "white" : "#d9d9d9",
                marginTop: index + 1 === durationArray.length ? 0 : 10,
                marginBottom: index + 1 === durationArray.length ? 0 : 10,
              }}
            />
          </button>
        ))}
      {showDropDown === 5 &&
        daysInWeek?.map((days, index) => (
          <button
            onClick={() => {
              handleUpdateBlock({ date: days, call: 4 });
              setShowDropDown(-1);
            }}
            key={index}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              marginBottom: daysInWeek + 1 === times.length ? 10 : 0,
            }}
          >
            <p>{format(days, "EEEE")}</p>
            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor:
                  index + 1 === daysInWeek.length ? "white" : "#d9d9d9",
                marginTop: index + 1 === daysInWeek.length ? 0 : 10,
                marginBottom: index + 1 === daysInWeek.length ? 0 : 10,
              }}
            />
          </button>
        ))}
      {showDropDown === 6 &&
        recurring_length?.map((week, index) => (
          <button
            onClick={() => {
              handleUpdateBlock({ num: week, call: 5 });
              setShowDropDown(-1);
            }}
            key={index}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              marginBottom: recurring_length + 1 === times.length ? 10 : 0,
            }}
          >
            <p>{week} weeks</p>
            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor:
                  index + 1 === recurring_length.length ? "white" : "#d9d9d9",
                marginTop: index + 1 === recurring_length.length ? 0 : 10,
                marginBottom: index + 1 === recurring_length.length ? 0 : 10,
              }}
            />
          </button>
        ))}
    </div>
  );

  const oneOff = () => (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>Title:</p>
      <input
        value={blockObject.title}
        placeholder="e.g. Monday Block"
        onChange={(event) => {
          handleUpdateBlock({ str: event.target.value, call: 0 });
        }}
        style={{
          border: "1px solid #d9d9d9",
          width: "100%",
          borderRadius: 10,
          outline: "none",
          padding: 10,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <p style={{ color: "#a8a8a8" }}>Date:</p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => {
              setMovingDate(addDays(movingDate, -31));
            }}
          >
            {leftChevron(9)}
          </button>
          <p
            style={{
              marginLeft: 10,
              marginRight: 10,
              width: 30,
              textAlign: "center",
            }}
          >
            {format(movingDate, "MMM")}
          </p>
          <button
            onClick={() => {
              setMovingDate(addDays(movingDate, 31));
            }}
          >
            {rightChevron(9)}
          </button>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: height * 0.24,
          borderRadius: 10,
          border: "1px solid #d9d9d9",
          flexWrap: "wrap",
          display: "flex",
          flexDirection: "row",
          marginBottom: 20,
        }}
      >
        {daysInMonth.map((date, index) => {
          const isToday =
            format(date, "dd:MM:yyy") === format(today, "dd:MM:yyy");
          const selected =
            format(date, "dd:MM:yyyy") ===
            format(blockObject.date, "dd:MM:yyyy");
          return (
            <button
              onClick={() => {
                handleUpdateBlock({ date: date, call: 4 });
              }}
              key={index}
              style={{
                width: "14.27%",
                height: (height * 0.24) / 5,
                borderRight:
                  (index + 1) % 7 === 0
                    ? "0px solid #d9d9d9"
                    : "1px solid #d9d9d9",
                borderBottom:
                  index + 1 > 28 ? "0px solid #d9d9d9" : "1px solid #d9d9d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  color: selected ? "orange" : isToday ? "#0795FF" : "black",
                }}
              >
                {format(date, "d")}
              </p>
            </button>
          );
        })}
      </div>
      <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>Appointment details</p>
      <div
        style={{
          marginBottom: 20,
          border: "1px solid #d9d9d9",
          borderRadius: 10,
          padding: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{ color: "#a8a8a8", paddingRight: 10 }}>
              Appointment duration:
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <button
                onClick={() => {
                  handlePressDropdown(0);
                }}
                style={{
                  height: 26,
                  width: 72,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    width: "80%",
                  }}
                >
                  {blockObject.appointment_duration}m
                </p>
                {downChevron()}
              </button>
              {showDropDown === 0 && dropDown()}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <p style={{ color: "#a8a8a8" }}>Room:</p>
          <input
            onChange={(event) => {
              handleUpdateBlock({ str: event.target.value, call: 7 });
            }}
            value={blockObject.room}
            style={{
              marginLeft: 10,
              width: 72,
              border: "1px solid #d9d9d9",
              height: 26,
              borderRadius: 4,
              paddingLeft: 5,
              outline: "none",
            }}
          />
        </div>
      </div>
      <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>Block details:</p>
      <div
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid #d9d9d9",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            padding: 10,
            alignItems: "center",
          }}
        >
          <p style={{ color: "#a8a8a8", paddingRight: 10 }}>Start time:</p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                handlePressDropdown(1);
              }}
              style={{
                height: 26,
                width: 72,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  width: "80%",
                }}
              >
                {blockObject.start_time > 12
                  ? (blockObject.start_time - 2).toString()[1]
                  : blockObject.start_time.toString()}
                {":00"}
                {blockObject.start_time > 12 ? "pm" : "am"}
              </p>
              {downChevron()}
            </button>
            {showDropDown === 1 && dropDown()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            padding: 10,
            alignItems: "center",
          }}
        >
          <p style={{ color: "#a8a8a8", paddingRight: 10 }}>End time:</p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                handlePressDropdown(2);
              }}
              style={{
                height: 26,
                width: 72,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  width: "80%",
                }}
              >
                {blockObject.end_time > 12
                  ? (blockObject.end_time - 2).toString()[1]
                  : blockObject.end_time.toString()}
                {":00"}
                {blockObject.end_time > 12 ? "pm" : "am"}
              </p>
              {downChevron()}
            </button>
            {showDropDown === 2 && dropDown()}
          </div>
        </div>
      </div>
    </div>
  );

  const recurring = () => (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>Title:</p>
      <input
        value={blockObject.title}
        placeholder="e.g. Monday Block"
        onChange={(event) => {
          handleUpdateBlock({ str: event.target.value, call: 0 });
        }}
        style={{
          border: "1px solid #d9d9d9",
          width: "100%",
          borderRadius: 10,
          outline: "none",
          padding: 10,
          marginBottom: 20,
        }}
      />
      <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>Appointment details</p>
      <div
        style={{
          marginBottom: 20,
          border: "1px solid #d9d9d9",
          borderRadius: 10,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#a8a8a8", paddingRight: 10 }}>Day:</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => {
                    handlePressDropdown(5);
                  }}
                  style={{
                    height: 26,
                    width: 100,
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      width: "80%",
                    }}
                  >
                    {format(blockObject.date, "EEEE")}
                  </p>
                  {downChevron()}
                </button>
                {showDropDown === 5 && dropDown()}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <p style={{ color: "#a8a8a8", paddingRight: 10 }}>
              Duration: <span>e.g. 10 weeks</span>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <button
                onClick={() => {
                  handlePressDropdown(6);
                }}
                style={{
                  height: 26,
                  width: 100,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    width: "80%",
                  }}
                >
                  {blockObject.recurring_length} weeks
                </p>
                {downChevron()}
              </button>
              {showDropDown === 6 && dropDown()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", width: "100%", paddingBottom: 10 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#a8a8a8", paddingRight: 10 }}>
                Appointment duration:
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => {
                    handlePressDropdown(0);
                  }}
                  style={{
                    height: 26,
                    width: 72,
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      width: "80%",
                    }}
                  >
                    {blockObject.appointment_duration}
                  </p>
                  {downChevron()}
                </button>
                {showDropDown === 0 && dropDown()}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#a8a8a8" }}>Room:</p>
              <input
                onChange={(event) => {
                  handleUpdateBlock({ str: event.target.value, call: 7 });
                }}
                value={blockObject.room}
                style={{
                  marginLeft: 10,
                  width: 72,
                  border: "1px solid #d9d9d9",
                  height: 26,
                  borderRadius: 4,
                  paddingLeft: 5,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            borderRadius: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#a8a8a8", paddingRight: 10 }}>Start time:</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => {
                    handlePressDropdown(1);
                  }}
                  style={{
                    height: 26,
                    width: 72,
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      width: "80%",
                    }}
                  >
                    {blockObject.start_time > 12
                      ? (blockObject.start_time - 2).toString()[1]
                      : blockObject.start_time.toString()}
                    {":00"}
                    {blockObject.start_time > 12 ? "pm" : "am"}
                  </p>
                  {downChevron()}
                </button>
                {showDropDown === 1 && dropDown()}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <p style={{ color: "#a8a8a8", paddingRight: 10 }}>End time:</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <button
                onClick={() => {
                  handlePressDropdown(2);
                }}
                style={{
                  height: 26,
                  width: 72,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    width: "80%",
                  }}
                >
                  {blockObject.end_time > 12
                    ? (blockObject.end_time - 2).toString()[1]
                    : blockObject.end_time.toString()}
                  {":00"}
                  {blockObject.end_time > 12 ? "pm" : "am"}
                </p>
                {downChevron()}
              </button>
              {showDropDown === 2 && dropDown()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const addEditBlock = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flexDirection: "row",
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: 30,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 10,
              border: "1px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ color: "white" }}>New block</p>
          </div>
          <button
            onClick={() => {
              setAddBlock(false);
              setBlockObject({
                id: "",
                type: false,
                date: new Date(),
                start_time: 8,
                end_time: 17,
                appointment_duration: 20,
                recurring_length: 0,
                title: "",
              });
              setEditing(false);
            }}
            style={{
              height: 30,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 10,
              border: "1px solid #FF2222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ color: "#FF2222" }}>Cancel</p>
          </button>
        </div>
        {editing === false && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                marginBottom: 10,
              }}
            >
              <p style={{ color: "#a8a8a8" }}>Type:</p>
            </div>
            <div
              style={{
                width: "100%",
                height: 30,
                borderRadius: 10,
                border: "1px solid #d9d9d9",
                overflow: "clip",
                display: "flex",
                flexDirection: "row",
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => {
                  setAddBlockRender(0);
                  handleUpdateBlock({ bool: false, call: 6 });
                }}
                style={{
                  width: "50%",
                  height: "100%",
                  backgroundColor: addBlockRender === 0 ? "#0795FF" : "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <p style={{ color: addBlockRender === 0 ? "white" : "black" }}>
                  One-off
                </p>
              </button>
              <button
                onClick={() => {
                  setAddBlockRender(1);
                  handleUpdateBlock({ bool: true, call: 6 });
                }}
                style={{
                  width: "50%",
                  height: "100%",
                  backgroundColor: addBlockRender === 1 ? "#0795FF" : "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <p style={{ color: addBlockRender === 1 ? "white" : "black" }}>
                  Recurring
                </p>
              </button>
            </div>
          </div>
        )}
        {addBlockRender === 0 ? oneOff() : recurring()}
      </div>
      <button
        onClick={() => {
          editing === false ? callInsertBlock() : callUpdateBlock();
          setLoading(true);
        }}
        style={{
          width: "100%",
          height: 30,
          borderRadius: 10,
          backgroundColor: "#0795FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "white" }}>{editing === true ? "Update" : "Save"}</p>
      </button>
    </div>
  );

  const block = (item: expandedBlock, index: number) => {
    if (item.type === true) {
      return (
        <div
          style={{
            width: "100%",
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            padding: 10,
            marginBottom: index + 1 === blocks.length ? 0 : 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Title:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.title}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Day:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {format(item.date, "EEEE")}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Type:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.type === true ? "Recurring" : "One-off"}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Ending:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.recurring_length}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Start time:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {format(item.start_time, "H:mm")}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              End time:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {format(item.end_time, "H:mm")}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Appointment duration:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.appointment_duration}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <button
              onClick={() => {
                callDeleteBlock(item.id);
              }}
              style={{
                height: 30,
                width: "25%",
                borderRadius: 4,
                border: "1px solid #FF2222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "#FF2222" }}>Delete</p>
            </button>
            <div style={{ width: 10 }} />
            <button
              onClick={() => {
                setAddBlock(true);
                setEditing(true);
                setBlockObject(item);
              }}
              style={{
                height: 30,
                width: "75%",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0795FF",
              }}
            >
              <p style={{ color: "white" }}>Edit</p>
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div
          style={{
            width: "100%",
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Title:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.title}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Day:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {format(item.date, "dd/MM/yyyy")}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Type:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.type === true ? "Recurring" : "One-off"}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Start time:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.start_time > 12
                  ? (item.start_time - 2).toString()[1]
                  : item.start_time}
                {":00"}
                {item.start_time > 12 ? "pm" : "am"}{" "}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              End time:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.end_time > 12
                  ? (item.end_time - 2).toString()[1]
                  : item.end_time}
                {":00"}
                {item.end_time > 12 ? "pm" : "am"}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8" }}>
              Appointment duration:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.appointment_duration}
              </span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Room:{" "}
              <span style={{ color: "black", paddingLeft: 10 }}>
                {item.room}
              </span>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <button
              onClick={() => {
                callDeleteBlock(item.id);
              }}
              style={{
                height: 30,
                width: "25%",
                borderRadius: 4,
                border: "1px solid #FF2222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "#FF2222" }}>Delete</p>
            </button>
            <div style={{ width: 10 }} />
            <button
              onClick={() => {
                setAddBlock(true);
                setEditing(true);
                setBlockObject(item);
              }}
              style={{
                height: 30,
                width: "75%",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0795FF",
              }}
            >
              <p style={{ color: "white" }}>Edit</p>
            </button>
          </div>
        </div>
      );
    }
  };

  const renderEmail = () => (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <p style={{ color: "#a8a8a8", marginBottom: 10 }}>
          Cancellation email:
        </p>
        <textarea
          onChange={(event) => {
            setCancelEmail(event.target.value);
          }}
          value={cancelEmail}
          style={{
            padding: 10,
            outline: "none",
            resize: "none",
            height: height * 0.3,
            width: "100%",
            borderRadius: 10,
            border: "1px solid #d9d9d9",
            fontWeight: "500",
            fontSize: 13,
            font: "inherit",
            marginBottom: 20,
          }}
        />
      </div>
      <button
        onClick={callUpdateCancelEmail}
        style={{
          width: "100%",
          height: 30,
          borderRadius: 10,
          backgroundColor: "#0795FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "white" }}>Save</p>
      </button>
    </div>
  );

  const renderBlock = () => (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          height: height * 0.7 - 100,
          border: "1px solid #d9d9d9",
          borderRadius: 10,
          marginBottom: 20,
          padding: 10,
          overflowY: "auto",
        }}
      >
        {blocks?.length > 0 ? (
          blocks?.map((item, index) => {
            return (
              <div key={(item.id, index)} style={{ width: "100%" }}>
                {block(item, index)}
              </div>
            );
          })
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>No blocks</p>
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setAddBlock(true);
        }}
        style={{
          width: "100%",
          height: 30,
          borderRadius: 10,
          border: "1px solid #0795FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#0795FF" }}>Add block</p>
      </button>
    </div>
  );

  const mainRenderPoint = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
      }}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        {renderBlock()}
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        alignItems: "center",
      }}
    >
      {loading === true && (
        <div
          style={{
            position: "absolute",
            padding: 10,
            border: "1px solid #d9d9d9",
            backgroundColor: "white",
            borderRadius: 10,
          }}
        >
          <SyncLoader size={7} />
        </div>
      )}
      {!addBlock ? mainRenderPoint() : addEditBlock()}
    </div>
  );
};

export default SettingsPanel;

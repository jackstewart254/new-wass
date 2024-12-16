"use client";

import {
  addWeeks,
  differenceInMinutes,
  eachDayOfInterval,
  endOfWeek,
  format,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfWeek,
} from "date-fns";
import { useEffect, useState } from "react";
import {
  accountRouting,
  apiConnection,
  fetchBlocks,
  fetchMeetingInfo,
  fetchMeetings,
} from "../hooks/calls";
import { loginRequest } from "../hooks/authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useGlobal } from "../context/global";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Meeting from "../types/meeting";
import Block from "../types/block";
import { validateUser } from "../hooks/validateUser";
import Header from "../components/header";
import Popup from "../components/popup";
import { useCalendar } from "../context/calendar";

const Cal = () => {
  const { global, setGlobal } = useGlobal();
  const { closeSelect, movingDate, role } = global;
  const [showSideBar, setShowSideBar] = useState(false);
  const [sideBarContent, setSideBarContent] = useState<String>();
  const constantDate = new Date();
  const [daysOfTheWeek, setDaysOfTheWeek] = useState<Date[]>([]);
  const [meetings, setMeetings] = useState<Block[]>();
  const authenticate = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const [msalInitialized, setMsalInitialized] = useState(false);
  const router = useRouter();
  const [account, setAccount] = useState<object>();
  const [meetingInformation, setMeetingInformation] = useState(null);
  const [pressedId, setPressedId] = useState<number>();
  const [loading, setLoading] = useState<boolean>();
  const [blockDates, setBlockDates] = useState<Block[]>([]);
  const [panelRender, setPanelRender] = useState<boolean>(false);
  const [blockRender, setBlockRender] = useState<boolean>(false);
  const { calendar, setCalendar } = useCalendar();
  const { blocks, instances } = calendar;

  useEffect(() => {
    fetchBMI();
  }, []);

  const fetchBMI = async () => {
    const response = await apiConnection(null, "fetchBMI");
    setCalendar({
      ...calendar,
      meetings: response.meetings,
      instances: response.instances,
      blocks: response.blocks,
    });
  };

  const callValidateUser = async () => {
    const res = await validateUser(instance, accounts);
    setGlobal({ ...global, role: res?.role });
    if (res?.allow === false) {
      router.push("./");
    }
  };

  useEffect(() => {
    if (accounts.length > 0 && role === undefined) {
      callValidateUser();
    } else {
      if (role === "false") {
        router.push("./book");
      }
    }
  }, [instance, accounts]);

  useEffect(() => {
    if (closeSelect === true) {
      callFetchMeetings();

      if (sideBarContent === "Select") {
        handleSelectPress();
      } else {
        setShowSideBar(false);
      }
    }
  }, [closeSelect]);

  useEffect(() => {
    if (account !== undefined) {
      callFetchMeetings();
    }
  }, [account]);

  const setBlockPopup = (content: Block) => {
    setGlobal({
      ...global,
      showPopup: true,
      popupContentType: "block",
      popupContent: content,
    });
  };

  const newBlockPopup = () => {
    setGlobal({ ...global, showPopup: true, popupContentType: "new" });
  };

  const setBlockDatePopup = (content: Meeting) => {
    setGlobal({
      ...global,
      showPopup: true,
      popupContentType: "date",
      popupContent: content,
    });
  };

  const fetchAccountRouting = async (email: string) => {
    const response = await accountRouting(email);
    console.log("Lemmings", response);
    if (response.data === false) {
      router.push("./book");
    }
  };

  const callFetchBlocks = async (email: string) => {
    const response = await fetchBlocks(email);
    console.log("blocks", response.data.data.blocks);
    console.log("blockDates", response.data.data.blockDates);
    setGlobal({ ...global, blocks: response.data.data.blocks });
    setBlockDates(response.data.data.blockDates);
  };

  const handleMeetingPress = (meeting: Meeting) => {
    setLoading(true);
    setPressedId(meeting.id);
    setSideBarContent("Meeting");
    if (meeting.id === pressedId) {
      if (showSideBar === true) {
        setShowSideBar(false);
      } else {
        setShowSideBar(true);
        setLoading(false);
      }
    } else {
      if (showSideBar === false) {
        setShowSideBar(true);
        collectMeetingInformation(meeting);
      } else {
        collectMeetingInformation(meeting);
      }
    }
  };

  const handleSettingPress = () => {
    setSideBarContent("Settings");
    if (showSideBar === false) {
      setShowSideBar(true);
    } else if (showSideBar === true && sideBarContent === "Settings") {
      setShowSideBar(false);
    }
  };

  const handleSelectPress = () => {
    setSideBarContent("Select");
    if (showSideBar === false) {
      setShowSideBar(true);
    } else if (showSideBar === true && sideBarContent === "Select") {
      setShowSideBar(false);
    }
  };

  const collectMeetingInformation = async (meeting: meeting) => {
    const { data, error } = await fetchMeetingInfo(
      meeting.staff_id,
      meeting.student_id
    );
    if (data !== undefined && data !== null) {
      const emails = await handleFetchEmails(data.data.student.email);
      console.log("week strong", emails);
      const meet = {
        emails: emails.value,
        meetingHistory: data.data.past_meetings,
        student: data.data.student,
        meetingDetails: meeting,
      };
      setLoading(false);
      setMeetingInformation(meet);
    }
  };

  const acquireToken = async () => {
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: instance.getActiveAccount(), // Use the active account here as well
      });
      const accessToken = tokenResponse.accessToken;
      console.log("Access Token:", accessToken);
      return accessToken;
    } catch (error) {
      // Fallback to login if silent token acquisition fails
      if (error instanceof InteractionRequiredAuthError) {
        const tokenResponse = await instance.acquireTokenPopup(loginRequest);
        return tokenResponse.accessToken;
      } else {
        console.error(error);
      }
    }
  };

  const fetchEmails = async (accessToken: string, email: string) => {
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/me/messages?$filter=sender/emailAddress/address eq '${email}'`,
        // `https://graph.microsoft.com/v1.0/me/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  };

  const handleFetchEmails = async (email: string) => {
    const accessToken = await acquireToken();
    if (accessToken) {
      const res = await fetchEmails(accessToken, email);
      return res;
    }
  };
  const times = [
    "8am",
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
  ];

  useEffect(() => {
    setDaysOfTheWeek(getWeekDays(movingDate));
  }, [movingDate]);

  const callFetchMeetings = async () => {
    const { data, error } = await fetchMeetings(account?.username);
    setMeetings(data.data);
  };

  const getWeekDays = (date: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    });
  };

  const calculateTopHeight = (date: Date) => {
    const eight = setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(date), 8), 0), 0),
      0
    );
    const difference = differenceInMinutes(new Date(date), eight);
    return difference * 1.333;
  };

  const calculateBlockHeight = (startTime: Date, endTime: Date) => {
    const eight = setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(startTime), 8), 0), 0),
      0
    );
    const start = differenceInMinutes(new Date(startTime), eight) * 1.333;
    const end = differenceInMinutes(new Date(endTime), eight) * 1.333;
    return { top: start, height: end - start };
  };

  const calculateDuration = (startTime: Date, endTime: Date) => {
    const difference = differenceInMinutes(
      new Date(endTime),
      new Date(startTime)
    );
    return difference * 1.333;
  };

  const renderBlock = () => (
    <div className="flex flex-col pb-[10px] border-b border-x rounded-md border-[#d9d9d9] gap-[10px]">
      <div className="grid grid-cols-2 gap-[10px] relative py-1 rounded-md overflow-clip border-y border-[#d9d9d9]">
        <motion.div
          className="w-1/2 h-full bg-[#0795ff] absolute"
          animate={{ left: blockRender === false ? 0 : "50%" }}
        />
        <motion.button
          className="text-sm font-[400] z-10"
          animate={{ color: blockRender === true ? "black" : "white" }}
          onClick={() => {
            setBlockRender(false);
          }}
        >
          Blocks
        </motion.button>
        <motion.button
          className="text-sm font-[400] z-10"
          animate={{ color: blockRender === false ? "black" : "white" }}
          onClick={() => {
            setBlockRender(true);
          }}
        >
          Instance
        </motion.button>
      </div>
      <div className="flex max-h-[400px] px-[10px]">
        <div className="flex flex-col w-full gap-[10px] overflow-auto">
          {blockRender === false
            ? blocks.map((item, index) => {
                return (
                  <button
                    onClick={() => {
                      setBlockPopup(item);
                    }}
                    key={index}
                    className="w-full border border-[#d9d9d9] justify-start px-3 py-1 rounded-md flex flex-col gap-[10px]"
                  >
                    <div className="flex flex-row justify-between w-full">
                      <p className="text-sm font-[400] flex justify-start">
                        <span className="text-[#a8a8a8] mr-[5px]">Title: </span>
                        {item.title}
                      </p>
                      <p className="text-sm font-[400] flex justify-end">
                        <span className="text-[#a8a8a8] mr-[5px]">Type: </span>
                        {item.type === true ? "Recurring" : "One-off"}
                      </p>
                    </div>
                    <div className="flex flex-row justify-between w-full">
                      <p className="text-sm font-[400] flex justify-start">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          Start time:{" "}
                        </span>
                        {item.start_time > 12
                          ? (item.start_time - 2)[1] + ":00pm"
                          : item.start_time + ":00am"}
                      </p>
                      <p className="text-sm font-[400] flex justify-end">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          End time:{" "}
                        </span>
                        {item.end_time > 12
                          ? (item.end_time - 2).toString()[1] + ":00pm"
                          : item.end_time + ":00am"}{" "}
                      </p>
                    </div>
                    <div className="flex flex-row justify-between w-full">
                      <p className="text-sm font-[400] flex justify-start">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          Start date:{" "}
                        </span>
                        {format(item.date, "eee, dd, MMM")}
                      </p>
                      <p className="text-sm font-[400] flex justify-end">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          End date:{" "}
                        </span>
                        {format(
                          addWeeks(item.date, item.recurring_length),
                          "eee, dd, MMM"
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            : instances.map((item, index) => {
                console.log("index", index, item);
                return (
                  <button
                    onClick={() => {
                      setBlockDatePopup(item);
                    }}
                    key={index}
                    className="w-full border border-[#d9d9d9] justify-start px-3 py-1 rounded-md flex flex-col gap-[10px]"
                  >
                    <div className="grid grid-cols-2">
                      <p className="text-sm font-[400] flex justify-start">
                        <span className="text-[#a8a8a8] mr-[5px]">Title: </span>
                        {item.title}
                      </p>
                      <p className="text-sm font-[400] flex justify-end">
                        <span className="text-[#a8a8a8] mr-[5px]">Date: </span>
                        {format(item.date, "eee, d, MMM")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-sm font-[400] flex justify-start">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          Start time:{" "}
                        </span>
                        {item.start_time > 12
                          ? (item.start_time - 2)[1] + ":00pm"
                          : item.start_time + ":00am"}
                      </p>
                      <p className="text-sm font-[400] flex justify-end">
                        <span className="text-[#a8a8a8] mr-[5px]">
                          End time:{" "}
                        </span>
                        {item.end_time > 12
                          ? (item.end_time - 2).toString()[1] + ":00pm"
                          : item.end_time + ":00am"}{" "}
                      </p>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );

  const renderMeetings = () => <div></div>;

  return (
    <div className="w-screen h-screen flex flex-col relative">
      <Popup />
      <Header />
      <div className="w-full h-full flex flex-row p-5 gap-5">
        <div className="w-1/2 lg:w-2/3  h-full border border-[#d9d9d9] flex flex-col pr-5 pb-5 rounded-md items-start">
          <div className="w-full flex flex-row h-[80px]">
            <div className="w-[80px]" />
            <div className="w-full grid-cols-7 hidden lg:grid">
              {daysOfTheWeek.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="w-full flex items-center pt-5 flex-col"
                    style={
                      {
                        // borderLeft:
                        //   index === 0 ? "1px solid #d9d9d9" : "0px solid #d9d9d9",
                        // borderRight: "1px solid #d9d9d9",
                      }
                    }
                  >
                    <p className="text-sm font-[400]">{format(item, "eeee")}</p>
                    <p className="text-base font-[400]">{format(item, "d")}</p>
                  </div>
                );
              })}
            </div>
            <div className="w-full flex lg:hidden">
              <div className="w-full flex items-center pt-5 flex-col">
                <p className="text-sm font-[400]">
                  {format(movingDate, "eeee")}
                </p>
                <p className="text-base font-[400]">
                  {format(movingDate, "d")}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full h-full flex flex-row relative">
            <div className="w-[calc(100%-80px)] h-full border border-[#d9d9d9] z-0 absolute rounded-md flex right-0 top-0" />
            <div className="relative w-full h-[calc(100vh-196px)] rounded-md overflow-auto scrollbar-hide z-1 flex flex-row">
              <div
                className="flex flex-col w-[80px]"
                style={{ height: 100 * times.length }}
              >
                {times.map((item, index) => {
                  return (
                    <div
                      key={index}
                      className="h-[100px] w-full relative flex flex-row z-3"
                    >
                      <div className="w-[80px] h-full relative justify-center flex">
                        <p className="text-xs font-[400]">{item}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="w-full grid-cols-7 h-full hidden lg:grid rounded-md overflow-clip"
                style={{ height: 100 * times.length }}
              >
                {daysOfTheWeek.map((item, index) => {
                  return (
                    <div
                      key={index}
                      className="w-full relative flex flex-row z-3 h-full border-r border-[#d9d9d9]"
                    >
                      {index === 0 && (
                        <div className="bg-black w-full absolute top-[000px] h-[100px]" />
                      )}
                      <div className="h-full w-full relative flex flex-col">
                        {times.map((item, dIndex) => {
                          return (
                            <div
                              key={dIndex}
                              className="h-full hidden lg:flex relative"
                              style={{
                                borderBottom:
                                  dIndex + 1 < times.length
                                    ? "1px solid #d9d9d9"
                                    : "0px solid #d9d9d9",
                              }}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="w-full flex flex-col lg:hidden relative rounded-md overflow-clip"
                style={{ height: 100 * times.length }}
              >
                <div className="bg-black w-full absolute top-[0] h-[33px]" />
                {times.map((item, index) => {
                  return (
                    <div
                      key={index}
                      className="h-[100px] w-full relative flex flex-row z-3"
                      style={{
                        borderBottom:
                          index + 1 < times.length
                            ? "1px solid #d9d9d9"
                            : "0px solid white",
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 lg:w-1/3 border border-[#d9d9d9] rounded-md p-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 border py-1 rounded-md border-[#d9d9d9] relative overflow-clip">
            <motion.div
              className="w-1/2 bg-[#0795ff] absolute h-full"
              animate={{ left: panelRender === true ? "50%" : 0 }}
              transition={{ duration: 0.2 }}
            />
            <button
              className="z-10"
              onClick={() => {
                setPanelRender(false);
              }}
            >
              <motion.p
                className="text-sm font-[400]"
                animate={{ color: panelRender === true ? "black" : "white" }}
              >
                Blocks
              </motion.p>
            </button>
            <button
              className="z-10"
              onClick={() => {
                setPanelRender(true);
              }}
            >
              <motion.p
                className="text-sm font-[400]"
                animate={{ color: panelRender === true ? "white" : "black" }}
              >
                Meetings
              </motion.p>
            </button>
          </div>
          {panelRender === false ? renderBlock() : renderMeetings()}
          {panelRender === false && (
            <motion.button
              className="w-full bg-[#0795FF] rounded-md py-1"
              onClick={newBlockPopup}
            >
              <p className="text-sm font-[400] text-white">New block</p>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cal;

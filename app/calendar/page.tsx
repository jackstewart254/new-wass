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
  fetchBlocks,
  fetchMeetingInfo,
  fetchMeetings,
} from "../api/calls";
import { loginRequest } from "../api/authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useGlobal } from "../context/global";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import MSEncrypt, { encryptText } from "../encryption/encrypt";

type meeting = {
  id: number;
  created_at: Date;
  staff_id: string;
  student_id: string;
  start_time: Date;
  end_time: Date;
  meeting_purpose: string;
};

type blockDates = {
  id: string;
  created_at: Date;
  staff_id: string;
  type: boolean;
  date: Date;
  appointment_duration: number;
  recurring_length: number;
  title: string;
  start_time: number;
  end_time: number;
};

const Cal = () => {
  const { global, setGlobal } = useGlobal();
  const { closeSelect, movingDate, blocks } = global;
  const [showSideBar, setShowSideBar] = useState(false);
  const [sideBarContent, setSideBarContent] = useState<String>();
  const constantDate = new Date();
  const [daysOfTheWeek, setDaysOfTheWeek] = useState<Date[]>([]);
  const [meetings, setMeetings] = useState([]);
  const authenticate = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const [msalInitialized, setMsalInitialized] = useState(false);
  const router = useRouter();
  const [account, setAccount] = useState<object>();
  const [meetingInformation, setMeetingInformation] = useState(null);
  const [pressedId, setPressedId] = useState<number>();
  const [loading, setLoading] = useState<boolean>();
  const [blockDates, setBlockDates] = useState<blockDates[]>([]);
  const [panelRender, setPanelRender] = useState<boolean>(false);
  const [blockRender, setBlockRender] = useState<boolean>(false);

  useEffect(() => {
    if (instance && accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
      setAccount(accounts[0]);
      setMsalInitialized(true);
      fetchAccountRouting(accounts[0].username);
      callFetchBlocks(accounts[0].username);
    } else {
      router.push("./");
    }
  }, [instance, accounts]);

  useEffect(() => {
    const valuee = encryptText("Hello world");
    console.log(valuee);
  }, []);

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

  const callPopup = () => {
    setGlobal({ ...global, showPopup: true });
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
    console.log(response.data.data.blocks);
    setGlobal({ ...global, blocks: response.data.data.blocks });
    setBlockDates(response.data.data.blockDates);
  };

  const handleMeetingPress = (meeting: meeting) => {
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

  const handleSignOut = () => {
    instance.logoutPopup();
    router.push("./");
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
      <div className="grid grid-cols-2 gap-[10px] relative h-9 rounded-md overflow-clip border-y border-[#d9d9d9]">
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
      <div className="flex max-h-[200px] px-[10px]">
        <div className="flex flex-col w-full gap-[10px]">
          {blockRender === false
            ? blocks.map((item, index) => {
                return (
                  <button
                    onClick={() => {
                      callPopup();
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
                        <span className="text-[#a8a8a8] mr-[5px]">Type: </span>
                        {item.type === true ? "Recurring" : "One-off"}
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
                    <div className="grid grid-cols-2">
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
            : blockDates.map((item, index) => {
                return (
                  <button
                    onClick={() => {
                      callPopup();
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
    <div className="w-screen h-[calc(100vh-60px)] flex flex-row p-5 gap-5">
      <div className="w-2/3 h-full border border-[#d9d9d9] flex flex-col pr-5 pb-5 rounded-md items-start">
        <div className="w-full flex flex-row h-[80px]">
          <div className="w-[80px]" />
          <div className="w-full grid grid-cols-7">
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
        </div>
        <div className="w-full h-full flex flex-row relative">
          <div className="w-[calc(100%-80px)] h-full border border-[#d9d9d9] z-0 absolute rounded-md flex right-0 top-0" />
          <div className="relative w-full h-[calc(100vh-199px)] rounded-md overflow-auto scrollbar-hide z-1">
            {times.map((item, index) => {
              return (
                <div
                  key={index}
                  className="h-[100px] w-full relative flex flex-row z-3"
                >
                  <div className="w-[80px] h-full relative justify-center flex">
                    <p className="text-xs font-[400]">{item}</p>
                  </div>
                  <div
                    className="h-full w-[calc(100%-80px)] relative flex-row grid grid-cols-7"
                    style={{
                      borderBottom:
                        index + 1 < times.length
                          ? "1px solid #d9d9d9"
                          : "0px solid #d9d9d9",
                    }}
                  >
                    {daysOfTheWeek.map((item, dIndex) => {
                      return (
                        <div
                          key={dIndex}
                          className="border-r border-[#d9d9d9] h-full"
                        ></div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-1/3 border border-[#d9d9d9] h-full rounded-md p-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 border h-9 rounded-md border-[#d9d9d9] relative overflow-clip">
          <motion.div
            className="w-1/2 bg-[#0795ff] absolute h-9"
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
      </div>
    </div>
  );
};

export default Cal;

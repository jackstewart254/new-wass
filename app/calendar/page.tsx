"use client";
import { useState, useEffect } from "react";
import MeetingDetails from "./components/meetingDetails";
import { useGlobal } from "../context/global";
import {
  fetchMeetingInfo,
  fetchMeetings,
  fetchBlocks,
  accountRouting,
} from "../api/calls";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import {
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  differenceInMinutes,
  differenceInHours,
  setSeconds,
  setMinutes,
  setHours,
  setMilliseconds,
  addDays,
} from "date-fns";
import { leftChevron, rightChevron, settingSvg } from "./components/svg";
import { loginRequest } from "../api/authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import axios from "axios";
import { useRouter } from "next/navigation";
import Settings from "../settings/page";
import { RingLoader, SyncLoader } from "react-spinners";
import SettingsPanel from "./components/settings";
import SelectAll from "./components/selectAllAppointments";

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { global, setGlobal } = useGlobal();
  const { render, blocks, closeSelect, movingDate } = global;
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
  const [selectedDate, setSelectedDate] = useState<Date>();

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
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

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

  const grid = () => (
    <div
      style={{
        flexDirection: "column",
        display: "flex",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          height: 80,
          width: "100%",
          flexDirection: "row",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            alignItems: "flex-end",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{ width: 60, height: 1, borderBottom: "1px solid #d9d9d9" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
          {daysOfTheWeek.map((item, index) => {
            const block = blockDates.filter(
              (b) =>
                format(new Date(b.date), "dd/MM/yyyy") ===
                format(new Date(item), "dd/MM/yyyy")
            );
            const current =
              format(item, "dd:MM:yyyy") === format(constantDate, "dd:MM:yyyy");

            return (
              <button
                onClick={() => {
                  handleSelectPress();
                  setSideBarContent("Select");
                  setSelectedDate(item);
                }}
                style={{
                  width: "14.2%",
                  borderLeft: `${index === 0 ? "1px" : "0px"} solid #d9d9d9`,
                  borderRight: `1px solid #d9d9d9`,
                  display: "flex",
                  flexDirection: "column",
                  borderBottom: "1px solid #d9d9d9",
                  alignItems: "center",
                  paddingBottom: 10,
                }}
                key={index}
              >
                <p
                  style={{
                    paddingBottom: 5,
                    color:
                      block.length > 0
                        ? "orange"
                        : current
                        ? "#0795FF"
                        : "black",
                  }}
                >
                  {format(item, "EEEE")}
                </p>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color:
                      block.length > 0
                        ? "orange"
                        : current
                        ? "#0795FF"
                        : "black",
                  }}
                >
                  {format(item, "d")}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80 * 9,
          }}
        >
          {times.map((time, tIndex) => (
            <div
              key={tIndex}
              style={{
                height: 80,
                width: "100%",
                display: "flex",
                position: "relative",
                borderBottom: `${
                  tIndex === times.length - 1 ? "0px" : "1px"
                } solid #d9d9d9`,
                marginLeft: 60,
              }}
            >
              {tIndex > 0 && (
                <p
                  style={{
                    height: 12,
                    position: "absolute",
                    top: -7,
                    left: -40,
                  }}
                >
                  {time}
                </p>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            width: "100%",
            height: 80 * 9,
            display: "flex",
            flexDirection: "row",
            position: "relative",
            border: '1px solid "#D9D9D9',
          }}
        >
          {daysOfTheWeek.map((item, index) => {
            const block = blockDates.filter(
              (b) =>
                format(new Date(b.date), "dd/MM/yyyy") ===
                format(new Date(item), "dd/MM/yyyy")
            );

            let value = { top: 0, height: 0 };
            let top = new Date();
            let height = new Date();

            if (block.length > 0) {
              top = setMilliseconds(
                setSeconds(
                  setMinutes(setHours(new Date(), block[0].start_time), 0),
                  0
                ),
                0
              );
              height = setMilliseconds(
                setSeconds(
                  setMinutes(setHours(new Date(), block[0].end_time), 0),
                  0
                ),
                0
              );
              value = calculateBlockHeight(top, height);
              console.log(value);
            }
            const specificMeetings = meetings.filter(
              (m) =>
                format(m.start_time, "dd:MM:yyyy") ===
                format(item, "dd:MM:yyyy")
            );
            return (
              <div
                key={index}
                style={{
                  width: "14.2%",
                  borderRight: `1px solid #d9d9d9`,
                  borderLeft: `${index === 0 ? "1px" : "0px"} solid #D9D9D9`,
                  position: "relative",
                }}
              >
                {block.length > 0 && (
                  <div
                    style={{
                      top: value.top,
                      height: value.height,
                      width: "100%",
                      border: "1px solid orange",
                      position: "absolute",
                      zIndex: 1,
                    }}
                  ></div>
                )}
                {specificMeetings.length > 0 &&
                  specificMeetings.map((call) => {
                    const top = calculateTopHeight(call.start_time);
                    const height = calculateDuration(
                      call.start_time,
                      call.end_time
                    );
                    return (
                      <button
                        onClick={() => {
                          handleMeetingPress(call);
                        }}
                        key={call.id}
                        style={{
                          position: "absolute",
                          top: top,
                          height: height,
                          width: "100%",
                          backgroundColor: "#0795FF",
                          padding: 10,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "flex-start",
                          borderBottom: "1px solid white",
                          zIndex: 100,
                        }}
                      >
                        <p style={{ color: "white" }}>
                          {format(call.start_time, "hh:mm") +
                            " - " +
                            format(call.end_time, "hh:mm")}
                        </p>
                      </button>
                    );
                  })}
                {times.map((tIndex) => (
                  <div
                    key={tIndex}
                    style={{
                      height: 80,
                      width: "100%",
                      borderBottom: `1px solid #d9d9d9`,
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const calendar = () => (
    <div
      style={{
        width:
          showSideBar === false
            ? dimensions.width - 40
            : (dimensions.width - 60) * 0.66,
        height: dimensions.height - 100,
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        paddingBottom: 20,
        flexDirection: "column",
        display: "flex",
        paddingRight: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          marginRight: 20,
        }}
      >
        {grid()}
      </div>
    </div>
  );

  const sidePannel = () => (
    <div
      style={{
        width: (dimensions.width - 60) * 0.34,
        height: dimensions.height - 100,
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        padding:
          sideBarContent === "Select" || sideBarContent === "Meeting" ? 0 : 20,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
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

      {sideBarContent === "Meeting" ? (
        meetingInformation !== null && (
          <MeetingDetails
            meeting={meetingInformation}
            name={account.name}
            meetings={meetings}
          />
        )
      ) : sideBarContent === "Settings" ? (
        <SettingsPanel
          height={dimensions.height - 100}
          email={account.username}
        />
      ) : (
        <SelectAll
          meetings={meetings.filter(
            (meet) =>
              format(meet.date, "dd/MM/yyyy") ===
              format(selectedDate, "dd/MM/yyyy")
          )}
          date={selectedDate}
          height={dimensions.height - 100}
          name={account.name}
        />
      )}
    </div>
  );

  const renderCalendar = () => {
    return (
      <div style={{ display: "flex" }}>
        {calendar()}
        {showSideBar === true && <div style={{ width: 20 }} />}
        {showSideBar === true && sidePannel()}
      </div>
    );
  };

  return (
    <div className="fixed w-screen h-[calc(100vh-60px)]">
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {renderCalendar()}
      </div>
    </div>
  );
};

export default Cal;

"use client";
import { use, useEffect, useState } from "react";
import {
  fetchLecturers,
  fetchAvailableDates,
  insertMeeting,
  accountRouting,
  fetchOwnMeetings,
} from "../hooks/calls";
import { leftChevron, rightChevron } from "../calendar/components/svg";
import {
  differenceInMinutes,
  format,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns";
import { SyncLoader } from "react-spinners";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { validateUser } from "../hooks/validateUser";
import { useGlobal } from "../context/global";

type user = {
  id: string;
  created_at: Date;
  university_id: string;
  admin: boolean;
  name: string;
  email: string;
};

type dates = {
  date: Date;
  block_id: string;
};

type timeslot = {
  block_id: string;
  start_time: Date;
  date: Date;
  end_time: Date;
  id: string;
};

type meeting = {
  date: Date;
  email: string;
  end_time: Date;
  id: number;
  name: string;
  purpose: string;
  start_time: Date;
  room: string;
};

const Book = () => {
  const { global, setGlobal } = useGlobal();
  const [searchLecturer, setSearchLecturer] = useState<string>("");
  const [lecturer, setLecturer] = useState<string>("");
  const [focus, setFocus] = useState<boolean>(false);
  const [lecturerList, setLecturerList] = useState<[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<user>();
  const [availableDates, setAvailableDates] = useState<dates[]>([]);
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectTimeSlot, setSelectedTimeslot] = useState<timeslot>();
  const [purpose, setPurpose] = useState<string>("");
  const { instance, accounts } = useMsal();
  const [account, setAccount] = useState<object>();
  const router = useRouter();
  const [loadingInsert, setLoadingInsert] = useState<boolean>(false);
  const [meetings, setMeetings] = useState<meeting[]>([]);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [meetingType, setMeetingType] = useState<boolean>(false);
  const [newMeeting, setNewMeeting] = useState<boolean>(false);
  const [selectedMeeting, setSelectedMeeting] = useState<number>();
  const { role } = global;

  const callValidateUser = async () => {
    const res = await validateUser(instance, accounts);
    console.log("response", res);
    setGlobal({ ...global, role: res?.role });
    if (res?.allow === false) {
      router.push("./");
    }
  };

  useEffect(() => {
    if (accounts.length === 0) {
      router.push("./");
    } else {
      if (accounts.length > 0) {
        callValidateUser();
      } else {
        if (role === "true") {
          router.push("./calendar");
        }
      }
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (availableDates[index]) {
      const filter = slots.filter(
        (s) =>
          format(s.date, "dd/MM/yyyy") ===
          format(availableDates[index].date, "dd/MM/yyyy")
      );
      setFilteredSlots(filter);
      console.log("filter123", filter);
    }
  }, [index, slots, availableDates]);

  useEffect(() => {
    if (role === "true") {
      router.push("./calendar");
    }
  }, [role]);

  useEffect(() => {
    if (searchLecturer !== "") {
      callFetchLecturer();
    }
  }, [searchLecturer]);

  const callOwnMeetings = async () => {
    const response = await fetchOwnMeetings(account?.username);
    setMeetings(response);
  };

  const fetchAccountRouting = async (email: string) => {
    const response = await accountRouting(email);
    if (response.data === false) {
      router.push("./book");
    }
  };

  const returnTimeOfDay = (date: Date) => {
    const integer = parseInt(format(date, "HH"), 0);
    if (integer >= 12) {
      return format(date, "h:mm") + "pm";
    } else {
      return format(date, "h:mm") + "am";
    }
  };

  const getDaySuffix = (date: Date) => {
    const day = parseInt(format(date, "d"));

    if (day >= 11 && day <= 13) {
      return `${day}th`;
    }

    const lastDigit = day % 10;
    switch (lastDigit) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  };

  const returnDate = (date: Date) => {
    const suffix = getDaySuffix(date);
    const day = format(date, "EEEE");
    const month = format(date, "MMMM");
    return day + ", " + suffix + ", " + month;
  };

  const callFetchAvailableDates = async (id: string) => {
    const response = await fetchAvailableDates(id);
    console.log(response);
    const sorted = response.availableDates.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    setSlots(response.slots);
    setAvailableDates(sorted);
    console.log(sorted);
    setLoading(false);
  };

  const changeDate = async (plan: number) => {
    if (plan === 1) {
      if (index + 1 === availableDates.length) {
        setIndex(0);
      } else {
        setIndex(index + 1);
      }
    } else {
      if (index === 0) {
        setIndex(availableDates.length - 1);
      } else {
        setIndex(index - 1);
      }
    }
  };

  const handleInsertMeeting = async () => {
    const res = await insertMeeting(
      selectTimeSlot?.id,
      selectedLecturer?.id,
      account?.username,
      purpose
    );
    console.log(res);
    setLoadingInsert(false);
    setAvailableDates(res.availableDates);
    setSlots(res.slots);
    setSelectedTimeslot(undefined);
    setShowCompletion(true);
    callOwnMeetings();
    setPurpose("");
  };

  const callFetchLecturer = async () => {
    const { data } = await fetchLecturers(searchLecturer);
    setLecturerList(data.data);
  };

  const handleSelectLecturer = (user: user) => {
    setFocus(false);
    setSearchLecturer(user.name);
    setSelectedLecturer(user);
    callFetchAvailableDates(user.id);
    setLoading(true);
  };

  const renderResults = () => (
    <div className="w-full border border-[#d9d9d9] absolute z-10 bg-white rounded-md top-11 px-[10px] overflow-y-auto max-h-32">
      {lecturerList.length > 0 ? (
        lecturerList.map((item, index) => {
          return (
            <button
              onClick={() => {
                handleSelectLecturer(item);
              }}
              key={item.id}
              style={{
                borderBottom:
                  index + 1 === lecturerList.length
                    ? "0px solid #d9d9d9"
                    : "1px solid #d9d9d9",
              }}
              className="w-full flex flex-row justify-between py-3"
            >
              <p className="text-sm font-[400] text-[#a8a8a8]">
                name: <span className=" text-black">{item.name}</span>
              </p>
            </button>
          );
        })
      ) : (
        <div className="w-full h-full items-center justify-center py-3">
          <p className="text-sm font-[400]">No results</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-screen h-[calc(100vh-60px)] gap-5 p-[10px] sm:p-5 flex justify-center items-start">
      <div className="w-screen sm:w-2/3 md:w-2/3 lg:w-2/3 xl:w-1/3 rounded-md border border-[#d9d9d9] flex flex-col p-[10px] sm:p-5 gap-5">
        <div className="gap-[10px] flex flex-col">
          <p className="text-sm font-[500] ">Your meetings:</p>
          <div className="w-full rounded-md border border-[#d9d9d9] grid grid-cols-2 relative h-9 overflow-clip">
            <motion.div
              className="w-1/2 h-full bg-[#0795ff] absolute"
              animate={{ left: meetingType === true ? "50%" : 0 }}
            />
            <button
              className="flex items-center justify-center z-10"
              onClick={() => {
                setMeetingType(false);
              }}
            >
              <motion.p
                className="text-black text-sm font-[400]"
                animate={{ color: meetingType === true ? "black" : "white" }}
              >
                Upcoming
              </motion.p>
            </button>
            <button
              className="flex items-center justify-center z-10"
              onClick={() => {
                setMeetingType(true);
              }}
            >
              <motion.p
                className="text-black text-sm font-[400]"
                animate={{ color: meetingType === false ? "black" : "white" }}
              >
                Past
              </motion.p>
            </button>
          </div>
          <div className="flex h-[200px] rounded-md border border-[#d9d9d9] overflow-y-auto"></div>
        </div>
        <div className="w-full h-[1px] bg-[#d9d9d9]" />
        <div className="gap-[10px] flex flex-col">
          {newMeeting === false && (
            <button
              className="flex h-9 rounded-md border border-[#d9d9d9] bg-[#0795ff] items-center justify-center"
              onClick={() => {
                setNewMeeting(true);
              }}
            >
              <p className="text-white text-sm font-[400]">New meeting</p>
            </button>
          )}
          {newMeeting === true && (
            <div className="flex flex-col gap-[10px] relative">
              <div className="relative w-full">
                <input
                  onFocus={() => setFocus(true)}
                  onBlur={() => {
                    if (lecturerList.length === 0) {
                      setFocus(false);
                    }
                  }}
                  placeholder="Enter lecturer name"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  onChange={(event) => {
                    setSearchLecturer(event.target.value);
                  }}
                  value={searchLecturer}
                />
                {selectedLecturer !== undefined && (
                  <button
                    className="absolute right-3 top-0 h-9 text-sm font-[400]"
                    onClick={() => {
                      setSelectedLecturer(undefined);
                      setSearchLecturer("");
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {focus === true && renderResults()}
              {selectedLecturer !== undefined && (
                <div className="flex flex-col gap-[10px]">
                  <div className="border border-[#d9d9d9] rounded-md flex flex-col py-[10px] px-3">
                    <div className="flex flex-row justify-between w-full">
                      <p className="text-sm font-[400]">
                        {availableDates.length > 0
                          ? format(availableDates[index].date, "EEEE, d, MMM")
                          : "Date"}
                      </p>
                      <div className="flex w-[50px] justify-between">
                        <button
                          onClick={() => {
                            changeDate(0);
                          }}
                        >
                          {leftChevron(12)}
                        </button>
                        <button
                          onClick={() => {
                            changeDate(1);
                          }}
                        >
                          {rightChevron(12)}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-[#d9d9d9] h-[1px]" />
                  {/* {newMeeting === false && ( */}
                  <div className="max-h-[200px] gap-[10px] overflow-y-auto flex flex-col">
                    {filteredSlots.map((item) => {
                      return (
                        <motion.button
                          animate={{
                            backgroundColor:
                              selectedMeeting === item.id ? "#0795FF" : "white",
                          }}
                          onClick={() => {
                            setSelectedMeeting(item.id);
                          }}
                          key={item.id}
                          className="h-9 w-full rounded-md px-3 py-1 flex items-center border"
                        >
                          <motion.p
                            className="text-sm font-[400]"
                            animate={{
                              color:
                                selectedMeeting === item.id ? "white" : "black",
                            }}
                          >
                            {returnTimeOfDay(item.start_time)} -{" "}
                            {returnTimeOfDay(item.end_time)}
                          </motion.p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedMeeting !== undefined && (
                <div className="w-full bg-[#d9d9d9] h-[1px]" />
              )}
              {selectedMeeting !== undefined && (
                <button className="flex h-9 rounded-md border border-[#d9d9d9] bg-[#0795ff] items-center justify-center">
                  <p className="text-white text-sm font-[400] py-1">
                    Book selected meeting
                  </p>
                </button>
              )}
            </div>
          )}

          {/* )} */}
        </div>
      </div>
    </div>
  );
};

export default Book;

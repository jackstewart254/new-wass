"use client";

import { loginRequest } from "@/app/hooks/authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import axios from "axios";
import { format, sub } from "date-fns";
import { useEffect, useState } from "react";
import { deleteMeetings } from "@/app/api/calls";
import { SyncLoader } from "react-spinners";
import { useGlobal } from "@/app/context/global";

type meeting = {
  id: number;
  created_at: Date;
  staff_id: string;
  student_id: string;
  start_time: Date;
  end_time: Date;
  meeting_purpose: string;
};

const SelectAll = ({
  meetings,
  date,
  height,
  name,
}: {
  meetings: meeting[];
  date: Date;
  height: number;
  name: string;
}) => {
  const { instance, accounts } = useMsal();
  const { global, setGlobal } = useGlobal();
  const [accessToken, setAccessToken] = useState<string>();
  const [subject, setSubject] = useState<string>();
  const [body, setBody] = useState<string>();
  const [loading, setLoading] = useState<boolean>();
  const [close, setClose] = useState<boolean>();

  useEffect(() => {
    console.log(meetings, date);
    getAcquireToken();
  }, [meetings, date]);

  useEffect(() => {
    if (close === true) {
      setGlobal({ ...global, closeSelect: true });
    }
  }, [close]);

  useEffect(() => {
    if (loading === false) {
      setClose(true);
    }
  }, [loading]);

  const getAcquireToken = async () => {
    const token = await acquireToken();
    setAccessToken(token);
  };

  const returnDate = (date: Date) => {
    const suffix = getDaySuffix(date);
    const day = format(date, "EEEE");
    const month = format(date, "MMMM");
    return day + ", " + suffix + ", " + month;
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

  const sendEmail = async () => {
    const response = await deleteMeetings(meetings);
    for (let i = 0; i < response.emails.length; i++) {
      const fname = name.split(" ");
      const emailPayload = {
        message: {
          subject: subject !== undefined ? subject : "Appointment cancellation",
          body: {
            contentType: "Text",
            content:
              body !== undefined
                ? body
                : `Hi ${response.emails[i].name}, \n \nI've had to cancel your appointment. \n \nkind regards, ${fname[0]}`,
          },
          toRecipients: [
            {
              emailAddress: {
                address: response.emails[i].email,
              },
            },
          ],
        },
        saveToSentItems: "false",
      };
      await axios.post(
        "https://graph.microsoft.com/v1.0/me/sendMail",
        emailPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    setLoading(false);
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
      if (error instanceof InteractionRequiredAuthError) {
        const tokenResponse = await instance.acquireTokenPopup(loginRequest);
        return tokenResponse.accessToken;
      } else {
        console.error(error);
      }
    }
  };

  const renderMeeting = (meeting: meeting, index: number) => (
    <div
      style={{
        width: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        marginBottom: index + 1 === meetings.length ? 0 : 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <p style={{ color: "#a8a8a8" }}>
          Start time:{" "}
          <span style={{ color: "black" }}>
            {returnTimeOfDay(meeting.start_time)}
          </span>
        </p>
        <p style={{ color: "#a8a8a8" }}>
          End time:{" "}
          <span style={{ color: "black" }}>
            {returnTimeOfDay(meeting.end_time)}
          </span>
        </p>
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
        padding: 20,
      }}
    >
      {loading === true && (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: 2,
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "black",
              opacity: 0.02,
            }}
          />
          <div
            style={{
              position: "absolute",
              padding: 10,
              border: "1px solid #d9d9d9",
              backgroundColor: "white",
              borderRadius: 10,
              zIndex: 2,
            }}
          >
            <SyncLoader size={7} />
          </div>
        </div>
      )}
      <p style={{ color: "#a8a8a8", marginBottom: 10, width: "100%" }}>
        Events for {returnDate(date)}
      </p>
      <div
        style={{
          height: "40%",
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: "1px solid #d9d9d9",
          marginBottom: 20,
          overflowY: "auto",
        }}
      >
        {meetings.map((meeting, index) => (
          <div key={meeting.id}>{renderMeeting(meeting, index)}</div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          borderRadius: 10,
          border: "1px solid #d9d9d9",
          padding: 10,
          marginBottom: 20,
          height: "50%",
        }}
      >
        <p style={{ color: "#a8a8a8", marginBottom: 10 }}>Subject:</p>
        <input
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
          }}
          placeholder="Appointment cancellation"
          style={{
            width: "100%",
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            padding: 10,
            outline: "none",
            marginBottom: 10,
          }}
        />
        <p style={{ color: "#a8a8a8", marginBottom: 10 }}>Body:</p>
        <textarea
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
          }}
          placeholder={`Hi {Student name},\n \nI've had to cancel your appointment. \n \nkind regards, ${
            name.split(" ")[0]
          }`}
          style={{
            width: "100%",
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            padding: 10,
            outline: "none",
            // marginBottom: 10,
            resize: "none",
            height: "100%",
            font: "inherit",
            fontSize: 13,
          }}
        />
      </div>
      <button
        onClick={() => {
          setLoading(true);
          sendEmail();
        }}
        style={{
          height: 30,
          borderRadius: 4,
          backgroundColor: "#FF2222",
          width: "100%",
        }}
      >
        <p style={{ color: "white" }}>Cancel all bookings</p>
      </button>
    </div>
  );
};

export default SelectAll;

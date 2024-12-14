"use client";
import { loginRequest } from "@/app/hooks/authConfig";
import { deleteMeetings } from "@/app/api/calls";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { format } from "date-fns";
import { use, useEffect, useState } from "react";
import { SyncLoader } from "react-spinners";
import { useGlobal } from "@/app/context/global";

const MeetingDetails = ({
  meetings,
  meeting,
  name,
}: {
  meetings: object[];
  meeting: object;
  name: string;
}) => {
  const { global, setGlobal } = useGlobal();
  const [accessToken, setAccessToken] = useState<string>();
  const [subject, setSubject] = useState<string>();
  const [body, setBody] = useState<string>();
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState<boolean>();
  const [showEmail, setShowEmail] = useState<boolean>();

  useEffect(() => {
    getAcquireToken();
  }, []);

  useEffect(() => {
    console.log(meetings, meeting);
  }, [meetings]);

  useEffect(() => {
    if (loading === false) {
      setGlobal({ ...global, closeSelect: true });
    }
  }, [loading]);

  const aLineOne = () => (
    <div
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        display: "flex",
        paddingBottom: 10,
      }}
    >
      <div
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          display: "flex",
        }}
      >
        <p
          style={{
            color: "#A8A8A8",
            paddingRight: 10,
          }}
        >
          Name
        </p>
        <p
          style={{
            color: "black",
          }}
        >
          {meeting.student.name}
        </p>
      </div>
      <div
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          display: "flex",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: "#A8A8A8",
            paddingRight: 10,
          }}
        >
          Student ID
        </p>
        <p
          style={{
            color: "black",
          }}
        >
          {meeting.student.university_id}
        </p>
      </div>
    </div>
  );

  const aLineTwo = () => (
    <div
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        display: "flex",
        marginBottom: 10,
      }}
    >
      <p style={{ color: "#A8A8A8" }}>
        Purpose of meeting:{" "}
        <span style={{ paddingLeft: 10, color: "black" }}>
          {meeting.meetingDetails.meeting_purpose}
        </span>
      </p>
    </div>
  );

  const aLineThree = () => (
    <div
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        display: "flex",
      }}
    >
      <p style={{ color: "#A8A8A8" }}>
        Date:{" "}
        <span style={{ paddingLeft: 10, color: "black" }}>
          {format(meeting.meetingDetails.start_time, "d, EEEE, MMMM")}
        </span>
      </p>
    </div>
  );

  const getAcquireToken = async () => {
    const token = await acquireToken();
    setAccessToken(token);
  };

  const sendEmail = async () => {
    console.log(meeting);
    const response = await deleteMeetings([meeting.meetingDetails]);
    console.log(response);
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

  const boxOne = () => (
    <div
      style={{
        width: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        marginBottom: 20,
      }}
    >
      {aLineOne()}
      {aLineTwo()}
      {aLineThree()}
    </div>
  );

  const boxTwo = () => (
    <div
      style={{
        width: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        marginBottom: 20,
        height: "47%",
      }}
    >
      <p style={{ color: "#A8A8A8", paddingBottom: 10 }}>Email history</p>
      <div
        style={{
          height: "100%",
          width: "100%",
          overflowY: "auto",
        }}
      >
        {meeting.emails.map((email, index) => (
          <div
            key={email.id}
            style={{
              marginBottom: index === meeting.emails.length - 1 ? 0 : 10,
              width: "100%",
              border: "1px solid #d9d9d9",
              padding: 10,
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 10,
                justifyContent: "space-between",
              }}
            >
              <p style={{ color: "#a8a8a8" }}>
                Sender:{" "}
                <span style={{ color: "black" }}>
                  {email.sender.emailAddress.address}
                </span>
              </p>
              <p style={{ color: "#a8a8a8" }}>
                Date:{" "}
                <span style={{ color: "black" }}>
                  {format(new Date(email.receivedDateTime), "dd/MM/yyyy")}
                </span>
              </p>
            </div>
            {/* <div
              style={{
                backgroundColor: "black",
                width: "100%",
                height: 1,
                marginBottom: 5,
              }}
            /> */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 10,
              }}
            >
              <p style={{ color: "#a8a8a8" }}>
                Subject: <span style={{ color: "black" }}>{email.subject}</span>
              </p>
            </div>
            {/* <div
              style={{
                backgroundColor: "black",
                width: "100%",
                height: 1,
                marginBottom: 5,
              }}
            /> */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                dangerouslySetInnerHTML={{ __html: email.body.content }}
                style={{
                  fontFamily: "inherit",
                  fontSize: "13px",
                  color: "inherit",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const boxThree = () => (
    <div
      style={{
        width: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        border: "1px solid #d9d9d9",
        marginBottom: 20,
        height: "26%",
      }}
    >
      <p style={{ color: "#A8A8A8", paddingBottom: 10 }}>Meeting history</p>
      <div
        style={{
          height: "100%",
          width: "100%",
          overflowY: "auto",
        }}
      >
        {meeting.meetingHistory.map((meet) => (
          <div
            key={meet.id}
            style={{
              width: "100%",
              borderRadius: 10,
              padding: 10,
              border: "1px solid #d9d9d9",
              marginBottom: 10,
            }}
          >
            <p style={{ color: "#a8a8a8", paddingBottom: 10 }}>
              Purpose of meeting:{" "}
              <span style={{ color: "black" }}>{meet.meeting_purpose}</span>
            </p>
            <p style={{ color: "#a8a8a8" }}>
              Date:{" "}
              <span style={{ color: "black" }}>
                {format(meet.start_time, "dd/MM/yyyy")}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const boxFour = () => (
    <button
      onClick={() => {
        setShowEmail(true);
      }}
      style={{
        height: 32,
        width: "100%",
        borderRadius: 4,
        backgroundColor: "#FD4040",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
        border: "0px solid white",
      }}
    >
      <p style={{ color: "white", fontSize: 14, fontWeight: "500" }}>
        Cancel meeting
      </p>
    </button>
  );

  const renderEmails = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        position: "absolute",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "clip",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "black",
          opacity: 0.04,
        }}
      />
      <button
        onClick={() => {
          setShowEmail(false);
        }}
        style={{
          position: "absolute",
          padding: 10,
          right: 20,
          top: 20,
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          border: "1px solid #d9d9d9",
        }}
      >
        <p style={{ color: "black" }}>Back</p>
      </button>
      <div
        style={{
          position: "absolute",
          width: "92%",
          backgroundColor: "white",
          borderRadius: 10,
          border: "1px solid #d9d9d9",
          padding: 10,
          display: "flex",
          flexDirection: "column",
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
            marginBottom: 10,
            resize: "none",
            height: 130,
            font: "inherit",
            fontSize: 13,
          }}
        />
        <button
          onClick={() => {
            sendEmail();
            setLoading(true);
          }}
          style={{
            width: "100%",
            height: 30,
            backgroundColor: "#FF2222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
          }}
        >
          <p style={{ color: "white" }}>Send email and cancel meeting</p>
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
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
            zIndex: 1000,
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
      {showEmail === true && renderEmails()}
      {boxOne()}
      {boxTwo()}
      {boxThree()}
      {boxFour()}
    </div>
  );
};

export default MeetingDetails;

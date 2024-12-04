"use client";
import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import axios from "axios";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "./api/authConfig";
import { useRouter } from "next/navigation";
import { accountRouting, checkLogin } from "./api/calls";
import { SyncLoader } from "react-spinners";

export default function Home() {
  const authenticate = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const [signedIn, setSignedIn] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState<boolean>();

  // Set the active account after login or show login popup if no account is active
  useEffect(() => {
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
      setSignedIn(true);
      setLoading(true);
    } else if (!instance.getActiveAccount()) {
      setSignedIn(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (signedIn === true) {
      const account = instance.getActiveAccount();
      console.log("Bumble", account?.username, account?.name);
      const callCheckLogin = async () => {
        const res = await checkLogin(account.username, account.name);
        if (res.data) {
          setLoading(false);
        }
      };
      callCheckLogin();
      const one = account?.username.split("@");
      const validInteger = isInteger(one[0]);
      callAccountRouting(account?.username);
    }
  }, [signedIn]);

  useEffect(() => {
    if (destination !== undefined) {
      router.push(`/${destination === true ? "calendar" : "book"}`);
    }
  }, [destination]);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: instance.getActiveAccount(),
        });
        console.log(response);
      } catch (error) {
        console.log("Error acquiring token silently: ", error);
      }
    };
    if (instance.getActiveAccount()) {
      getAccessToken();
    }
  }, [authenticate, accounts, instance]);

  const callAccountRouting = async (email: string) => {
    const response = await accountRouting(email);
    setDestination(response.data);
  };

  const isInteger = (str) => {
    const num = parseInt(str, 10);
    return Number.isInteger(num) && num.toString() === str;
  };

  const fetchEmails = async (accessToken) => {
    const email = `jackmcleanstewart49@gmail.com`;
    try {
      const response = await axios.get(
        // `https://graph.microsoft.com/v1.0/me/messages?$filter=sender/emailAddress/address eq '${email}'`,
        `https://graph.microsoft.com/v1.0/me/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("PREE Requisite", response);
      console.log("Emails:", response.data);
    } catch (error) {
      console.error("Error fetching emails:", error);
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

  const handleFetchEmails = async () => {
    const accessToken = await acquireToken();
    if (accessToken) {
      const res = await fetchEmails(accessToken);
      console.log(res);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "white",
        position: "fixed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading && (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "absolute" }}>
            <SyncLoader loading={true} size={9} color="#000000" />
          </div>
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "black",
              opacity: 0.1,
            }}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: 20, fontWeight: "600", marginBottom: 20 }}>
          WASS2
        </p>
        <button
          onClick={() => instance.loginPopup()}
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            borderRadius: 10,
            border: "1px solid #d9d9d9",
          }}
        >
          <h1
            style={{
              fontSize: 16,
              color: "black",
              fontWeight: "500",
            }}
          >
            Login with Outlook
          </h1>
        </button>
      </div>
    </div>
  );
}

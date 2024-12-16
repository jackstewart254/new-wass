"use client";
import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { SyncLoader } from "react-spinners";
import { validateUser } from "./hooks/validateUser";
import { useGlobal } from "./context/global";

export default function Home() {
  const { global, setGlobal } = useGlobal();
  const { role } = global;
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const callValidateUser = async () => {
    const res = await validateUser(instance, accounts);
    setGlobal({ ...global, role: res?.role });
    if (res?.allow === true) {
      if (res?.role === "true") {
        router.push("/calendar");
      } else {
        console.log("andreesen", res?.role);
        router.push("/book");
      }
    }
  };

  useEffect(() => {
    if (accounts.length === 0) {
      instance.loginPopup();
    } else {
      if (accounts.length > 0 && role === undefined) {
        callValidateUser();
      } else {
        if (role === "true" && role !== undefined) {
          router.push("/calendar");
        } else {
          router.push("/book");
        }
      }
    }
  }, [accounts, instance, role]);

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

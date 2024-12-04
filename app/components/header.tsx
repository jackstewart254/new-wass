"use client";
import { useRouter } from "next/navigation";

import { useMsal } from "@azure/msal-react";
import { useGlobal } from "../context/global";
import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { leftChevron, rightChevron } from "../calendar/components/svg";
import { useEffect, useState } from "react";
import { accountRouting } from "../api/calls";

const Header = () => {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const { global, setGlobal } = useGlobal();
  const { movingDate } = global;
  const [admin, setAdmin] = useState<boolean>();

  const handleSignOut = () => {
    instance.logoutPopup();
    router.push("./");
  };

  useEffect(() => {
    at();
  }, [accounts]);

  const at = async () => {
    const res = await accountRouting(accounts[0].username);
    setAdmin(res.data);
  };

  const handleUpdateMovingDate = (plan: number) => {
    if (plan === 0) {
      setGlobal({ ...global, movingDate: addDays(movingDate, -7) });
    }
    if (plan === 1) {
      setGlobal({ ...global, movingDate: addDays(movingDate, 7) });
    }
  };

  if (accounts.length > 0) {
    return (
      <div className="w-screen h-[60px] grid grid-cols-2 border-b border-[#d9d9d9] px-5 items-center">
        <h1 className="text-2xl font-[600]">WASS2</h1>
        <div className="flex justify-end">
          {admin === true && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                marginRight: 20,
                border: "1px solid #d9d9d9",
                borderRadius: 10,
                height: 40,
                alignItems: "center",
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              <button
                onClick={() => {
                  handleUpdateMovingDate(0);
                }}
              >
                {leftChevron(12)}
              </button>
              <p
                style={{
                  marginLeft: 10,
                  marginRight: 10,
                  width: 120,
                  textAlign: "center",
                }}
              >
                {format(startOfWeek(movingDate, { weekStartsOn: 1 }), "d MMM")}{" "}
                - {format(endOfWeek(movingDate, { weekStartsOn: 1 }), "d MMM")}
              </p>
              <button
                onClick={() => {
                  handleUpdateMovingDate(1);
                }}
              >
                {rightChevron(12)}
              </button>
            </div>
          )}
          <button
            onClick={handleSignOut}
            style={{
              padding: 5,
              borderRadius: 4,
              border: "1px solid #d9d9d9",
            }}
          >
            <p>Sign out</p>
          </button>
          <p
            style={{
              fontWeight: "500",
              fontSize: 14,
            }}
          >
            {/* {account?.name} */}
          </p>
          {/* <button onClick={handleSettingPress}>{settingSvg()}</button> */}
        </div>
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default Header;

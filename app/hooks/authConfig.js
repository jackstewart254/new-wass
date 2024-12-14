"use client";
import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "de3efb51-9209-4484-b391-da723d7ac5ce",
    authority: "https://login.microsoftonline.com/consumers",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            return;
          case LogLevel.Info:
            return;
          case LogLevel.Verbose:
            return;
          case LogLevel.Warning:
            return;
          default:
            return;
        }
      },
    },
  },
};
export const loginRequest = {
  scopes: ["User.Read", "Mail.Read", "Mail.Send"],
};
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

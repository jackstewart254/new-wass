"use client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

const AuthConfigProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <MsalProvider instance={msalInstance}>
      <body>{children}</body>
    </MsalProvider>
  );
};

export default AuthConfigProvider;

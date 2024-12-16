import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthConfigProvider from "./hooks/authConfigProvider";
import { GlobalProvider } from "./context/global";
import Header from "./components/header";
import Popup from "./components/popup";
import { CalendarProvider } from "./context/calendar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Web Appointment Scheduling System",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CalendarProvider>
        <GlobalProvider>
          <body
            className={`${geistSans.variable} ${geistMono.variable} fixed w-screen h-screen flex flex-col bg-white`}
          >
            <AuthConfigProvider>
              <div className="">{children}</div>
            </AuthConfigProvider>
          </body>
        </GlobalProvider>
      </CalendarProvider>
    </html>
  );
}

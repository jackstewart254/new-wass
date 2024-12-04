"use client";

const Settings = ({ height }: { height: number }) => {
  return (
    <div
      style={{
        width: "100%",
        height: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1>Settings</h1>
    </div>
  );
};

export default Settings;

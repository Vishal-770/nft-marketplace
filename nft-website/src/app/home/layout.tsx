"use client";
import BottomNav from "@/components/bottomNavBar";
import { ModeToggle } from "@/components/ui/animated-theme-toggler";
import { ConnectButton, darkTheme, lightTheme } from "thirdweb/react";
import client from "../client";
import { useTheme } from "next-themes";

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { theme } = useTheme();
  return (
    <>
      <div className="fixed top-5 right-5 z-50 flex gap-2">
        <ConnectButton
          theme={theme == "dark" ? darkTheme() : lightTheme()}
          client={client}
        />

        <ModeToggle />
      </div>
      <div className="home-layout">{children}</div>
      <BottomNav />
    </>
  );
}

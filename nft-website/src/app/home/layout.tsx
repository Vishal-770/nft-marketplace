import BottomNav from "@/components/bottomNavBar";
import { Metadata } from "next";
import { ModeToggle } from "@/components/ui/animated-theme-toggler";
import { ConnectButton } from "thirdweb/react";
import client from "../client";
export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to the NFT Marketplace",
};

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="fixed top-5 right-5 z-50 flex gap-2">
        <ConnectButton client={client} />

        <ModeToggle />
      </div>
      <div className="home-layout">{children}</div>
      <BottomNav />
    </>
  );
}

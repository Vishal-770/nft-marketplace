import BottomNav from "@/components/bottomNavBar";
import { Metadata } from "next";
import { ModeToggle } from "@/components/ui/animated-theme-toggler";
export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to the NFT Marketplace",
};

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="fixed top-5 right-5 z-50">
        <ModeToggle />
      </div>
      <div className="home-layout">{children}</div>
      <BottomNav />
    </>
  );
}

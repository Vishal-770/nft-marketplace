"use client";
import { useState } from "react";
import { Home, Image as ImageIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const [active, setActive] = useState("full");
  const router = useRouter();

  const handleNav = (route: string, key: string) => {
    setActive(key);
    router.push(route);
  };

  return (
    <div className="fixed bottom-0 w-full bg-card flex justify-around items-center py-2 border-t border-primary">
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "marketplace" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/marketplace", "marketplace")}
      >
        <Home size={20} />
        <span className="text-xs">Marketplace</span>
      </div>
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "create" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/create", "create")}
      >
        <ImageIcon size={20} />
        <span className="text-xs">Create NFT</span>
      </div>
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "profile" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/profile", "profile")}
      >
        <User size={20} />
        <span className="text-xs">My Nfts</span>
      </div>
    </div>
  );
}

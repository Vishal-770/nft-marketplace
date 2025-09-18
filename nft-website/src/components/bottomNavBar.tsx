"use client";
import { useState } from "react";
import {
  Home,
  Image as ImageIcon,
  User,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const [active, setActive] = useState("marketplace");
  const router = useRouter();

  const handleNav = (route: string, key: string) => {
    setActive(key);
    router.push(route);
  };

  return (
    <div className="fixed bottom-0 w-full bg-card flex justify-around items-center py-2 border-t border-primary">
      {/* Marketplace */}
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "marketplace" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/marketplace", "marketplace")}
      >
        <Home size={20} />
        <span className="text-xs">Marketplace</span>
      </div>

      {/* Create NFT */}
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "create" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/create", "create")}
      >
        <ImageIcon size={20} />
        <span className="text-xs">Create</span>
      </div>

      {/* Buy / Sell */}
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "buy" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/buy", "buy")}
      >
        <ShoppingCart size={20} />
        <span className="text-xs">Buy/Sell</span>
      </div>

      {/* Rent */}
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "rent" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/rent", "rent")}
      >
        <Clock size={20} />
        <span className="text-xs">Rent</span>
      </div>

      {/* Profile */}
      <div
        className={`flex flex-col items-center cursor-pointer ${
          active === "profile" ? "text-primary" : "text-muted-foreground"
        }`}
        onClick={() => handleNav("/home/profile", "profile")}
      >
        <User size={20} />
        <span className="text-xs">My NFTs</span>
      </div>
    </div>
  );
}

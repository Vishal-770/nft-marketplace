import { Home, Image as ImageIcon, User } from "lucide-react";

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 w-full bg-card flex justify-around items-center py-2 border-t border-primary">
      <div className="flex flex-col items-center text-primary">
        <Home size={20} />
        <span className="text-xs">Marketplace</span>
      </div>
      <div className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
        <ImageIcon size={20} />
        <span className="text-xs">My NFTs</span>
      </div>
      <div className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
        <User size={20} />
        <span className="text-xs">Profile</span>
      </div>
    </div>
  );
}

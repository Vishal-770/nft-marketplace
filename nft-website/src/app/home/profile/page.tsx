"use client";
import Image from "next/image";

import {
  ArrowLeft,
  Wallet,
  Clock,
  Bell,
  Palette,
  Lock,
  HelpCircle,
  Mail,
} from "lucide-react";

export default function Profile() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-6">
        <ArrowLeft size={20} className="text-muted-foreground cursor-pointer" />
        <h1 className="text-lg font-semibold flex-1 text-center">Profile</h1>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-card">
          <Image
            src="/avatar.png" // replace with user avatar
            alt="User Avatar"
            width={80}
            height={80}
            className="object-cover"
          />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Ethan Carter</h2>
        <p className="text-sm text-muted-foreground">@ethan.carter</p>
      </div>

      {/* Sections */}
      <div className="flex-1 px-4 space-y-6">
        <Section title="ACCOUNT">
          <ProfileItem icon={<Wallet size={16} />} label="Connect Wallet" />
          <ProfileItem icon={<Clock size={16} />} label="Transaction History" />
        </Section>

        <Section title="SETTINGS">
          <ProfileItem icon={<Bell size={16} />} label="Notifications" />
          <ProfileItem icon={<Palette size={16} />} label="Theme" />
        </Section>

        <Section title="SECURITY">
          <ProfileItem icon={<Lock size={16} />} label="Change Password" />
        </Section>

        <Section title="HELP & SUPPORT">
          <ProfileItem icon={<HelpCircle size={16} />} label="FAQ" />
          <ProfileItem icon={<Mail size={16} />} label="Contact Support" />
        </Section>
      </div>
    </div>
  );
}

/* Helper Components */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex justify-between items-center bg-card rounded-lg px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <span className="text-muted-foreground">{">"}</span>
    </div>
  );
}

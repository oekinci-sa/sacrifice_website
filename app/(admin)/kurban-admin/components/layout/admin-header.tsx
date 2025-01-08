import React from "react";

import Logo from "@/components/layout/public/Header/logo";
import AdminNavigation from "./admin-navigation";
import { ModeToggle } from "@/components/layout/public/Header/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminHeader = () => {
  return (
    <header className="flex items-center justify-between my-8 w-full">
      <Logo></Logo>
      <AdminNavigation></AdminNavigation>
      <div className="flex items-center gap-4">
        <ModeToggle></ModeToggle>
        <Avatar className="mr-2 h-5 w-5">
          <AvatarImage
            src={`https://avatar.vercel.sh/acme-inc.png`}
            alt="Acme Inc."
          />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default AdminHeader;

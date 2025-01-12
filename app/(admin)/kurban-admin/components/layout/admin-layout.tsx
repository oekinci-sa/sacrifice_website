"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-y-0 z-50">
        <AdminSidebar 
          isCollapsed={isSidebarCollapsed} 
          onCollapsedChange={setIsSidebarCollapsed} 
        />
      </div>
      <main className={`transition-all duration-300 ${isSidebarCollapsed ? "pl-[60px]" : "pl-[240px]"}`}>
        <div className="container mx-auto min-h-screen py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 
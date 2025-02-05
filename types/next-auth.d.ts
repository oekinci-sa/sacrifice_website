import "next-auth";
import { UserRole } from ".";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    status: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
      status: string;
    };
  }
} 
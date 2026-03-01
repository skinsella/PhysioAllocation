import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      role: string;
      studentId?: string;
    };
  }

  interface User {
    role?: string;
    studentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    userId?: string;
    studentId?: string;
  }
}

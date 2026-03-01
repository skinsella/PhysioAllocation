import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "student-login",
      name: "Student Login",
      credentials: {
        studentId: { label: "Student ID", type: "text" },
        dateOfBirth: { label: "Date of Birth", type: "date" },
      },
      async authorize(credentials) {
        if (!credentials?.studentId || !credentials?.dateOfBirth) return null;

        const student = await prisma.student.findUnique({
          where: { studentId: credentials.studentId as string },
          include: { user: true },
        });

        if (!student) return null;

        // Compare dates (normalize to YYYY-MM-DD)
        const inputDate = new Date(credentials.dateOfBirth as string)
          .toISOString()
          .split("T")[0];
        const storedDate = student.dateOfBirth.toISOString().split("T")[0];

        if (inputDate !== storedDate) return null;

        return {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          role: student.user.role,
          studentId: student.studentId,
        };
      },
    }),
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;
        if (user.role === "STUDENT") return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.userId = user.id;
        token.studentId = (user as { studentId?: string }).studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.studentId = token.studentId as string | undefined;
      }
      return session;
    },
  },
});

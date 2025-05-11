// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  jwt: {
    encode: async ({ token, secret }) => {
      return jwt.sign(token as any, secret, { algorithm: "HS256" });
    },
    decode: async ({ token, secret }) => {
      return jwt.verify(token!, secret, { algorithms: ["HS256"] });
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        console.log(token);
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : "";
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});

export { handler as GET, handler as POST };

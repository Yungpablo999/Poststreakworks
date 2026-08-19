import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@poststreak/api/root";
import { createContext } from "@poststreak/api/context";
import type { NextRequest } from "next/server";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req }) =>
      createContext({
        req: req as NextRequest,
        resHeaders: new Headers(),
      }),
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`tRPC failed on ${path}:`, error.message);
      }
    },
  });

export { handler as GET, handler as POST };

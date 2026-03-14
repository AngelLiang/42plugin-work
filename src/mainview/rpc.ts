import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "../bun/rpc-schema";

export const rpc = Electroview.defineRPC<AppRPCSchema>({
  handlers: { requests: {}, messages: {} },
  maxRequestTime: Infinity,
});

export const view = new Electroview({ rpc });

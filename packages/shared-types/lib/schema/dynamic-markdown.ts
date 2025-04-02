import { z } from "zod";

export const mdVariablesSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

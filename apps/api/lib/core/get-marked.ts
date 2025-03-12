import { marked, MarkedExtension, MarkedOptions } from "marked";

export const getMarked = (options: MarkedOptions, extensions: MarkedExtension[]) => {
  marked.use(...extensions);
  return marked;
};

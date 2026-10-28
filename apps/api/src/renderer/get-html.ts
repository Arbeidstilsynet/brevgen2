import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { Config } from "./config";

/**
 * Generates a HTML document from a markdown string and returns it as a string.
 */
export function getHtml(md: string, config: Config) {
  const dirty = marked(md) as string;

  const clean = sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "html", "head", "body"]),
    allowedAttributes: false,
    allowedSchemesByTag: {
      img: ["data"],
      a: ["http", "https", "mailto", "relative"],
    },
  });

  return `<!DOCTYPE html>
<html lang="no">
	<head><title>${config.document_title}</title><meta charset="utf-8"></head>
	<body>
		${clean}
	</body>
</html>
`;
}

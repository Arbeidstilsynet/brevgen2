import sanitizeHtml from "sanitize-html";
import { Config } from "./config";
import { getMarked } from "./get-marked-with-highlighter";

/**
 * Generates a HTML document from a markdown string and returns it as a string.
 */
export function getHtml(md: string, config: Config) {
  const dirty = getMarked(config.marked_options, config.marked_extensions)(md) as string;

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
	<body class="${config.body_class.join(" ")}">
		${clean}
	</body>
</html>
`;
}

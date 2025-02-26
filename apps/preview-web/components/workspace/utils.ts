const FILE_EXTENSION = ".md";
const TAGS_SECTION_SEPARATOR = "-**tags**-";
const TAG_SEPARATOR = "-";
export const URL_SEARCH_PARAM_WORKSPACE = "workspace";

export const extractTags = (key: string) => {
  const keyWithoutExtension = key.split(FILE_EXTENSION)[0];
  const parts = keyWithoutExtension.split(TAGS_SECTION_SEPARATOR);
  const fileName = parts[0];
  const tagsArr = parts[1] ? parts[1].split(TAG_SEPARATOR) : [];
  const tags = new Set(tagsArr);
  return { fileName, tags };
};

export function createKey(filename: string, tags: Set<string>): string {
  return `${filename}${TAGS_SECTION_SEPARATOR}${Array.from(tags).join(TAG_SEPARATOR)}${FILE_EXTENSION}`;
}

function filenameExistsInKeys(filename: string, keys: (string | undefined)[]): boolean {
  return keys.some((key) => key?.startsWith(`${filename}${TAGS_SECTION_SEPARATOR}`));
}

export function isFilenameValid(filename: string, existingKeys: (string | undefined)[]): string {
  if (filenameExistsInKeys(filename, existingKeys)) {
    return "Filename already exists";
  } else if (filename.includes(FILE_EXTENSION)) {
    return `Filename should not include ${FILE_EXTENSION}`;
  } else {
    return "";
  }
}

export function isTagValid(tag: string): string {
  if (tag.includes(TAG_SEPARATOR)) {
    return `Tag ${tag} should not include ${TAG_SEPARATOR}`;
  } else {
    return "";
  }
}

function generatePermanentUrlWorkspace(key: string) {
  const baseUrl = window.location.origin;
  const { fileName } = extractTags(key);
  const url = new URL(baseUrl);
  url.searchParams.set(URL_SEARCH_PARAM_WORKSPACE, encodeURIComponent(fileName));
  return url.toString();
}

export async function handleCopyUrlWorkspace(key: string) {
  const url = generatePermanentUrlWorkspace(key);
  await navigator.clipboard.writeText(url);
}

export function handleAddTag(
  tag: string,
  tags: Set<string>,
  setError: (error: string) => void,
  setTags: (tags: Set<string>) => void,
) {
  const tagsToAdd: string[] = [];
  const errors: string[] = [];

  for (const splittedTag of tag.split(",")) {
    const trimmedTag = splittedTag.trim();
    if (!trimmedTag) continue;

    const error = isTagValid(trimmedTag);
    if (error) {
      errors.push(error);
      continue;
    }

    tagsToAdd.push(trimmedTag);
  }

  setTags(new Set([...tags, ...tagsToAdd]));
  if (errors.length > 0) {
    setError(errors.join(", "));
  } else {
    setError("");
  }
}

const FILE_EXTENSION = ".md";
const TAGS_SECTION_SEPARATOR = "-**tags**-";
const TAG_SEPARATOR = "-";
const USER_SECTION_SEPARATOR = "-**user**-";
export const URL_SEARCH_PARAM_WORKSPACE = "workspace";

export interface FileInfo {
  fileName: string;
  tags: Set<string>;
  fullName?: string;
}

export function extractTags(key: string): FileInfo {
  // Format: filename-**tags**-tag1-tag2-**user**-Full Name.md
  // Legacy: filename-**tags**-tag1-tag2.md
  // Very legacy: filename.md

  const keyWithoutExtension = key.split(FILE_EXTENSION)[0];

  // Split by user section separator first
  const userSplit = keyWithoutExtension.split(USER_SECTION_SEPARATOR);
  const beforeUser = userSplit[0];
  const encodedFullName = userSplit[1] || undefined;

  // Decode fullName: stored without comma, in "First Middle Last" order
  const fullName = encodedFullName;

  // Split by tags section separator
  const tagsSplit = beforeUser.split(TAGS_SECTION_SEPARATOR);
  const fileName = tagsSplit[0];
  const tagsArr = tagsSplit[1] ? tagsSplit[1].split(TAG_SEPARATOR) : [];
  const tags = new Set(tagsArr);

  return { fileName, tags, fullName };
}

export function createKey({ fileName, tags, fullName }: FileInfo): string {
  let key = fileName;

  // Add tags section
  key += `${TAGS_SECTION_SEPARATOR}${Array.from(tags).join(TAG_SEPARATOR)}`;

  // Add user section if provided
  if (fullName) {
    // Encode fullName: remove comma and reorder from "Last, First Middle" to "First Middle Last"
    let encodedFullName = fullName;
    if (fullName.includes(",")) {
      const parts = fullName.split(",").map((part) => part.trim());
      // parts[0] = Last name, parts[1] = First Middle names
      if (parts.length === 2) {
        encodedFullName = `${parts[1]} ${parts[0]}`.trim();
      } else {
        console.warn(`fn createKey - Unexpected fullName format: ${fullName}`);
      }
    }
    key += `${USER_SECTION_SEPARATOR}${encodedFullName}`;
  }

  return `${key}${FILE_EXTENSION}`;
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

function isTagValid(tag: string): string {
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

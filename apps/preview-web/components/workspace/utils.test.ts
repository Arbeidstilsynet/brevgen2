import { describe, expect, it, vi } from "vitest";
import { createKey, extractTags, handleAddTag } from "./utils";

describe("extractTags", () => {
  describe("legacy formats", () => {
    it("should extract filename without tags or user", () => {
      const result = extractTags("myfile-**tags**-.md");
      expect(result.fileName).toBe("myfile");
      expect(result.tags).toEqual(new Set());
      expect(result.fullName).toBeUndefined();
    });

    it("should handle very old format without tags section", () => {
      const result = extractTags("oldfile.md");
      expect(result.fileName).toBe("oldfile");
      expect(result.tags).toEqual(new Set());
      expect(result.fullName).toBeUndefined();
    });
  });

  describe("tags", () => {
    it("should extract single tag", () => {
      const result = extractTags("file-**tags**-important.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set(["important"]));
      expect(result.fullName).toBeUndefined();
    });

    it("should extract multiple tags", () => {
      const result = extractTags("file-**tags**-important-urgent-review.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set(["important", "urgent", "review"]));
      expect(result.fullName).toBeUndefined();
    });

    it("should handle empty tags section", () => {
      const result = extractTags("file-**tags**-.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set());
      expect(result.fullName).toBeUndefined();
    });
  });

  describe("user information", () => {
    it("should extract user from file with tags", () => {
      const result = extractTags("file-**tags**-tag1-**user**-John Doe.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set(["tag1"]));
      expect(result.fullName).toBe("John Doe");
    });

    it("should extract user with multiple name parts", () => {
      const result = extractTags("file-**tags**-tag1-**user**-John Middle Doe.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set(["tag1"]));
      expect(result.fullName).toBe("John Middle Doe");
    });

    it("should extract user from file without tags", () => {
      const result = extractTags("file-**tags**--**user**-Jane Smith.md");
      expect(result.fileName).toBe("file");
      expect(result.tags).toEqual(new Set());
      expect(result.fullName).toBe("Jane Smith");
    });
  });

  describe("complex filenames", () => {
    it("should handle filename with spaces in the middle", () => {
      const result = extractTags("my complex file-**tags**-tag1-tag2-**user**-John Doe.md");
      expect(result.fileName).toBe("my complex file");
      expect(result.tags).toEqual(new Set(["tag1", "tag2"]));
      expect(result.fullName).toBe("John Doe");
    });

    it("should handle filename with special characters", () => {
      const result = extractTags("file_with-special-chars-**tags**-important.md");
      expect(result.fileName).toBe("file_with-special-chars");
      expect(result.tags).toEqual(new Set(["important"]));
      expect(result.fullName).toBeUndefined();
    });
  });
});

describe("createKey", () => {
  describe("basic functionality", () => {
    it("should create key with filename and no tags or user", () => {
      const result = createKey({ fileName: "myfile", tags: new Set() });
      expect(result).toBe("myfile-**tags**-.md");
    });

    it("should create key with filename and single tag", () => {
      const result = createKey({ fileName: "myfile", tags: new Set(["important"]) });
      expect(result).toBe("myfile-**tags**-important.md");
    });

    it("should create key with filename and multiple tags", () => {
      const result = createKey({ fileName: "myfile", tags: new Set(["tag1", "tag2", "tag3"]) });
      // Note: Set order is not guaranteed, but the key should contain all tags
      expect(result).toMatch(/^myfile-\*\*tags\*\*-/);
      expect(result).toContain("tag1");
      expect(result).toContain("tag2");
      expect(result).toContain("tag3");
      expect(result).toMatch(/\.md$/);
    });
  });

  describe("user information", () => {
    it("should create key with user info", () => {
      const result = createKey({ fileName: "file", tags: new Set(["tag1"]), fullName: "John Doe" });
      expect(result).toBe("file-**tags**-tag1-**user**-John Doe.md");
    });

    it("should create key without user info when not provided", () => {
      const result = createKey({ fileName: "file", tags: new Set(["tag1"]) });
      expect(result).toBe("file-**tags**-tag1.md");
    });

    it("should create key with user info and no tags", () => {
      const result = createKey({ fileName: "file", tags: new Set(), fullName: "Jane Smith" });
      expect(result).toBe("file-**tags**--**user**-Jane Smith.md");
    });
  });

  describe("Entra ID name format handling", () => {
    it("should convert comma-separated name from 'Last, First Middle' to 'First Middle Last'", () => {
      const result = createKey({
        fileName: "file",
        tags: new Set(["tag1"]),
        fullName: "Nordmann, Ola Normann",
      });
      expect(result).toBe("file-**tags**-tag1-**user**-Ola Normann Nordmann.md");
    });

    it("should handle name with comma and only first name", () => {
      const result = createKey({ fileName: "file", tags: new Set(), fullName: "Doe, John" });
      expect(result).toBe("file-**tags**--**user**-John Doe.md");
    });

    it("should pass through name without comma unchanged", () => {
      const result = createKey({ fileName: "file", tags: new Set(), fullName: "John Doe" });
      expect(result).toBe("file-**tags**--**user**-John Doe.md");
    });

    it("should handle name with multiple middle names", () => {
      const result = createKey({
        fileName: "file",
        tags: new Set(),
        fullName: "Smith, John Michael Robert",
      });
      expect(result).toBe("file-**tags**--**user**-John Michael Robert Smith.md");
    });
  });
});

describe("roundtrip encoding/decoding", () => {
  it("should roundtrip filename with tags", () => {
    const originalFileInfo = { fileName: "myfile", tags: new Set(["tag1", "tag2"]) };
    const key = createKey(originalFileInfo);
    const result = extractTags(key);

    expect(result.fileName).toBe("myfile");
    expect(result.tags).toEqual(originalFileInfo.tags);
    expect(result.fullName).toBeUndefined();
  });

  it("should roundtrip filename with tags and user (no comma)", () => {
    const originalFileInfo = { fileName: "myfile", tags: new Set(["tag1"]), fullName: "John Doe" };
    const key = createKey(originalFileInfo);
    const result = extractTags(key);

    expect(result.fileName).toBe("myfile");
    expect(result.tags).toEqual(new Set(["tag1"]));
    expect(result.fullName).toBe("John Doe");
  });

  it("should roundtrip filename with Entra ID format name", () => {
    const originalFileInfo = {
      fileName: "myfile",
      tags: new Set(["important"]),
      fullName: "Nordmann, Ola Normann",
    };
    const key = createKey(originalFileInfo);
    const result = extractTags(key);

    expect(result.fileName).toBe("myfile");
    expect(result.tags).toEqual(new Set(["important"]));
    // After encoding, the name should be in "First Middle Last" format without comma
    expect(result.fullName).toBe("Ola Normann Nordmann");
    expect(result.fullName).not.toContain(",");
  });

  it("should handle legacy files without user info", () => {
    const legacyKey = "oldfile-**tags**-tag1.md";
    const result = extractTags(legacyKey);

    expect(result.fileName).toBe("oldfile");
    expect(result.tags).toEqual(new Set(["tag1"]));
    expect(result.fullName).toBeUndefined();

    // Creating a new key from this should add user info if provided
    const newKey = createKey({ ...result, fullName: "New User" });
    const newResult = extractTags(newKey);
    expect(newResult.fullName).toBe("New User");
  });
});

describe("handleAddTag", () => {
  describe("single tag", () => {
    it("should add a single valid tag", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("newtag", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["newtag"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should add tag to existing tags", () => {
      const tags = new Set(["existing1", "existing2"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("newtag", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["existing1", "existing2", "newtag"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should trim whitespace from tag", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("  spacey  ", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["spacey"]));
      expect(setError).toHaveBeenCalledWith("");
    });
  });

  describe("multiple tags (comma-separated)", () => {
    it("should add multiple comma-separated tags", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("tag1, tag2, tag3", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["tag1", "tag2", "tag3"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should trim whitespace from each tag", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("  tag1  ,  tag2  ,  tag3  ", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["tag1", "tag2", "tag3"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should add multiple tags to existing tags", () => {
      const tags = new Set(["existing"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("new1, new2", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["existing", "new1", "new2"]));
      expect(setError).toHaveBeenCalledWith("");
    });
  });

  describe("empty/whitespace input", () => {
    it("should handle empty string", () => {
      const tags = new Set(["existing"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["existing"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should ignore empty tags in comma-separated list", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("tag1, , tag2", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["tag1", "tag2"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should handle only whitespace", () => {
      const tags = new Set(["existing"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("   ", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["existing"]));
      expect(setError).toHaveBeenCalledWith("");
    });
  });

  describe("invalid tags (containing separator)", () => {
    it("should reject tag containing dash separator", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("invalid-tag", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set());
      expect(setError).toHaveBeenCalledWith("Tag invalid-tag should not include -");
    });

    it("should add valid tags and report error for invalid ones", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("valid1, invalid-tag, valid2", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["valid1", "valid2"]));
      expect(setError).toHaveBeenCalledWith("Tag invalid-tag should not include -");
    });

    it("should report multiple errors for multiple invalid tags", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("invalid-1, invalid-2", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set());
      expect(setError).toHaveBeenCalledWith(
        "Tag invalid-1 should not include -, Tag invalid-2 should not include -",
      );
    });

    it("should add valid tags even when some are invalid", () => {
      const tags = new Set(["existing"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("valid, invalid-tag, another-invalid, alsovalid", tags, setError, setTags);

      expect(setTags).toHaveBeenCalledWith(new Set(["existing", "valid", "alsovalid"]));
      expect(setError).toHaveBeenCalledWith(
        "Tag invalid-tag should not include -, Tag another-invalid should not include -",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle tag that already exists (Set deduplication)", () => {
      const tags = new Set(["existing"]);
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("existing", tags, setError, setTags);

      // Set automatically handles duplicates
      expect(setTags).toHaveBeenCalledWith(new Set(["existing"]));
      expect(setError).toHaveBeenCalledWith("");
    });

    it("should handle duplicate tags in comma-separated input", () => {
      const tags = new Set<string>();
      const setError = vi.fn();
      const setTags = vi.fn();

      handleAddTag("tag1, tag1, tag2", tags, setError, setTags);

      // Set automatically handles duplicates
      expect(setTags).toHaveBeenCalledWith(new Set(["tag1", "tag2"]));
      expect(setError).toHaveBeenCalledWith("");
    });
  });
});

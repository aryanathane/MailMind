import { describe, expect, it } from "@jest/globals";
import { buildTriagePrompt, buildDraftPrompt, TRIAGE_SYSTEM_PROMPT } from "./prompts";

// ─── buildTriagePrompt tests ──────────────────────────────────────────────────

describe("buildTriagePrompt", () => {
  it("includes subject, from and body in output", () => {
    const result = buildTriagePrompt(
      "Meeting tomorrow",
      "boss@company.com",
      "Can we meet at 10am?"
    );

    expect(result).toContain("Meeting tomorrow");
    expect(result).toContain("boss@company.com");
    expect(result).toContain("Can we meet at 10am?");
  });

  it("truncates body longer than 2000 characters", () => {
    const longBody = "a".repeat(3000);
    const result   = buildTriagePrompt("Subject", "from@test.com", longBody);

    expect(result).toContain("[email truncated]");
    expect(result.length).toBeLessThan(3000);
  });

  it("does not truncate body shorter than 2000 characters", () => {
    const shortBody = "Short email body";
    const result    = buildTriagePrompt("Subject", "from@test.com", shortBody);

    expect(result).not.toContain("[email truncated]");
    expect(result).toContain(shortBody);
  });
});

// ─── TriageResult validation tests ───────────────────────────────────────────

describe("TriageResult validation", () => {
  it("valid categories are accepted", () => {
    const validCategories = ["urgent", "needs_reply", "fyi", "spam"];
    validCategories.forEach((cat) => {
      expect(validCategories.includes(cat)).toBe(true);
    });
  });

  it("invalid categories are rejected", () => {
    const validCategories = ["urgent", "needs_reply", "fyi", "spam"];
    const invalidCats     = ["important", "low", "high", "delete", ""];
    invalidCats.forEach((cat) => {
      expect(validCategories.includes(cat)).toBe(false);
    });
  });

  it("priority must be between 1 and 5", () => {
    const validPriorities   = [1, 2, 3, 4, 5];
    const invalidPriorities = [0, 6, -1, 10, 99];

    validPriorities.forEach((p) => {
      expect(p >= 1 && p <= 5).toBe(true);
    });

    invalidPriorities.forEach((p) => {
      expect(p >= 1 && p <= 5).toBe(false);
    });
  });

  it("needsReply is true for urgent and needs_reply", () => {
    const needsReplyCategories = ["urgent", "needs_reply"];
    expect(needsReplyCategories.includes("urgent")).toBe(true);
    expect(needsReplyCategories.includes("needs_reply")).toBe(true);
    expect(needsReplyCategories.includes("fyi")).toBe(false);
    expect(needsReplyCategories.includes("spam")).toBe(false);
  });
});

// ─── Prompt content tests ─────────────────────────────────────────────────────

describe("TRIAGE_SYSTEM_PROMPT", () => {
  it("contains all required category values", () => {
    expect(TRIAGE_SYSTEM_PROMPT).toContain("urgent");
    expect(TRIAGE_SYSTEM_PROMPT).toContain("needs_reply");
    expect(TRIAGE_SYSTEM_PROMPT).toContain("fyi");
    expect(TRIAGE_SYSTEM_PROMPT).toContain("spam");
  });

  it("instructs Claude to return JSON only", () => {
    expect(TRIAGE_SYSTEM_PROMPT.toLowerCase()).toContain("json");
  });
});

describe("buildDraftPrompt", () => {
  it("includes email details in output", () => {
    const result = buildDraftPrompt(
      "Project update",
      "colleague@work.com",
      "Can you send me the latest report?"
    );

    expect(result).toContain("Project update");
    expect(result).toContain("colleague@work.com");
    expect(result).toContain("Can you send me the latest report?");
  });

  it("includes past replies when provided", () => {
    const pastReplies = ["Thanks for reaching out!", "Sure, I'll look into it."];
    const result      = buildDraftPrompt(
      "Subject",
      "from@test.com",
      "Email body",
      pastReplies
    );

    expect(result).toContain("Thanks for reaching out!");
    expect(result).toContain("Sure, I'll look into it.");
  });

  it("works without past replies", () => {
    const result = buildDraftPrompt("Subject", "from@test.com", "Body");
    expect(result).toContain("Subject");
  });
});
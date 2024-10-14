import { describe, expect, it } from "vitest";
import { tokenize } from "../src/tokenizer";

describe("tokenizer", () => {
  it("should tokenize a string", () => {
    const tokens = tokenize('"hello"');
    expect(tokens).toEqual([
      { type: "string", line: 1, column: 1, value: "hello" },
    ]);
  });
  it("should tokenize multiple strings", () => {
    const tokens = tokenize('"hello" "world"');
    expect(tokens).toEqual([
      { type: "string", line: 1, column: 1, value: "hello" },
      { type: "string", line: 1, column: 9, value: "world" },
    ]);
  });
  it("should throw an error when a string is not terminated", () => {
    expect(() => tokenize('"hello')).toThrow(
      "Unterminated string at line 1, column 7"
    );
  });
  it("should tokenize an identifier", () => {
    const tokens = tokenize("hello");
    expect(tokens).toEqual([
      { type: "identifier", line: 1, column: 1, value: "hello" },
    ]);
  });
  it("should tokenize multiple identifiers", () => {
    const tokens = tokenize("hello world");
    expect(tokens).toEqual([
      { type: "identifier", line: 1, column: 1, value: "hello" },
      { type: "identifier", line: 1, column: 7, value: "world" },
    ]);
  });
});

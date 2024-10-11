import { describe, expect, it } from "vitest";
import { Tokenizer, TokenType } from "../src/tokenizer";

describe("Tokenizer", () => {
  it("should tokenize an empty file", () => {
    const tokens = Tokenizer.tokenize("");
    expect(tokens).toEqual([{ type: "eof" }]);
  });

  it("should tokenize an identifier", () => {
    const tokens = Tokenizer.tokenize("abc _def gh-ij");
    expect(tokens).toEqual([
      { type: "identifier", value: "abc" },
      { type: "identifier", value: "_def" },
      { type: "identifier", value: "gh-ij" },
      { type: "eof" },
    ]);
  });

  it("should tokenize two identifiers separated by a dot", () => {
    const tokens = Tokenizer.tokenize("abc.def");
    expect(tokens).toEqual([
      { type: "identifier", value: "abc" },
      { type: "dot" },
      { type: "identifier", value: "def" },
      { type: "eof" },
    ]);
  });

  it("should tokenize an attribution", () => {
    const tokens = Tokenizer.tokenize("abc = def");
    expect(tokens).toEqual([
      { type: "identifier", value: "abc" },
      { type: "equal" },
      { type: "identifier", value: "def" },
      { type: "eof" },
    ]);
  });

  it("should tokenize a string", () => {
    const tokens = Tokenizer.tokenize('"abc"');
    expect(tokens).toEqual([{ type: "string", value: "abc" }, { type: "eof" }]);
  });

  it("should tokenize a string with escaped quotes", () => {
    const tokens = Tokenizer.tokenize('"a\\"bc"');
    expect(tokens).toEqual([
      { type: "string", value: 'a"bc' },
      { type: "eof" },
    ]);
  });

  it("should throw an error when a string is not closed", () => {
    expect(() => Tokenizer.tokenize('"abc')).toThrowError(
      "Unterminated string"
    );
  });

  it("should tokenize parentheses, curly and square braces", () => {
    const tokens = Tokenizer.tokenize("(){}[]");
    expect(tokens).toEqual([
      { type: "open_paren" },
      { type: "close_paren" },
      { type: "open_curly" },
      { type: "close_curly" },
      { type: "open_square" },
      { type: "close_square" },
      { type: "eof" },
    ]);
  });

  it("should tokenize new lines", () => {
    const tokens = Tokenizer.tokenize("\n\n");
    expect(tokens).toEqual([
      { type: "new_line" },
      { type: "new_line" },
      { type: "eof" },
    ]);
  });

  it("should tokenize an integer number", () => {
    const tokens = Tokenizer.tokenize("123");
    expect(tokens).toEqual([{ type: "number", value: 123 }, { type: "eof" }]);
  });

  it("should tokenize a float number", () => {
    const tokens = Tokenizer.tokenize("123.456 321.");
    expect(tokens).toEqual([
      { type: "number", value: 123.456 },
      { type: "number", value: 321 },
      { type: "eof" },
    ]);
  });

  it("should throw an error when the number has an invalid format", () => {
    expect(() => Tokenizer.tokenize("123.12.1")).toThrowError("Invalid number");
  });

  it("should tokenize negative numbers", () => {
    const tokens = Tokenizer.tokenize("-123 -456.7");
    expect(tokens).toEqual([
      { type: "number", value: -123 },
      { type: "number", value: -456.7 },
      { type: "eof" },
    ]);
  });

  it("should tokenize a line comment", () => {
    const tokens = Tokenizer.tokenize("abc // this is a comment");
    expect(tokens).toEqual([
      { type: "identifier", value: "abc" },
      { type: "line_comment", value: " this is a comment" },
      { type: "eof" },
    ]);
  });
});

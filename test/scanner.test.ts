import { describe, it, expect } from "vitest";
import { createScanner } from "../src/scanner";

describe("createScanner", () => {
  it("eof() should return true when the end of the file is reached", () => {
    const scanner = createScanner("");
    expect(scanner.eof()).toBe(true);
  });

  it("peek() should return the current character", () => {
    const scanner = createScanner("abc");
    expect(scanner.peek()).toBe("a");
  });

  it("forward() should move the position forward by one", () => {
    const scanner = createScanner("abc");
    expect(scanner.peek()).toBe("a");
    scanner.forward();
    expect(scanner.peek()).toBe("b");
    scanner.forward();
    expect(scanner.peek()).toBe("c");
    scanner.forward();
    expect(scanner.eof()).toBe(true);
  });

  it("skipWhitespace() should skip all whitespace characters", () => {
    const scanner = createScanner("  \t\tabc");
    scanner.skipWhitespace();
    expect(scanner.peek()).toBe("a");
  });

  it("peekNext() should return the next character", () => {
    const scanner = createScanner("abc");
    expect(scanner.peekNext()).toBe("b");
  });

  it("peekNext() should return an empty string when the end of the file is reached", () => {
    const scanner = createScanner("a");
    scanner.forward();
    expect(scanner.peekNext()).toBe("");
  });
});

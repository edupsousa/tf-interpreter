import { Scanner } from "./scanner";

type TokenType =
  | "new_line"
  | "open_paren"
  | "close_paren"
  | "open_curly"
  | "close_curly"
  | "open_square"
  | "close_square"
  | "dot"
  | "equal"
  | "line_comment"
  | "string"
  | "number"
  | "identifier"
  | "eof";

type Token = {
  type: TokenType;
};

type IdentifierToken = Token & {
  type: "identifier";
  value: string;
};

type StringToken = Token & {
  type: "string";
  value: string;
};

type NumberToken = Token & {
  type: "number";
  value: number;
};

type LineCommentToken = Token & {
  type: "line_comment";
  value: string;
};

class Tokenizer {
  static tokenize(content: string): Token[] {
    const scanner = new Scanner(content);
    const tokens: Token[] = Tokenizer.scanTokens(scanner);
    return tokens;
  }

  static scanTokens(scanner: Scanner): Token[] {
    const tokens: Token[] = [];
    while (!scanner.eof()) {
      const token = Tokenizer.scanToken(scanner);
      tokens.push(token);
    }
    if (tokens.length === 0 || tokens[tokens.length - 1].type !== "eof") {
      tokens.push({ type: "eof" });
    }
    return tokens;
  }

  static scanToken(scanner: Scanner): Token {
    scanner.skipWhitespace();
    if (scanner.eof()) {
      return { type: "eof" };
    }
    const singleToken = Tokenizer.scanSingleToken(scanner);
    if (singleToken) {
      return singleToken;
    }
    const doubleToken = Tokenizer.scanDoubleToken(scanner);
    if (doubleToken) {
      return doubleToken;
    }
    const stringToken = Tokenizer.scanString(scanner);
    if (stringToken) {
      return stringToken;
    }
    const numberToken = Tokenizer.scanNumber(scanner);
    if (numberToken) {
      return numberToken;
    }
    if (Tokenizer.matchIdentifier(scanner)) {
      return Tokenizer.scanIdentifier(scanner);
    }

    throw new Error(`Unexpected character: ${scanner.peek()}`);
  }

  static scanNumber(scanner: Scanner): NumberToken | false {
    let isDecimal = false;
    let value = "";
    while (!scanner.eof()) {
      const char = scanner.peek();
      if (char === "-" && value === "") {
        value += char;
        scanner.forward();
      } else if (Tokenizer.isNumeric(char)) {
        value += char;
        scanner.forward();
      } else if (char === ".") {
        if (isDecimal) {
          throw new Error("Invalid number");
        }
        isDecimal = true;
        value += char;
        scanner.forward();
      } else {
        break;
      }
    }
    if (value === "") {
      return false;
    }
    return {
      type: "number",
      value: isDecimal ? parseFloat(value) : parseInt(value, 10),
    };
  }

  static scanString(scanner: Scanner): StringToken | false {
    if (scanner.peek() !== '"') {
      return false;
    }
    scanner.forward();
    let value = "";
    while (!scanner.eof()) {
      const char = scanner.peek();
      if (char === "\\") {
        scanner.forward();
        value += scanner.peek();
        scanner.forward();
        continue;
      } else if (char === '"') {
        scanner.forward();
        return { type: "string", value };
      }
      value += char;
      scanner.forward();
    }
    throw new Error("Unterminated string");
  }

  static scanDoubleToken(scanner: Scanner): Token | false {
    const char = scanner.peek();
    const nextChar = scanner.peekNext();
    let token: LineCommentToken | false = false;
    if (char === "/" && nextChar === "/") {
      scanner.forward();
      scanner.forward();
      let value = "";
      while (!scanner.eof()) {
        const char = scanner.peek();
        if (char === "\n") {
          break;
        }
        value += char;
        scanner.forward();
      }
      token = { type: "line_comment", value };
    }
    return token;
  }

  static scanSingleToken(scanner: Scanner): Token | false {
    const char = scanner.peek();
    let token: Token | false = false;
    if (char === ".") {
      token = { type: "dot" };
    } else if (char === "=") {
      token = { type: "equal" };
    } else if (char === "(") {
      token = { type: "open_paren" };
    } else if (char === ")") {
      token = { type: "close_paren" };
    } else if (char === "{") {
      token = { type: "open_curly" };
    } else if (char === "}") {
      token = { type: "close_curly" };
    } else if (char === "[") {
      token = { type: "open_square" };
    } else if (char === "]") {
      token = { type: "close_square" };
    } else if (char === "\n") {
      token = { type: "new_line" };
    }

    if (token !== false) {
      scanner.forward();
    }
    return token;
  }

  private static matchIdentifier(scanner: Scanner) {
    const char = scanner.peek();
    return Tokenizer.isAlpha(char) || Tokenizer.isUnderscore(char);
  }

  static isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
  }

  static isNumeric(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  static isUnderscore(char: string): boolean {
    return char === "_";
  }

  static isHyphen(char: string): boolean {
    return char === "-";
  }

  static scanIdentifier(scanner: Scanner): IdentifierToken {
    let value = "";
    while (!scanner.eof()) {
      const char = scanner.peek();
      if (
        Tokenizer.isAlpha(char) ||
        Tokenizer.isNumeric(char) ||
        Tokenizer.isUnderscore(char) ||
        Tokenizer.isHyphen(char)
      ) {
        value += char;
        scanner.forward();
      } else {
        break;
      }
    }
    return { type: "identifier", value };
  }
}

export { Tokenizer, TokenType, Token };

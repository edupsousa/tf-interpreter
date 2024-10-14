import { createScanner, Position, Scanner } from "./scanner";

const unsizedTokens = {
  "\n": "newline",
  "+": "plus",
  "-": "minus",
  "*": "star",
  "/": "slash",
  "%": "percent",
  "&&": "and_and",
  "||": "pipe_pipe",
  "!": "bang",
  "==": "equal_equal",
  "!=": "bang_equal",
  "<": "less",
  "<=": "less_equal",
  ">": "greater",
  ">=": "greater_equal",
  ":": "colon",
  "?": "question",
  "{": "left_brace",
  "}": "right_brace",
  "=": "equal",
  "=>": "equal_greater",
  "[": "left_bracket",
  "]": "right_bracket",
  "(": "left_paren",
  ")": "right_paren",
  ".": "dot",
  ",": "comma",
  "...": "ellipsis",
  "${": "dollar_left_brace",
  "%{": "percent_left_brace",
} as const;

type UnsizedTokenKey = keyof typeof unsizedTokens;
type UnsizedTokenType = (typeof unsizedTokens)[UnsizedTokenKey];

type SizedTokenType =
  | "block_comment"
  | "line_comment"
  | "string"
  | "number"
  | "identifier";

type UnsizedToken = {
  type: UnsizedTokenType;
  start: Position;
};

type SizedToken = {
  type: SizedTokenType;
  start: Position;
  end: Position;
  value: string;
};

type HeredocTokenType = "heredoc_string";

type HeredocStringToken = Omit<SizedToken, "type"> & {
  type: HeredocTokenType;
  delimiter: string;
  indented: boolean;
};

type UnknownTokenType = "unknown";

type UnknownToken = {
  type: UnknownTokenType;
  start: Position;
  end: Position;
  value: string;
};

export type TokenType =
  | UnsizedTokenType
  | SizedTokenType
  | HeredocTokenType
  | UnknownTokenType;

export type Token =
  | UnsizedToken
  | SizedToken
  | HeredocStringToken
  | UnknownToken;

class TokenizerError extends Error {
  constructor(message: string, position: Position) {
    super(
      `${message} at line ${position.line}, column ${position.column}, index ${position.index}`
    );
  }
}

export function tokenize(content: string) {
  const scanner = createScanner(content);
  const tokens: Token[] = [];
  let unknownToken: UnknownToken | null = null;

  scanner.skipWhitespace();
  while (!scanner.eof()) {
    let token: Token | null = null;
    const unsizedTokenKey = getUnsizedTokenKey(scanner);
    if (peekHeredocString(scanner)) {
      token = scanHeredocString(scanner);
    } else if (peekBlockComment(scanner)) {
      token = scanBlockComment(scanner);
    } else if (peekLineComment(scanner)) {
      token = scanLineComment(scanner);
    } else if (unsizedTokenKey) {
      token = scanUnsizedToken(scanner, unsizedTokenKey);
    } else if (peekNumber(scanner)) {
      token = scanNumber(scanner);
    } else if (peekString(scanner)) {
      token = scanString(scanner);
    } else if (peekIdentifier(scanner)) {
      token = scanIdentifier(scanner);
    }
    if (token !== null) {
      if (unknownToken !== null) {
        tokens.push(unknownToken);
        unknownToken = null;
      }
      tokens.push(token);
    } else if (unknownToken === null) {
      const start = scanner.getPosition();
      unknownToken = {
        type: "unknown",
        start,
        end: start,
        value: scanner.peek(),
      };
      scanner.forward();
    } else {
      unknownToken.end = scanner.getPosition();
      unknownToken.value += scanner.peek();
      scanner.forward();
    }
    scanner.skipWhitespace();
  }

  return tokens;
}

function peekHeredocString(scanner: Scanner) {
  return scanner.peek() === "<" && scanner.peekNext() === "<";
}

function scanHeredocString(scanner: Scanner): HeredocStringToken {
  const start = scanner.getPosition();
  let indented = false;
  scanner.forward();
  scanner.forward();
  if (scanner.peek() === "-") {
    scanner.forward();
    indented = true;
  }
  let delimiter = "";
  while (!scanner.eof() && scanner.peek() !== "\n") {
    delimiter += scanner.peek();
    scanner.forward();
  }
  scanner.forward();
  const lines: string[] = [];
  while (!scanner.eof()) {
    let line = "";
    while (!scanner.eof() && scanner.peek() !== "\n") {
      line += scanner.peek();
      scanner.forward();
    }
    if (line === delimiter) {
      scanner.forward();
      break;
    }
    lines.push(line);
    scanner.forward();
  }
  const end = scanner.getPosition();
  return {
    type: "heredoc_string",
    delimiter,
    indented,
    start,
    end,
    value: lines.join("\n"),
  };
}

function peekBlockComment(scanner: Scanner) {
  return scanner.peek() === "/" && scanner.peekNext() === "*";
}

function scanBlockComment(scanner: Scanner): SizedToken {
  const start = scanner.getPosition();
  let value = "";
  scanner.forward();
  scanner.forward();
  while (!scanner.eof()) {
    if (scanner.peek() === "*" && scanner.peekNext() === "/") {
      scanner.forward();
      scanner.forward();
      const end = scanner.getPosition();
      return {
        type: "block_comment",
        value,
        start,
        end,
      };
    }
    value += scanner.peek();
    scanner.forward();
  }
  throw new TokenizerError("Unterminated block comment", scanner.getPosition());
}

function peekLineComment(scanner: Scanner) {
  return (
    (scanner.peek() === "/" && scanner.peekNext() === "/") ||
    scanner.peek() === "#"
  );
}

function scanLineComment(scanner: Scanner): SizedToken {
  const start = scanner.getPosition();
  let value = "";
  if (scanner.peek() === "/") {
    scanner.forward();
    scanner.forward();
  } else {
    scanner.forward();
  }
  while (!scanner.eof() && scanner.peek() !== "\n") {
    value += scanner.peek();
    scanner.forward();
  }
  const end = scanner.getPosition();
  return {
    type: "line_comment",
    value,
    start,
    end,
  };
}

function peekNumber(scanner: Scanner) {
  return /[\-0-9]/.test(scanner.peek());
}

function scanNumber(scanner: Scanner): SizedToken {
  const start = scanner.getPosition();
  let value = "";
  let isDecimal = false;
  let char = scanner.peek();
  while (!scanner.eof() && /[0-9.]/.test(char)) {
    if (char === "." && isDecimal) {
      throw new TokenizerError(
        "Unexpected decimal separator",
        scanner.getPosition()
      );
    } else if (char === ".") {
      isDecimal = true;
    }
    value += char;
    scanner.forward();
    char = scanner.peek();
  }
  const end = scanner.getPosition();
  return {
    type: "number",
    value,
    start,
    end,
  };
}

function getUnsizedTokenKey(scanner: Scanner): UnsizedTokenKey | false {
  let value = scanner.peek() + scanner.peekNext() + scanner.peekNextNext();
  while (value.length > 0) {
    if (value in unsizedTokens) {
      return value as UnsizedTokenKey;
    }
    value = value.slice(0, value.length - 1);
  }
  return false;
}

function scanUnsizedToken(
  scanner: Scanner,
  key: UnsizedTokenKey
): UnsizedToken {
  const start = scanner.getPosition();
  for (let i = 0; i < key.length; i++) {
    scanner.forward();
  }
  return {
    type: unsizedTokens[key],
    start,
  };
}

function peekIdentifier(scanner: Scanner) {
  return /[a-zA-Z_]/.test(scanner.peek());
}

function scanIdentifier(scanner: Scanner): SizedToken {
  const start = scanner.getPosition();
  let value = "";
  while (!scanner.eof() && /[a-zA-Z0-9_\-]/.test(scanner.peek())) {
    value += scanner.peek();
    scanner.forward();
  }
  const end = scanner.getPosition();
  return {
    type: "identifier",
    value,
    start,
    end,
  };
}

function peekString(scanner: Scanner) {
  return scanner.peek() === '"';
}

function scanString(scanner: Scanner): SizedToken {
  const start = scanner.getPosition();
  let value = "";
  scanner.forward();
  let char = scanner.peek();
  while (!scanner.eof() && char !== '"') {
    if (char === "\\" && scanner.peekNext() === '"') {
      char = '"';
      scanner.forward();
      scanner.forward();
    } else {
      value += char;
      scanner.forward();
    }
    char = scanner.peek();
  }
  if (scanner.eof()) {
    throw new TokenizerError("Unterminated string", scanner.getPosition());
  }
  scanner.forward();
  const end = scanner.getPosition();
  return {
    type: "string",
    value,
    start,
    end,
  };
}

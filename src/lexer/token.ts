import { TokenType } from "./token-type";

export class Token<
  TLiteral extends string | number | void = string | number | void
> {
  type: TokenType;
  lexeme: string;
  literal: TLiteral;
  line: number;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: TLiteral,
    line: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  public toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

type StringKind = TokenType.STRING | TokenType.LESS_LESS_HEREDOC;
export class StringToken extends Token<string> {
  indented: boolean = false;
  delimiter: string = "";

  constructor(kind: StringKind, lexeme: string, literal: string, line: number) {
    super(kind, lexeme, literal, line);
  }

  public static fromString(lexeme: string, literal: string, line: number) {
    return new StringToken(TokenType.STRING, lexeme, literal, line);
  }

  public static fromHeredoc(
    lexeme: string,
    literal: string,
    line: number,
    indented: boolean,
    delimiter: string
  ) {
    const token = new StringToken(
      TokenType.LESS_LESS_HEREDOC,
      lexeme,
      literal,
      line
    );
    token.indented = indented;
    token.delimiter = delimiter;
    return token;
  }
}

export class NumberToken extends Token<number> {
  constructor(lexeme: string, literal: number, line: number) {
    super(TokenType.NUMBER, lexeme, literal, line);
  }
}

export class VoidToken extends Token<void> {
  constructor(type: TokenType, lexeme: string, line: number) {
    super(type, lexeme, undefined, line);
  }
}

type CommentKind =
  | TokenType.SLASH_SLASH_COMMENT
  | TokenType.SLASH_STAR_COMMENT
  | TokenType.HASHBANG_COMMENT;
export class CommentToken extends Token<string> {
  constructor(
    kind: CommentKind,
    lexeme: string,
    literal: string,
    line: number
  ) {
    super(kind, lexeme, literal, line);
  }
}

export class IdentifierToken extends Token<string> {
  constructor(lexeme: string, line: number) {
    super(TokenType.IDENTIFIER, lexeme, lexeme, line);
  }
}

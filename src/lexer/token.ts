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

import { Token } from "../lexer/token";
import { TokenType } from "../lexer/token-type";
import {
  ConfigFile,
  Attribute,
  Block,
  Identifier,
  Body,
  Expression,
  StringLiteral,
} from "./syntax-tree";

class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserError";
  }
}

export class Parser {
  tokens: Token[];
  current = 0;

  private constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.preprocessTokens();
  }

  private preprocessTokens() {
    const newTokens = this.tokens
      .filter(
        (token) =>
          token.type !== TokenType.HASHBANG_COMMENT &&
          token.type !== TokenType.SLASH_SLASH_COMMENT &&
          token.type !== TokenType.SLASH_STAR_COMMENT
      )
      .filter(
        (token, index, tokens) =>
          !(
            token.type === TokenType.EOL &&
            tokens[index + 1]?.type === TokenType.EOL
          )
      );
    this.tokens = newTokens;
  }

  static parseConfigFile(tokens: Token[]) {
    const parser = new Parser(tokens);
    return parser.configFile();
  }

  private configFile() {
    return new ConfigFile(this.body());
  }

  private body() {
    const children: Array<Attribute | Block> = [];
    while (this.match(TokenType.IDENTIFIER)) {
      const identifier = new Identifier(this.previous());
      if (this.match(TokenType.EQUAL)) {
        children.push(this.attribute(identifier));
      } else if (
        this.match(TokenType.IDENTIFIER, TokenType.STRING, TokenType.LEFT_CURLY)
      ) {
        children.push(this.block(identifier));
      }
      this.match(TokenType.EOL);
    }
    return new Body(children);
  }

  private attribute(identifier: Identifier) {
    const expression = this.expression();
    return new Attribute(identifier, expression);
  }

  private expression() {
    const children: Array<Token> = [];
    while (!this.match(TokenType.EOL)) {
      const curr = this.advance();
      children.push(curr);
    }
    return new Expression(children);
  }

  private block(identifier: Identifier) {
    const labels: Array<Identifier | StringLiteral> = [];
    let previous = this.previous();
    while (previous.type !== TokenType.LEFT_CURLY) {
      if (previous.type === TokenType.IDENTIFIER) {
        labels.push(new Identifier(previous));
      } else if (previous.type === TokenType.STRING) {
        labels.push(new StringLiteral(previous));
      } else {
        throw new ParserError(`Unexpected token ${previous.lexeme}`);
      }
      previous = this.advance();
    }
    this.match(TokenType.EOL);
    const body = this.body();
    this.match(TokenType.RIGHT_CURLY);
    this.match(TokenType.EOL);
    return new Block(identifier, labels, body);
  }

  private match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private peek() {
    return this.tokens[this.current];
  }

  private previous() {
    return this.tokens[this.current - 1];
  }

  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
}

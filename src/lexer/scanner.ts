import {
  CommentToken,
  IdentifierToken,
  NumberToken,
  StringToken,
  Token,
} from "./token";
import { TokenType } from "./token-type";

export class Scanner {
  source: string;
  tokens: Token[] = [];
  start: number = 0;
  current: number = 0;
  line: number = 1;

  public static scanSource(source: string): Token[] {
    const scanner = new Scanner(source);
    return scanner.tokens;
  }

  private constructor(source: string) {
    this.source = source;
    this.scanTokens();
  }

  private scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(new Token(TokenType.EOF, "", undefined, this.line));
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.addVoidToken(TokenType.EOL);
        this.line++;
        break;
      case "&":
        if (this.match("&")) {
          this.addVoidToken(TokenType.AND_AND);
        }
        break;
      case "!":
        this.addVoidToken(
          this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG
        );
        break;
      case ":":
        this.addVoidToken(TokenType.COLON);
        break;
      case ",":
        this.addVoidToken(TokenType.COMMA);
        break;
      case "$":
        if (this.match("{")) {
          this.addVoidToken(TokenType.DOLLAR_LEFT_CURLY);
        }
        break;
      case ".":
        if (this.match(".")) {
          if (this.match(".")) {
            this.addVoidToken(TokenType.DOT_DOT_DOT);
          } else {
            console.error("Unexpected character '.'");
          }
        } else {
          this.addVoidToken(TokenType.DOT);
        }
        break;
      case "=":
        if (this.match("=")) {
          this.addVoidToken(TokenType.EQUAL_EQUAL);
        } else if (this.match(">")) {
          this.addVoidToken(TokenType.EQUAL_GREATER);
        } else {
          this.addVoidToken(TokenType.EQUAL);
        }
        break;
      case ">":
        this.addVoidToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "#":
        this.lineComment(TokenType.HASHBANG_COMMENT);
        break;
      case "[":
        this.addVoidToken(TokenType.LEFT_BRACKET);
        break;
      case "{":
        this.addVoidToken(TokenType.LEFT_CURLY);
        break;
      case "(":
        this.addVoidToken(TokenType.LEFT_PAREN);
        break;
      case "<":
        if (this.match("=")) {
          this.addVoidToken(TokenType.LESS_EQUAL);
        } else if (this.match("<")) {
          this.heredoc();
        } else {
          this.addVoidToken(TokenType.LESS);
        }
        break;
      case "-":
        this.addVoidToken(TokenType.MINUS);
        break;
      case "%":
        this.addVoidToken(
          this.match("{") ? TokenType.PERCENT_LEFT_CURLY : TokenType.PERCENT
        );
        break;
      case "|":
        if (this.match("|")) {
          this.addVoidToken(TokenType.PIPE_PIPE);
        }
        break;
      case "+":
        this.addVoidToken(TokenType.PLUS);
        break;
      case "?":
        this.addVoidToken(TokenType.QUESTION);
        break;
      case "[":
        this.addVoidToken(TokenType.RIGHT_BRACKET);
        break;
      case "}":
        this.addVoidToken(TokenType.RIGHT_CURLY);
        break;
      case ")":
        this.addVoidToken(TokenType.RIGHT_PAREN);
        break;
      case "/":
        if (this.match("/")) {
          this.lineComment(TokenType.SLASH_SLASH_COMMENT);
        } else if (this.match("*")) {
          this.multilineComment();
        } else {
          this.addVoidToken(TokenType.SLASH);
        }
        break;
      case "*":
        this.addVoidToken(TokenType.STAR);
        break;
      case '"':
        this.string();
        break;
      default:
        if (c.match(/[a-zA-Z]/)) {
          this.identifier();
        } else if (c.match(/\d/)) {
          this.number();
        } else {
          console.log(
            `Unexpected character: ${c} at line ${this.line} index ${this.current}`
          );
        }
        break;
    }
  }

  private heredoc() {
    const indented = this.match("-");
    let delimiter = "";
    while (this.peek() != "\n" && !this.isAtEnd()) {
      delimiter += this.advance();
    }
    this.advance();
    const lines: string[] = [];
    let line = "";
    while (line !== delimiter) {
      if (this.isAtEnd()) {
        console.error("Unterminated heredoc");
        return;
      }
      line = "";
      while (this.peek() != "\n" && !this.isAtEnd()) {
        line += this.advance();
      }
      if (line !== delimiter) {
        lines.push(line);
      }
      this.advance();
    }
    const value = lines.join("\n");
    this.tokens.push(
      StringToken.fromHeredoc(
        this.getCurrentLexeme(),
        value,
        this.line,
        indented,
        delimiter
      )
    );
    this.addVoidToken(TokenType.EOL);
  }

  private lineComment(
    kind: TokenType.SLASH_SLASH_COMMENT | TokenType.HASHBANG_COMMENT
  ) {
    while (this.peek() != "\n" && !this.isAtEnd()) {
      this.advance();
    }
    const value = this.source.substring(
      this.start + (kind === TokenType.SLASH_SLASH_COMMENT ? 2 : 1),
      this.current
    );
    this.tokens.push(
      new CommentToken(kind, this.getCurrentLexeme(), value, this.line)
    );
  }

  private multilineComment() {
    while (this.peek() != "*" && this.peekNext() != "/" && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      console.error("Unterminated multiline comment");
      return;
    }

    this.advance();
    this.advance();

    const value = this.source.substring(this.start + 2, this.current - 2);
    this.tokens.push(
      new CommentToken(
        TokenType.SLASH_STAR_COMMENT,
        this.getCurrentLexeme(),
        value,
        this.line
      )
    );
  }

  private identifier() {
    while (this.peek().match(/[a-zA-Z0-9_]/)) {
      this.advance();
    }

    this.tokens.push(new IdentifierToken(this.getCurrentLexeme(), this.line));
  }

  private string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        throw new Error("Unterminated string (newline)");
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      console.error("Unterminated string (end of file)");
      return;
    }

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.tokens.push(
      StringToken.fromString(this.getCurrentLexeme(), value, this.line)
    );
  }

  private number() {
    while (this.peek().match(/\d/)) {
      this.advance();
    }

    if (this.peek() == "." && this.peekNext().match(/\d/)) {
      this.advance();

      while (this.peek().match(/\d/)) {
        this.advance();
      }
    }

    if (this.peek().match(/[eE]/)) {
      this.advance();
      if (this.peek().match(/[+-]/)) {
        this.advance();
      }

      while (this.peek().match(/\d/)) {
        this.advance();
      }
    }

    const value = this.getCurrentLexeme();
    this.tokens.push(new NumberToken(value, parseFloat(value), this.line));
  }

  private advance() {
    return this.source[this.current++];
  }

  private addVoidToken(type: TokenType) {
    this.tokens.push(
      new Token(type, this.getCurrentLexeme(), undefined, this.line)
    );
  }

  private getCurrentLexeme() {
    return this.source.substring(this.start, this.current);
  }

  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] != expected) return false;
    this.current++;
    return true;
  }

  private peek() {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }
}

import { Token } from "./token";
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
        this.addToken(TokenType.EOL);
        this.line++;
        break;
      case "&":
        if (this.match("&")) {
          this.addToken(TokenType.AND_AND);
        }
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case ":":
        this.addToken(TokenType.COLON);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case "$":
        if (this.match("{")) {
          this.addToken(TokenType.DOLLAR_LEFT_CURLY);
        }
        break;
      case ".":
        if (this.match(".")) {
          if (this.match(".")) {
            this.addToken(TokenType.DOT_DOT_DOT);
          } else {
            console.error("Unexpected character '.'");
          }
        } else {
          this.addToken(TokenType.DOT);
        }
        break;
      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EQUAL_EQUAL);
        } else if (this.match(">")) {
          this.addToken(TokenType.EQUAL_GREATER);
        } else {
          this.addToken(TokenType.EQUAL);
        }
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "#":
        this.lineComment(TokenType.HASHBANG_COMMENT);
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case "{":
        this.addToken(TokenType.LEFT_CURLY);
        break;
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LESS_EQUAL);
        } else if (this.match("<")) {
          this.heredoc();
        } else {
          this.addToken(TokenType.LESS);
        }
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "%":
        this.addToken(
          this.match("{") ? TokenType.PERCENT_LEFT_CURLY : TokenType.PERCENT
        );
        break;
      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.PIPE_PIPE);
        }
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case "?":
        this.addToken(TokenType.QUESTION);
        break;
      case "[":
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_CURLY);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "/":
        if (this.match("/")) {
          this.lineComment(TokenType.SLASH_SLASH_COMMENT);
        } else if (this.match("*")) {
          this.multilineComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case "*":
        this.addToken(TokenType.STAR);
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
    this.addToken(TokenType.LESS_LESS_HEREDOC, value);
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
    this.addToken(kind, value);
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
    this.addToken(TokenType.SLASH_STAR_COMMENT, value);
  }

  private identifier() {
    while (this.peek().match(/[a-zA-Z0-9_]/)) {
      this.advance();
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken(TokenType.IDENTIFIER, value);
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
    this.addToken(TokenType.STRING, value);
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

    const value = this.source.substring(this.start, this.current);
    this.addToken(TokenType.NUMBER, value);
  }

  private advance() {
    return this.source[this.current++];
  }

  private addToken(type: TokenType, literal?: string | number | undefined) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
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

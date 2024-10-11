class Scanner {
  protected content: string;
  protected pos: number;

  constructor(content: string) {
    this.content = content;
    this.pos = 0;
  }

  public eof(): boolean {
    return this.pos >= this.content.length;
  }

  public peek(): string {
    return this.content[this.pos];
  }

  public forward(): void {
    this.pos++;
  }

  public skipWhitespace(): void {
    while (!this.eof() && " \t".includes(this.peek())) {
      this.forward();
    }
  }

  public peekNext(): string {
    return this.content[this.pos + 1] ?? "";
  }
}

export { Scanner };

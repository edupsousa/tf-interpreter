export type Position = {
  line: number;
  column: number;
  index: number;
};

export function createScanner(content: string) {
  let index = 0;
  let line = 1;
  let column = 1;

  const eof = () => index >= content.length;
  const peek = () => content[index];
  const forward = () => {
    if (eof()) return;
    if (peek() === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
    index++;
  };
  const skipWhitespace = () => {
    while (!eof() && " \t".includes(peek())) {
      forward();
    }
  };
  const peekNext = () => content[index + 1] ?? "";
  const peekNextNext = () => content[index + 2] ?? "";
  const getPosition = (): Position => ({ line, column, index });

  return {
    eof,
    peek,
    forward,
    skipWhitespace,
    peekNext,
    peekNextNext,
    getPosition,
  };
}

export type Scanner = ReturnType<typeof createScanner>;

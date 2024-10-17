import { Token } from "../lexer/token";

export class BaseSyntaxNode {}

export class Attribute extends BaseSyntaxNode {
  identifier: Identifier;
  expression: Expression;

  constructor(identifier: Identifier, expression: Expression) {
    super();
    this.identifier = identifier;
    this.expression = expression;
  }
}

export class Expression extends BaseSyntaxNode {
  children: Array<Token>;

  constructor(children: Array<Token>) {
    super();
    this.children = children;
  }
}

export class Block extends BaseSyntaxNode {
  identifier: Identifier;
  labels: Array<Identifier | StringLiteral>;
  body: Body;

  constructor(
    identifier: Identifier,
    labels: Array<Identifier | StringLiteral>,
    body: Body
  ) {
    super();
    this.identifier = identifier;
    this.labels = labels;
    this.body = body;
  }
}

export class StringLiteral extends BaseSyntaxNode {
  token: Token;

  constructor(token: Token) {
    super();
    this.token = token;
  }
}

export class Body extends BaseSyntaxNode {
  children: Array<Attribute | Block>;

  constructor(children: Array<Attribute | Block>) {
    super();
    this.children = children;
  }
}

export class ConfigFile extends BaseSyntaxNode {
  body: Body;

  constructor(body: Body) {
    super();
    this.body = body;
  }
}

export class Identifier extends BaseSyntaxNode {
  token: Token;

  constructor(token: Token) {
    super();
    this.token = token;
  }
}

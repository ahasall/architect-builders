import * as ts from 'typescript';

const scanner = ts.createScanner(ts.ScriptTarget.Latest, true);

const sourceCode = `const foo:number = 5`;

scanner.setText(sourceCode);
scanner.setLanguageVariant(ts.LanguageVariant.Standard);

const token = scanner.scan();

console.log(ts.SyntaxKind[token]);

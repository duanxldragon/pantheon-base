import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function resolveModulePath(fromPath, specifier) {
  const basePath = path.resolve(path.dirname(fromPath), specifier);
  if (fs.existsSync(basePath)) {
    return basePath;
  }
  if (path.extname(basePath) && fs.existsSync(`${basePath}.ts`)) {
    return `${basePath}.ts`;
  }
  if (path.extname(basePath)) {
    return basePath;
  }
  return `${basePath}.ts`;
}

function resolveObjectKey(nameNode, resolvedPath) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  throw new Error(`Unsupported object key in ${resolvedPath}`);
}

function evaluateExpression(node, scope, resolvedPath) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  if (ts.isIdentifier(node)) {
    if (Object.prototype.hasOwnProperty.call(scope, node.text)) {
      return scope[node.text];
    }
    throw new Error(`Unknown identifier "${node.text}" in ${resolvedPath}`);
  }
  if (ts.isParenthesizedExpression(node)) {
    return evaluateExpression(node.expression, scope, resolvedPath);
  }
  if (ts.isAsExpression(node)) {
    return evaluateExpression(node.expression, scope, resolvedPath);
  }
  if (ts.isSatisfiesExpression?.(node)) {
    return evaluateExpression(node.expression, scope, resolvedPath);
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => evaluateExpression(element, scope, resolvedPath));
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spreadValue = evaluateExpression(property.expression, scope, resolvedPath);
        if (!spreadValue || typeof spreadValue !== 'object' || Array.isArray(spreadValue)) {
          throw new Error(`Spread source must be object in ${resolvedPath}`);
        }
        Object.assign(out, spreadValue);
        continue;
      }
      if (ts.isPropertyAssignment(property)) {
        const key = resolveObjectKey(property.name, resolvedPath);
        out[key] = evaluateExpression(property.initializer, scope, resolvedPath);
        continue;
      }
      if (ts.isShorthandPropertyAssignment(property)) {
        const key = property.name.text;
        if (!Object.prototype.hasOwnProperty.call(scope, key)) {
          throw new Error(`Unknown shorthand property "${key}" in ${resolvedPath}`);
        }
        out[key] = scope[key];
        continue;
      }
      throw new Error(`Unsupported object property in ${resolvedPath}`);
    }
    return out;
  }
  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;
    for (const span of node.templateSpans) {
      text += String(evaluateExpression(span.expression, scope, resolvedPath));
      text += span.literal.text;
    }
    return text;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    return -Number(evaluateExpression(node.operand, scope, resolvedPath));
  }
  throw new Error(`Unsupported expression kind ${ts.SyntaxKind[node.kind]} in ${resolvedPath}`);
}

export function loadResourceModule(modulePath, cache = new Map()) {
  const resolvedPath = path.resolve(modulePath);
  if (cache.has(resolvedPath)) {
    return cache.get(resolvedPath);
  }

  const source = fs.readFileSync(resolvedPath, 'utf8');
  const sourceFile = ts.createSourceFile(resolvedPath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const scope = {};
  let defaultExportValue;

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.name &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const localName = statement.importClause.name.text;
      const nextPath = resolveModulePath(resolvedPath, statement.moduleSpecifier.text);
      scope[localName] = loadResourceModule(nextPath, cache);
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }
        scope[declaration.name.text] = evaluateExpression(declaration.initializer, scope, resolvedPath);
      }
      continue;
    }

    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      defaultExportValue = evaluateExpression(statement.expression, scope, resolvedPath);
    }
  }

  if (defaultExportValue === undefined) {
    throw new Error(`Unable to resolve default export from ${resolvedPath}`);
  }

  cache.set(resolvedPath, defaultExportValue);
  return defaultExportValue;
}

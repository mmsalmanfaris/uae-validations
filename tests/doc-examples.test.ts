import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as lib from '../src';

/**
 * Runs every `call(); // result` line inside a TSDoc ```ts example and in README.md,
 * so documented results always match the library.
 */

const root = join(import.meta.dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : [];
  });
}

interface Example {
  location: string;
  expression: string;
  expected: string;
}

function extract(file: string, stripComment: boolean): Example[] {
  const examples: Example[] = [];
  let inBlock = false;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((rawLine, index) => {
      const line = stripComment ? rawLine.replace(/^\s*\*\s?/, '') : rawLine;
      if (/^```(ts|typescript|js)\s*$/.test(line.trim())) inBlock = true;
      else if (line.trim() === '```') inBlock = false;
      else if (inBlock) {
        const match = /^(.+?);\s*\/\/\s*(.+)$/.exec(line.trim());
        if (match && !match[1]!.startsWith('import')) {
          examples.push({
            location: `${relative(root, file)}:${index + 1}`,
            expression: match[1]!,
            expected: match[2]!,
          });
        }
      }
    });
  return examples;
}

const examples = [
  ...walk(join(root, 'src')).flatMap((file) => extract(file, true)),
  ...extract(join(root, 'README.md'), false),
];

const names = Object.keys(lib);
const values = Object.values(lib);
const evaluate = (code: string): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...names, `return (${code});`) as (...args: unknown[]) => unknown;
  return fn(...values);
};

describe('documented examples', () => {
  it('found examples to check', () => {
    expect(examples.length).toBeGreaterThan(20);
  });

  it.each(examples.map((e) => [e.location, e] as const))('%s', (_location, example) => {
    expect(evaluate(example.expression)).toEqual(evaluate(example.expected));
  });
});

const EMPTY_TOKEN = '';

const WHITESPACE_REGEX = /\s/g;
const WHITESPACE_PLUS_ANY_CHARACTER_REGEX = /\s(.)/g;
const FIRST_CHARACTER_REGEX = /^(.)/;

export function camelize(str: string) {
  return str
    .replace(WHITESPACE_PLUS_ANY_CHARACTER_REGEX, (x) => x.toUpperCase())
    .replace(WHITESPACE_REGEX, EMPTY_TOKEN)
    .replace(FIRST_CHARACTER_REGEX, (x) => x.toLowerCase());
}

/**
 * Returns a new string where runs of the same character that occur in this set are replaced by a single character.
 *
 * If charSet is not given, all runs of identical characters are replaced by a single character.
 * @param str String to squeeze
 * @param charSet Set of characters to squeeze
 */
export function squeeze(str: string, charSet?: string): string {
  if (!charSet) {
    charSet = str;
  }
  const charSetArr = charSet.split('');
  let result = '';
  let prevChar = '';
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    if (charSetArr.includes(char)) {
      if (char !== prevChar) {
        result += char;
        prevChar = char;
      }
    } else {
      result += char;
      prevChar = '';
    }
  }
  return result;
}

/**
 * Checks if object is blank.
 *
 * Object is considered blank if it is:
 * - null
 * - undefined
 * - empty string
 * - empty array
 * - object with no properties
 * - iterable with no items
 *
 * @param obj Object to check
 * @returns True if object is blank, false otherwise
 */
export function isBlank(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }
  if (typeof obj === 'string') {
    return obj === '';
  }
  if (typeof obj[Symbol.iterator] === 'function') {
    return obj[Symbol.iterator]().next().done;
  }
  if (typeof obj === 'object') {
    if (obj instanceof Map || obj instanceof Set) {
      return obj.size === 0;
    }
    return Object.keys(obj).length === 0;
  }
  return false;
}

/**
 * Check if object is null or undefined.
 * @param obj Object to check
 * @returns True if object is null or undefined, false otherwise
 */
export function isNullish(obj: any): boolean {
  return obj === null || obj === undefined;
}

export const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('fi-FI', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

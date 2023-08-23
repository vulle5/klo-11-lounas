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
  const charSetArr = charSet.split("");
  let result = "";
  let prevChar = "";
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    if (charSetArr.includes(char)) {
      if (char !== prevChar) {
        result += char;
        prevChar = char;
      }
    } else {
      result += char;
      prevChar = "";
    }
  }
  return result;
}

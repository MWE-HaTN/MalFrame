/**
 * YARA language support for CodeMirror 6.
 * Provides syntax highlighting for YARA rule files.
 */
import { StreamLanguage, type StreamParser } from "@codemirror/language";

interface YaraState {
  inBlockComment: boolean;
  inMeta: boolean;
  inStrings: boolean;
  inCondition: boolean;
  inHex: boolean;
  inRegex: boolean;
}

const yaraParser: StreamParser<YaraState> = {
  startState: (): YaraState => ({
    inBlockComment: false,
    inMeta: false,
    inStrings: false,
    inCondition: false,
    inHex: false,
    inRegex: false,
  }),

  token(stream, state): string | null {
    // Block comment
    if (state.inBlockComment) {
      if (stream.match("*/")) {
        state.inBlockComment = false;
        return "lineComment";
      }
      stream.next();
      return "lineComment";
    }

    // Line comment
    if (stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    // Block comment start
    if (stream.match("/*")) {
      state.inBlockComment = true;
      return "lineComment";
    }

    // Hex string { ... }
    if (state.inStrings && stream.match(/^\{[0-9a-fA-F\s[\]|?()]+\}/)) {
      return "string.special";
    }

    // Regex / ... /
    if (state.inRegex) {
      if (stream.match("/[is]*")) {
        state.inRegex = false;
        return "regexp";
      }
      stream.next();
      return "regexp";
    }

    // String identifier $xxx
    if (stream.match(/\$[a-zA-Z0-9_]*/)) {
      return "variableName";
    }

    // Wildcard string identifiers $*
    if (stream.match(/\$\*/)) {
      return "variableName";
    }

    // @xxx (string offset)
    if (stream.match(/@[a-zA-Z0-9_]*/)) {
      return "variableName";
    }

    // !xxx (string count)
    if (stream.match(/![a-zA-Z0-9_]*/)) {
      return "variableName";
    }

    // #xxx (string count)
    if (stream.match(/#[a-zA-Z0-9_]*/)) {
      return "variableName";
    }

    // Numbers
    if (stream.match(/\b0x[0-9a-fA-F]+\b/) || stream.match(/\b\d+\b/)) {
      return "number";
    }

    // Double-quoted string
    if (stream.match(/"(?:[^"\\]|\\.)*"/)) {
      return "string";
    }

    // Check for section transitions
    if (stream.match(/\bmeta\s*:/)) {
      state.inMeta = true;
      state.inStrings = false;
      state.inCondition = false;
      return "keyword";
    }
    if (stream.match(/\bstrings\s*:/)) {
      state.inStrings = true;
      state.inMeta = false;
      state.inCondition = false;
      return "keyword";
    }
    if (stream.match(/\bcondition\s*:/)) {
      state.inCondition = true;
      state.inMeta = false;
      state.inStrings = false;
      return "keyword";
    }

    // Keywords
    if (stream.match(/\b(?:rule|private|global|import|include)\b/)) {
      return "keyword";
    }

    // Meta keys (identifier followed by =)
    if (state.inMeta && stream.match(/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*=)/)) {
      return "propertyName";
    }

    // Condition keywords
    if (state.inCondition) {
      const condKws = [
        "and", "or", "not", "for", "of", "at", "in", "any", "all", "none",
        "them", "true", "false", "filesize", "entrypoint",
        "int8", "int16", "int32", "uint8", "uint16", "uint32",
        "int8be", "int16be", "int32be", "uint8be", "uint16be", "uint32be",
      ];
      for (const kw of condKws) {
        if (stream.match(new RegExp(`\\b${kw}\\b`))) {
          return "keyword";
        }
      }
    }

    // String type markers in strings section
    if (state.inStrings) {
      if (stream.match(/\b(?:ascii|wide|nocase|fullword|private|xor|base64)\b/)) {
        return "modifier";
      }
      // Start of regex
      if (stream.peek() === "/") {
        stream.next();
        state.inRegex = true;
        return "regexp";
      }
    }

    // Curly braces
    if (stream.match(/[{}]/)) {
      return "bracket";
    }

    // Operators
    if (stream.match(/[<>!=]=?|[+\-*/%]|&&|\|\||\.+/)) {
      return "operator";
    }

    // Identifiers (rule names, etc.)
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) {
      return "name";
    }

    // Skip whitespace and other characters
    stream.next();
    return null;
  },
};

export function yara() {
  return StreamLanguage.define(yaraParser);
}

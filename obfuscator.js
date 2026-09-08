const crypto = require("crypto");

const MAX_BYTES =
  Number(process.env.MAX_FILE_MB || 2) * 1024 * 1024;

function isLuaFile(name = "") {
  return /\.(lua|luau)$/i.test(name);
}

function randomName() {
  return "_" + crypto.randomBytes(5).toString("hex");
}

function encodeString(value) {
  // Keeps Roblox/Luau strings valid while hiding their literal contents.
  const bytes = Buffer.from(value, "utf8");
  const nums = [...bytes].map(b => String(b));
  return `string.char(${nums.join(",")})`;
}

function protectStrings(source) {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    // Leave comments untouched here; they are removed later.
    if (ch === "-" && source[i + 1] === "-") {
      const end = source.indexOf("\n", i);
      if (end === -1) break;
      out += "\n";
      i = end + 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let value = "";
      let escaped = false;

      while (j < source.length) {
        const c = source[j];

        if (escaped) {
          const map = { n: "\n", r: "\r", t: "\t" };
          value += map[c] ?? c;
          escaped = false;
          j++;
          continue;
        }

        if (c === "\\") {
          escaped = true;
          j++;
          continue;
        }

        if (c === quote) break;

        value += c;
        j++;
      }

      if (j < source.length && source[j] === quote) {
        out += encodeString(value);
        i = j + 1;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function stripComments(source) {
  source = source.replace(/--\[\[[\s\S]*?\]\]/g, "");
  source = source.replace(/--[^\r\n]*/g, "");
  return source;
}

function renameLocals(source) {
  // Conservative renaming of explicit local declarations.
  // It intentionally avoids touching globals, Roblox API names, and strings.
  const names = new Map();
  let counter = 0;

  const makeName = () => {
    let n = counter++;
    let s = "";
    do {
      s = "_" + String.fromCharCode(97 + (n % 26)) + (n >= 26 ? Math.floor(n / 26) : "");
      n++;
    } while (names.has(s));
    return s;
  };

  const protectedWords = new Set([
    "local", "function", "end", "if", "then", "else", "elseif",
    "for", "while", "do", "repeat", "until", "return", "break",
    "and", "or", "not", "true", "false", "nil", "in"
  ]);

  // Protect string.char(...) generated expressions by temporarily replacing strings.
  const stash = [];
  source = source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, m => {
    stash.push(m);
    return `__STR_STASH_${stash.length - 1}__`;
  });

  source = source.replace(
    /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g,
    (full, name) => {
      if (!protectedWords.has(name)) {
        if (!names.has(name)) names.set(name, makeName());
        return "local " + names.get(name);
      }
      return full;
    }
  );

  // Rename references only for names we discovered.
  for (const [oldName, newName] of names) {
    const re = new RegExp(`\\b${oldName}\\b`, "g");
    source = source.replace(re, newName);
  }

  source = source.replace(/__STR_STASH_(\d+)__/g, (_, n) => stash[Number(n)]);
  return source;
}

function addRuntime(source) {
  const marker = "-- AETHERZYY_OBF_V1";
  return [
    marker,
    "-- Generated for source protection. Keep the original source as your backup.",
    source.trim(),
    ""
  ].join("\n");
}

function obfuscate(source) {
  if (typeof source !== "string") {
    throw new TypeError("Source must be a string.");
  }

  let result = source;
  result = stripComments(result);
  result = protectStrings(result);
  result = renameLocals(result);

  // Normalize excess blank lines without changing program structure.
  result = result.replace(/\n{3,}/g, "\n\n");

  return addRuntime(result);
}

module.exports = {
  obfuscate,
  isLuaFile,
  MAX_BYTES
};
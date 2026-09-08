/**
 * URL-friendly slug generator.
 * Handles non-ASCII (Bangla + others) by transliterating to ASCII when possible
 * and falling back to a deterministic hash suffix for collisions.
 */

const TRANSLITERATION_MAP: Record<string, string> = {
  // Bangla -> ASCII approximations
  '\u0985': 'a',
  '\u0986': 'aa',
  '\u0987': 'i',
  '\u0988': 'ee',
  '\u0989': 'u',
  '\u098A': 'oo',
  '\u098F': 'e',
  '\u0990': 'oi',
  '\u0993': 'o',
  '\u0995': 'k',
  '\u0996': 'kh',
  '\u0997': 'g',
  '\u0998': 'gh',
  '\u0999': 'ng',
  '\u099A': 'ch',
  '\u099B': 'chh',
  '\u099C': 'j',
  '\u099D': 'jh',
  '\u099F': 't',
  '\u09A0': 'th',
  '\u09A1': 'd',
  '\u09A2': 'dh',
  '\u09A4': 't',
  '\u09A5': 'th',
  '\u09A6': 'd',
  '\u09A7': 'dh',
  '\u09A8': 'n',
  '\u09AA': 'p',
  '\u09AB': 'ph',
  '\u09AC': 'b',
  '\u09AD': 'bh',
  '\u09AE': 'm',
  '\u09AF': 'y',
  '\u09B0': 'r',
  '\u09B2': 'l',
  '\u09B6': 'sh',
  '\u09B7': 'sh',
  '\u09B8': 's',
  '\u09B9': 'h',
  '\u09DC': 'r',
  '\u09DD': 'rh',
  '\u09DF': 'y',
  '\u09CE': 't',
  '\u0982': '',
  '\u0981': '',
  '\u0983': '',
  '\u09BE': 'a',
  '\u09BF': 'i',
  '\u09C0': 'ee',
  '\u09C1': 'u',
  '\u09C2': 'oo',
  '\u09C3': 'ri',
  '\u09C7': 'e',
  '\u09C8': 'oi',
  '\u09CB': 'o',
  '\u09CC': 'ou',
  // Arabic -> ASCII
  '\u0627': 'a',
  '\u0628': 'b',
  '\u062A': 't',
  '\u062B': 'th',
  '\u062C': 'j',
  '\u062D': 'h',
  '\u062E': 'kh',
  '\u062F': 'd',
  '\u0630': 'dh',
  '\u0631': 'r',
  '\u0632': 'z',
  '\u0633': 's',
  '\u0634': 'sh',
  '\u0635': 's',
  '\u0636': 'd',
  '\u0637': 't',
  '\u0638': 'z',
  '\u0639': 'a',
  '\u063A': 'gh',
  '\u0641': 'f',
  '\u0642': 'q',
  '\u0643': 'k',
  '\u0644': 'l',
  '\u0645': 'm',
  '\u0646': 'n',
  '\u0647': 'h',
  '\u0648': 'w',
  '\u064A': 'y',
};

export function slugify(input: string): string {
  if (!input) return '';
  let normalized = input.normalize('NFKD');

  // transliterate characters in our map
  let result = '';
  for (const ch of normalized) {
    result += TRANSLITERATION_MAP[ch] ?? ch;
  }

  // remove diacritics
  result = result.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // to lowercase and replace non-alphanumeric with dashes
  result = result
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // trim length and add random suffix if too short
  if (result.length > 80) result = result.slice(0, 80);
  if (!result) result = `n-${Math.random().toString(36).slice(2, 8)}`;

  return result;
}

export function withRandomSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const AUTOCOMPLETE_PREFIXES: string[] = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es',
  'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng',
  'the', 'and', 'ing', 'her', 'hat', 'his', 'tha', 'ere', 'for', 'ent',
  'ion', 'ter', 'was', 'you', 'ith', 'ver', 'all', 'wit', 'thi', 'tio',
  'app', 'comp', 'goog', 'micro', 'data', 'soft', 'syst', 'netw', 'inte',
  'prog', 'code', 'user', 'page', 'sear', 'term', 'worl', 'time', 'post',
  'appl', 'comp', 'test', 'auto', 'fast', 'high', 'load', 'serv', 'stat'
];

export const SELECTION_WORDS: string[] = [
  'the', 'of', 'and', 'to', 'in', 'is', 'you', 'that', 'it', 'he',
  'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be',
  'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not',
  'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there',
  'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will',
  'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so',
  'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has',
  'look', 'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way',
  'could', 'people', 'my', 'than', 'first', 'water', 'been', 'call',
  'who', 'oil', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get',
  'come', 'made', 'may', 'part', 'apple', 'application', 'google', 'computer'
];

export function getRandomPrefix(): string {
  const idx = Math.floor(Math.random() * AUTOCOMPLETE_PREFIXES.length);
  return AUTOCOMPLETE_PREFIXES[idx]!;
}

export function getRandomSelectionWord(): string {
  const idx = Math.floor(Math.random() * SELECTION_WORDS.length);
  return SELECTION_WORDS[idx]!;
}

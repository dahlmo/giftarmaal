const adjectives = [
  "stilig",
  "keeg",
  "klein",
  "morsom",
  "fnisete",
  "frekk",
  "drita",
  "sinna",
  "kosete",
  "fjong",
  "masete",
  "kosete",
  "klengete",
  "sjarmerende",
  "manipulerende",
  "dyster",
  "slem",
  "kaotisk",
  "vrang",
];

const nouns = [
  "hatt",
  "spade",
  "unge",
  "taske",
  "frakk",
  "vinge",
  "seil",
  "paraply",
  "pute",
  "smultring",
  "saks",
  "gris",
  "katt",
  "fugl",
  "fisk",
  "kamel",
  "slange",
];

export function generateInviteCode(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9) + 1; // 1–9

  return `${adj}${noun}${number}`;
}

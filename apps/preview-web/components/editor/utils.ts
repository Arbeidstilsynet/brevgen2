function getRandomDateString(): string {
  const start = new Date(2000, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getRandomWord(): string {
  const words = ["lorem", "ipsum", "dolor", "sit", "amet"];
  return words[Math.floor(Math.random() * words.length)];
}

function getRandomNumberString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function getRandomBooleanString(): string {
  return Math.random() < 0.5 ? "true" : "false";
}

export function getRandomValue(variableName: string): string {
  const lowerVar = variableName.toLowerCase();
  if (lowerVar.includes("dato") || lowerVar.includes("date")) {
    return getRandomDateString();
  } else if (lowerVar.includes("organisasjonsnummer") || lowerVar.includes("orgnr")) {
    return getRandomNumberString(9);
  } else if (lowerVar.includes("nummer") || lowerVar.includes("number")) {
    return getRandomNumberString(Math.floor(Math.random() * 5) + 1);
  } else if (
    lowerVar.startsWith("er") ||
    lowerVar.startsWith("is") ||
    lowerVar.startsWith("har") ||
    lowerVar.startsWith("has")
  ) {
    return getRandomBooleanString();
  } else {
    return getRandomWord();
  }
}

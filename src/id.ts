// @note based on incstr code

export interface IOptions {
  alphabet: string;
  lastId?: string;
}

export default function ({ alphabet, lastId = "" }: IOptions) {
  let digitsArray;

  const maxDigit = alphabet.length - 1;

  function nextId() {
    for (var i = 0; i < digitsArray.length; i += 1) {
      // @note if having max digit advance wrap to 0 and continue to next digit
      if (digitsArray[i] === maxDigit) {
        digitsArray[i] = 0;
        continue;
      }

      // @note next digit is present, advance it and exit
      digitsArray[i]++;

      break;
    }

    // @note if we ran out of digit places while advancing, add new digit e.g. 999 -> 0000
    if (i === digitsArray.length) {
      // @note push is about 5x faster than unshift
      digitsArray.push(0);
    }

    return nextId.lastId;
  }

  Object.defineProperty(nextId, "lastId", {
    get() {
      return digitsArray.map(digit => alphabet[digit]).join("");
    },

    set(idString) {
      digitsArray = [...idString].map(char => {
        const digit = alphabet.indexOf(char);

        if (digit === -1) {
          throw new RangeError(
            `Character '${char}' is not in the alphabet "${alphabet}"`
          );
        }

        return digit;
      });
    },
  });

  nextId.lastId = lastId;

  return nextId;
}

import incstr from "incstr";
import path from "path/posix";

const nameGeneratorContext = () => {
  let namesMap = {};

  //move dash to the end to optimize name generation
  let generateName = incstr.idGenerator({
    alphabet: "_abcdefghijklmnopqrstuvwxyz0123456789-",
  });

  //the function is called for each CSS rule, so cache the pairs of minified name with og name
  return (name: string, filename: string, css: string): string => {
    //split path by /src/
    //let pathParts = filepath.split(/[\/\\]src[\/\\]|/g);

    //get shorter filename e.g. "views/Home.vue" or full file path in case of custom project structure
    //let filename = pathParts.length == 2 ? pathParts[1] : pathParts[0];

    //remove query params and append rule name using : (forbidden for paths)
    let key = filename.split("?", 2)[0] + ":" + name;

    if (namesMap[key]) return namesMap[key];

    let newName = generateName();

    //hypen prefixes are reserved for vendor classes, also it can't start with a digit
    //in addition exclude ^ad or any _ad, -ad constructions to avoid adblock problem
    while (/^[-\d]|(?:[-_]+|^)ad/.test(newName)) {
      newName = generateName();
    }

    namesMap[key] = newName;

    return newName;
  };
};

const devNameGenerator = (
  name: string,
  filename: string,
  css: string
): string => {
  return path.basename(filename).split(".")[0] + "__" + name;
};

export { nameGeneratorContext, devNameGenerator };

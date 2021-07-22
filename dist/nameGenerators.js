import incstr from "incstr";
import path from "path";
const prodNameGeneratorContext = () => {
    let namesMap = {};
    let generateName = incstr.idGenerator({
        alphabet: "_abcdefghijklmnopqrstuvwxyz0123456789-",
    });
    return (name, filename, css) => {
        let key = filename.split("?", 2)[0] + ":" + name;
        if (namesMap[key])
            return namesMap[key];
        let newName = generateName();
        while (/^[-\d]|(?:[-_]+|^)ad/.test(newName)) {
            newName = generateName();
        }
        namesMap[key] = newName;
        return newName;
    };
};
const devNameGeneratorContext = () => {
    return (name, filename, css) => {
        return path.basename(filename).split(".")[0] + "__" + name;
    };
};
export { prodNameGeneratorContext, devNameGeneratorContext };

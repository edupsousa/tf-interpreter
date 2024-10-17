import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Scanner } from "./lexer/scanner";
import { Parser } from "./parser/parser";
import { inspect } from "node:util";

async function processFile(filePath: string) {
  console.log(`Processing file "${filePath}"`);
  const data = await fs.readFile(filePath, "utf-8");
  const tokens = Scanner.scanSource(data);
  const syntaxTree = Parser.parseConfigFile(tokens);
  console.log(inspect(syntaxTree, { depth: null, colors: true }));
}

async function processDirectory(directoryPath: string) {
  console.log(`Processing directory "${directoryPath}"`);
  await fs
    .readdir(directoryPath)
    .then((files) => files.filter((file) => file.endsWith(".tf")))
    .then((files) => files.map((file) => join(directoryPath, file)))
    .then((files) =>
      files.reduce((promise, file) => {
        return promise.then(() => processFile(file));
      }, Promise.resolve())
    );
}

async function main() {
  if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv.join(" ")} <file|directory>`);
    process.exit(1);
  }
  const inputPath = process.argv[2];
  const stats = await fs.stat(inputPath);
  if (stats.isDirectory()) {
    await processDirectory(inputPath);
  } else if (stats.isFile()) {
    await processFile(inputPath);
  } else {
    console.error(`"${inputPath}" is neither a file nor a directory`);
    process.exit(1);
  }
}

await main();

import { promises as fs } from "fs";
import { join } from "path";
import { tokenize } from "./tokenizer";

async function run(path: string) {
  const stats = await fs.stat(path);
  const files: string[] = [];

  if (stats.isDirectory()) {
    files.push(...(await fs.readdir(path)).map((file) => join(path, file)));
  } else if (stats.isFile()) {
    files.push(path);
  }

  const tfFiles = files.filter((file) => file.endsWith(".tf"));
  const content = await Promise.all(
    tfFiles.map((file) => fs.readFile(file, "utf-8"))
  );
  const tokenized = content.map(tokenize);
  for (let i = 0; i < tfFiles.length; i++) {
    console.log(tfFiles[i]);
    console.log(tokenized[i]);
    //console.log(tokenized[i].filter((token) => token.type === "unknown"));
  }
}

const path = process.argv[2];
run(path);

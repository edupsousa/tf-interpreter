import { promises as fs } from "fs";
import { join } from "path";
import { tokenize } from "./tokenizer";

async function run(path: string) {
  const files = await fs.readdir(path);
  const tfFiles = files.filter((file) => file.endsWith(".tf"));
  const content = await Promise.all(
    tfFiles.map((file) => fs.readFile(join(path, file), "utf-8"))
  );
  const tokenized = content.map(tokenize);
  for (let i = 0; i < tfFiles.length; i++) {
    console.log(tfFiles[i]);
    console.log(tokenized[i]);
    //console.log(tokenized[i].filter((token) => token.type === "unknown"));
  }
}

run(join(import.meta.dirname, "..", "sample")).catch(console.error);

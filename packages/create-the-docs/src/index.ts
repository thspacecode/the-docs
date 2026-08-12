#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const targetArgument = process.argv[2]

if (targetArgument === "--help" || targetArgument === "-h") {
  console.log("Usage: pnpm create the-docs [directory]")
  process.exit(0)
}

const target = resolve(process.cwd(), targetArgument ?? "the-docs-site")

await mkdir(target, { recursive: true })
if ((await readdir(target)).length > 0) {
  console.error(`Cannot create a project in non-empty directory: ${target}`)
  process.exit(1)
}

await cp(join(packageRoot, "template"), target, { recursive: true })
await rename(join(target, "gitignore"), join(target, ".gitignore"))

const packageFile = join(target, "package.json")
const packageJson = JSON.parse(await readFile(packageFile, "utf8")) as {
  name: string
}
packageJson.name = basename(target)
await writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)

console.log(`Created The Docs project in ${target}`)
console.log("")
console.log("Next steps:")
console.log(`  cd ${targetArgument ?? "the-docs-site"}`)
console.log("  pnpm install")
console.log("  pnpm dev")

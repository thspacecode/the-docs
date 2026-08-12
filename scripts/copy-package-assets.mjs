import { cp, mkdir, readdir } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"

const packageRoot = resolve(process.cwd())
const sourceRoot = resolve(packageRoot, "src")
const outputRoot = resolve(packageRoot, "dist")

async function copyDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      await copyDeclarations(source)
    } else if (entry.name.endsWith(".d.ts")) {
      const output = resolve(outputRoot, relative(sourceRoot, source))
      await mkdir(dirname(output), { recursive: true })
      await cp(source, output)
    }
  }
}

await copyDeclarations(sourceRoot)

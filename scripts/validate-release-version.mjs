import { readFile, readdir } from "node:fs/promises"

const packageDirectories = await readdir(new URL("../packages/", import.meta.url))
const manifests = await Promise.all(
  packageDirectories.map(async (directory) => {
    const file = new URL(`../packages/${directory}/package.json`, import.meta.url)
    return JSON.parse(await readFile(file, "utf8"))
  })
)

const versions = new Set(manifests.map(({ version }) => version))
if (versions.size !== 1) {
  throw new Error(`Publishable packages must share one version: ${[...versions].join(", ")}`)
}

const [version] = versions
const tag = process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined
if (tag && tag !== `v${version}`) {
  throw new Error(`Tag ${tag} does not match package version v${version}`)
}

console.log(`Validated ${manifests.length} packages at version ${version}`)

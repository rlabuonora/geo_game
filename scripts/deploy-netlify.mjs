import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const localNetlifyBin = path.resolve(projectRoot, "node_modules/.bin/netlify");
const wantsProdDeploy =
  process.argv.includes("--prod") || process.env.NETLIFY_DEPLOY === "1";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printInstructions(hasCli) {
  console.log("");
  console.log("Netlify deployment steps:");
  console.log("1. Run `npx netlify link` to connect an existing site.");
  console.log("2. Or run `npx netlify init` to create and link a new site.");
  console.log("3. Then run `npm run deploy:netlify -- --prod` to deploy to production.");

  if (!hasCli) {
    console.log("Netlify CLI is not installed. Install it with `npm install -D netlify-cli`.");
  } else if (!wantsProdDeploy) {
    console.log("Skipping `netlify deploy --prod` by default.");
    console.log("Pass `--prod` (or set `NETLIFY_DEPLOY=1`) to run the production deploy automatically.");
  }
}

run("npm", ["run", "build"]);

const hasCli = existsSync(localNetlifyBin);
printInstructions(hasCli);

if (hasCli && wantsProdDeploy) {
  run(localNetlifyBin, ["deploy", "--prod"]);
}

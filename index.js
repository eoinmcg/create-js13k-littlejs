#!/usr/bin/env node

import degit from "degit";
import chalk from "chalk";
import cfonts from "cfonts";
import inquirer from "inquirer";
import fs from "fs-extra";
import path, { join } from "path";
import child_process from "child_process";
import { readFileSync } from "fs";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));

function showBanner() {
  const width = process.stdout.columns || 80;
  const minWidth = 80;

  const fontSize = width < minWidth ? "tiny" : "block";

  cfonts.say("   js13k \nLittleJS", {
    font: fontSize,
    colors: ["yellow", "red", "blue"],
  });
  console.log(chalk.gray(pkg.version));
  console.log();
  console.log(
    chalk.yellow(
      "Batteries included starter template for JS13k jam using the LittleJS game engine.",
    ),
  );
  console.log(chalk.gray('-----------------------------------------------------------------------'));
  console.log();
}

async function main() {
  let tempTemplatePath;
  try {
    showBanner();

    const { projectName, template, includeAI, runInstall } =
      await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Project name:",
          default: "my-game",
          validate: (input) =>
            /^[a-zA-Z0-9\s\-_]+$/.test(input) || "Invalid name",
        },
        {
          type: "list",
          name: "template",
          message: "Select your workflow:",
          choices: [
            { name: "Vanilla (Global Scope)", value: "vanilla" },
            { name: "Modular (ES Modules)", value: "modular" },
            { name: "TypeScript (Typed Global)", value: "typescript" },
          ],
        },
        {
          type: "confirm",
          name: "includeAI",
          message: "Include AGENTS.md for AI coding assistants?",
          default: true,
        },
        {
          type: "confirm",
          name: "runInstall",
          message: "Install dependencies and finalize?",
          default: true,
        },
      ]);

    const targetDir = path.join(process.cwd(), projectName);
    const packageName = projectName.toLowerCase().replace(/\s+/g, "-");

    if (fs.existsSync(targetDir)) {
      console.error(chalk.red(`❌ Directory ${projectName} already exists`));
      process.exit(1);
    }

    console.log(chalk.blue("\n📂 Downloading core assets..."));
    tempTemplatePath = path.join(process.cwd(), ".temp-template-clone");
    const emitter = degit("eoinmcg/js13k-littlejs-starter#dev", {
      cache: false,
      force: true,
    });
    await emitter.clone(tempTemplatePath);

    // EXTRACT & CLEANUP
    console.log(chalk.blue(`🏗️ Building ${template} environment...`));
    const templateSubPath = path.join(tempTemplatePath, "templates", template);

    fs.copySync(tempTemplatePath, targetDir, {
      filter: (src) => !src.includes(path.join(tempTemplatePath, "templates")),
    });

    if (fs.existsSync(templateSubPath)) {
      fs.copySync(templateSubPath, targetDir, { overwrite: true });
    }

    // Handle AGENTS.md and AI context
    const agentsDest = path.join(targetDir, "AGENTS.md");
    const contextDest = path.join(targetDir, "context");

    if (includeAI) {
      if (fs.existsSync(agentsDest)) {
        console.log(chalk.blue("🤖 AGENTS.md AI context helper included."));
      } else {
        console.log(chalk.yellow("⚠️ Note: AGENTS.md was not found in the source template repo."));
      }
    } else {
      console.log(chalk.gray("🧹 Removing AI context files..."));
      if (fs.existsSync(agentsDest)) fs.removeSync(agentsDest);
      if (fs.existsSync(contextDest)) fs.removeSync(contextDest);
    }

    // FIX PATHS IN INDEX.HTML
    const indexPath = path.join(targetDir, "index.html");
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, "utf8");
      indexContent = indexContent.replace(
        /\.\.\/\.\.\/littlejs\//g,
        "./littlejs/",
      );
      fs.writeFileSync(indexPath, indexContent);
    }

    // FIX TILE PATHS IN ./src/data.json
    const dataPath = path.join(targetDir, "src/data.json");
    if (fs.existsSync(dataPath)) {
      const dataContent = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      if (Array.isArray(dataContent.tiles)) {
        dataContent.tiles = dataContent.tiles.map((tile) => tile.replace(/^\//, ""));
      }
      fs.writeJsonSync(dataPath, dataContent, { spaces: 2 });
    }

    // UPDATE PACKAGE.JSON
    const pkg = fs.readJsonSync(path.join(targetDir, "package.json"));
    pkg.name = packageName;
    pkg.littlejsMode = template;
    delete pkg.scripts.sync;

    if (template === "typescript") {
      pkg.scripts.build = "tsc && vite build";
      pkg.scripts.zip = "tsc && vite build && node scripts/build.js";
      pkg.devDependencies.typescript = "^5.0.0";
      pkg.devDependencies["@types/node"] = "^20.0.0";

      // Repair TSConfig
      const tsConfigPath = path.join(targetDir, "tsconfig.json");
      if (fs.existsSync(tsConfigPath)) {
        let tsConfig = fs.readJsonSync(tsConfigPath);
        const fix = (p) => p.replace("../../", "./");
        if (tsConfig.compilerOptions?.paths) {
          Object.keys(tsConfig.compilerOptions.paths).forEach((k) => {
            tsConfig.compilerOptions.paths[k] =
              tsConfig.compilerOptions.paths[k].map(fix);
          });
        }
        if (tsConfig.include) tsConfig.include = tsConfig.include.map(fix);
        fs.writeJsonSync(tsConfigPath, tsConfig, { spaces: 2 });
      }
    }

    fs.writeJsonSync(path.join(targetDir, "package.json"), pkg, { spaces: 2 });

    if (!includeAI) fs.removeSync(path.join(targetDir, "context"));
    fs.removeSync(tempTemplatePath);

    if (runInstall) {
      console.log(chalk.yellow("📦 Installing dependencies..."));
      child_process.execSync("npm install", {
        cwd: targetDir,
        stdio: "inherit",
      });
    }

    console.log(
      chalk.green(`\n✨ Success! Created ${projectName} at ${targetDir}`),
    );

    console.log(`  ${chalk.white("Step 1:")} cd ${projectName}`);

    if (!runInstall) {
      console.log(`  ${chalk.white("Step 2:")} npm install`);
      console.log(`  ${chalk.white("Step 3:")} npm run dev`);
    } else {
      console.log(`  ${chalk.white("Step 2:")} npm run dev`);
    }
    console.log(`  ${chalk.bgMagenta("Now go make something awesome!")}`);

    process.exit(0);
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error.message);
    if (tempTemplatePath && fs.existsSync(tempTemplatePath))
      fs.removeSync(tempTemplatePath);
    process.exit(1);
  }
}

main();

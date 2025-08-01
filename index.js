#!/usr/bin/env node

import degit from 'degit';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import child_process from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES = ['template'];

async function main() {
  let tempTemplatePath; // Declare variable to hold the temporary path
  try {
    console.log("");
    console.log("🛠️  Create LittleJS js13k game");
    console.log("");

    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-game',
        validate: (input) => {
          if (!input.trim()) {
            return 'Project name cannot be empty';
          }
          if (!/^[a-zA-Z0-9\s\-_]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, spaces, hyphens, and underscores';
          }
          return true;
        }
      },
    ]);

    const targetDir = path.join(process.cwd(), projectName);
    
    const packageName = projectName.toLowerCase().replace(/\s+/g, '-');

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Directory ${projectName} already exists`);
      process.exit(1);
    }

    console.log("📂 Creating project directory...");
    
    // Define a temporary path to clone the template into
    tempTemplatePath = path.join(process.cwd(), '.temp-template-clone');

    const emitter = degit('eoinmcg/js13k-littlejs-starter', {
      cache: false,
      force: true,
      verbose: true,
    });

    // Clone the repo into our temporary, known path
    await emitter.clone(tempTemplatePath);

    // Now, copy from the temporary path to the final project directory
    fs.copySync(tempTemplatePath, targetDir);

    // Clean up the temporary directory
    fs.removeSync(tempTemplatePath);

    // Update README.md (removes the Quickstart section)
    const readmePath = path.join(targetDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      console.warn("⚠️  No README.md found in template, skipping README.md updates");
    } else {
      console.log("📝 Updating README.md...");
      let readme = fs.readFileSync(readmePath, 'utf8');
      readme = readme.replace(
        /\*\s\*\s\*\n+## \*\*Quick Start\*\*[\s\S]*?\n\*\s\*\s\*/g,
        ''
      );
      fs.writeFileSync(readmePath, readme);
    }

    // Update package.json
    const packageJsonPath = path.join(targetDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.warn("⚠️  No package.json found in template, skipping package.json updates");
    } else {
      console.log("📝 Updating package.json...");
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = packageName;

      if (process.platform === 'win32') {
        console.log("🪟 Adding Windows-specific dependencies...");
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['ect-bin'] = '^1.4.1';
      }

      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Update src/data.js title
    const dataJsPath = path.join(targetDir, 'src', 'data.js');
    if (fs.existsSync(dataJsPath)) {
      console.log("🎮 Updating game title...");
      let dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
      dataJsContent = dataJsContent.replace(/(title\s*[:=]\s*['"`]).*?(['"`])/g, `$1${projectName}$2`);
      fs.writeFileSync(dataJsPath, dataJsContent);
    }

    console.log("");
    console.log("--------------------------------");
    console.log(`✅ Project created at ${targetDir}`);
    console.log("--------------------------------");
    console.log("");
    console.log("📦 Installing dependencies...");
    
    process.chdir(targetDir);
    child_process.execSync('npm install', { stdio: 'inherit' });
    
    console.log("");
    console.log("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log("  npm run dev      # Start development server");
    console.log("  npm run build    # Build for production");
    console.log("  npm run zip      # Create a zip");
    console.log("");
    console.log("More instructions in README.md");
    console.log("");
    console.log(chalk.green.bold(`Now go make something awesome!`));
    console.log("");
    
  } catch (error) {
    console.error("❌ An error occurred:");
    console.error(error.message);
    // Ensure cleanup even on error
    if (tempTemplatePath && fs.existsSync(tempTemplatePath)) {
      fs.removeSync(tempTemplatePath);
    }
    process.exit(1);
  }
}

main();

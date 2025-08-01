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
          // Check for invalid characters that could cause filesystem issues
          if (!/^[a-zA-Z0-9\s\-_]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, spaces, hyphens, and underscores';
          }
          return true;
        }
      },
      // {
      //   type: 'list',
      //   name: 'template',
      //   message: 'Choose a template:',
      //   choices: TEMPLATES,
      // },
    ]);

    const targetDir = path.join(process.cwd(), projectName);
    
    // Normalize project name for package.json (lowercase, replace spaces with hyphens)
    const packageName = projectName.toLowerCase().replace(/\s+/g, '-');

    if (fs.existsSync(targetDir)) {
      console.error(`❌ Directory ${projectName} already exists`);
      process.exit(1);
    }

    // Resolve template path relative to script location
    const templatePath = path.join(__dirname, 'template');

    // if (!fs.existsSync(templatePath)) {
    //   console.error(`❌ Template directory not found: ${templatePath}`);
    //   process.exit(1);
    // }

    console.log("📂 Creating project directory...");

    const emitter = degit('eoinmcg/js13k-littlejs-starter', {
      cache: false,
      force: true,
      verbose: true,
    });

    await emitter.clone('template'); // downloads into ./template

     // Copy template files
     fs.copySync(templatePath, targetDir);
    // remove old template directory
    fs.removeSync(templatePath);

    // Update README.md (removes the Quickstart section)
    const readmePath = path.join(targetDir, 'README.md');

    if (!fs.existsSync(readmePath)) {
      console.warn("⚠️  No  README..md found in template, skipping  REAADME.md updates");
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

      // Add Windows-specific dependency
      if (process.platform === 'win32') {
        console.log("🪟 Adding Windows-specific dependencies...");
        // Ensure devDependencies exists
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        // Add the new dependency to existing devDependencies
        packageJson.devDependencies['ect-bin'] = '^1.4.1';
      }

      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Update src/data.js title
    const dataJsPath = path.join(targetDir, 'src', 'data.js');
    if (fs.existsSync(dataJsPath)) {
      console.log("🎮 Updating game title...");
      let dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
      // This assumes there's a title field to replace - adjust the regex based on your actual file structure
      dataJsContent = dataJsContent.replace(/(title\s*[:=]\s*['"`]).*?(['"`])/g, `$1${projectName}$2`);
      fs.writeFileSync(dataJsPath, dataJsContent);
    }

    console.log("");
    console.log("--------------------------------");
    console.log(`✅ Project created at ${targetDir}`);
    console.log("--------------------------------");
    console.log("");
    console.log("📦 Installing dependencies...");
    
    // Change to target directory and install dependencies
    process.chdir(targetDir);
    child_process.execSync('npm install', { stdio: 'inherit' });
    
    console.log("");
    console.log("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log("  npm run dev     # Start development server");
    console.log("  npm run build   # Build for production");
    console.log("  npm run zip     # Create a zip");
    console.log("");
    console.log("More instructions in README.md");
    console.log("");
    console.log(chalk.green.bold(`Now go make something awesome!`)); // Fixed typo: removed extra backslash
    console.log("");
    
  } catch (error) {
    console.error("❌ An error occurred:");
    console.error(error.message);
    process.exit(1);
  }
}

main();

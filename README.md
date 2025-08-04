create-js13k-littlejs
====================

A CLI tool for quickly scaffolding a new [LittleJS](https://github.com/KilledByAPixel/LittleJS)
game project for the [js13kGames](https://js13kgames.com/) competition.

This package clones a starter template, configures it with your
project name, and installs all the necessary dependencies to get
you up and running in quick smart.

⚡️ Features
--------

* 🛠️ **Quick Setup:** A single command creates a new project with
all the necessary files and dependencies and dev server.

* 🖼️ **Built-in animated gif generation**: For showcasing your game.

* 🏆 **Configured for js13k:** The starter template is optimized
for the js13kGames competition, including build scripts to
zip your game for submission.

* ✍️ **Project Renaming:** Automatically updates the `package.json`
file and game title to match your project name.

* 💻 **Platform-Specific Dependencies:** Handles platform-specific dependencies,
such as adding `ect-bin` for Windows users to ensure zipping works correctly.

🏁 Quick Start
-----------

To create a new game, simply run the following command and follow the prompts:

Bash

    npm create js13k-littlejs

This will guide you through naming your project and will set up a new directory
with a pre-configured LittleJS game.

⌨️ Available Commands
------------------

Once your project is created and dependencies are installed, navigate to your
new project directory and use these commands:

* In game: [alt] + [g] to create an animated gif of your game.

* `npm run dev`: Starts the development server with live-reloading. This
streamlines development allowing you to focus on building an awesome game.

* `npm run build`: Builds the project for production, creating an optimized
and minified version of your game.

* `npm run zip`: Runs the build command and then creates a zip archive of your
final, compressed game, ready for submission to js13kGames.

* `npm run deploy`: Publishes to github pages, allowing you to share your game.
Note: You must host your project on github for this. Further details can be found
found in your poject's `README.md`.

Contributing
------------

If you find a bug or have a suggestion, please open an issue or submit a pull
request on the [GitHub repository](https://github.com/eoinmcg/create-js13k-littlejs).

License
-------

This project is licensed under the MIT License.

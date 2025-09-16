# Amigo Prefix

A VS Code extension that helps you add prefixes to identifiers throughout your project.

## Features

This extension makes it easy to add prefixes to multiple function names, variable names, class names, or any other identifiers across your entire workspace. This is particularly helpful for:

- Adding namespace prefixes to functions (e.g., adding "app_" to all your custom functions)
- Standardizing naming conventions in a project
- Avoiding naming conflicts when integrating with other libraries
- Quickly renaming multiple related identifiers at once

The extension provides a simple interface to:
1. Enter a list of words (identifiers) that need prefixing
2. Specify the prefix you want to add
3. Automatically find and replace all instances of those words with the prefixed version

## How to Use

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the command palette
2. Type "Amigo Renamer" and select the command
3. In the panel that appears:
   - Enter the words to be prefixed (one per line)
   - Enter the prefix you want to add
   - Click "Add Prefix"
4. The extension will process all files in your workspace and apply the prefix

The extension is smart enough to only replace whole words, avoiding partial matches within other words.

## Requirements

No additional requirements or dependencies needed. Just install and use!

## Known Issues

- Binary files and certain types of non-text files are automatically skipped to avoid corruption
- Very large workspaces with many files may take some time to process

## Release Notes

### 0.0.1

- Initial release of Amigo Prefix
- Basic functionality to add prefixes to identifiers across a workspace

---

**Enjoy!**

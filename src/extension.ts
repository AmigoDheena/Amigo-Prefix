import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "prefix-renamer" is now active');

    let disposable = vscode.commands.registerCommand('prefix-renamer.rename', async () => {
        // Create and show a webview panel for user input
        const panel = vscode.window.createWebviewPanel(
            'prefixRenamer',
            'Prefix Renamer',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        // Set webview HTML content
        panel.webview.html = getWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'rename':
                        await performRename(message.wordsList, message.prefix);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prefix Renamer</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            textarea, input {
                width: 100%;
                padding: 8px;
                box-sizing: border-box;
            }
            textarea {
                height: 150px;
            }
            button {
                background: #007acc;
                color: white;
                border: none;
                padding: 8px 15px;
                cursor: pointer;
                border-radius: 4px;
            }
            button:hover {
                background: #005999;
            }
            .help-text {
                font-size: 0.85em;
                color: #666;
                margin-top: 4px;
            }
            #progress {
                margin-top: 20px;
                display: none;
            }
        </style>
    </head>
    <body>
        <h1>Prefix Renamer</h1>
        <div class="form-group">
            <label for="wordsList">Words to add prefix (one per line):</label>
            <textarea id="wordsList" placeholder="Enter words to add prefix, one per line"></textarea>
            <p class="help-text">These are the words (functions, classes, variables) you want to add the prefix to.</p>
        </div>
        <div class="form-group">
            <label for="prefix">Prefix:</label>
            <input type="text" id="prefix" placeholder="Enter your prefix">
        </div>
        <button id="renameBtn">Add Prefix</button>
        <div id="progress">Processing... please wait.</div>

        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('renameBtn').addEventListener('click', () => {
                const wordsList = document.getElementById('wordsList').value.trim().split('\\n').filter(word => word.trim() !== '');
                const prefix = document.getElementById('prefix').value.trim();
                
                if (wordsList.length === 0 || prefix === '') {
                    alert('Please enter both words and a prefix');
                    return;
                }

                document.getElementById('progress').style.display = 'block';
                
                vscode.postMessage({
                    command: 'rename',
                    wordsList,
                    prefix
                });
            });
        </script>
    </body>
    </html>`;
}

async function performRename(wordsList: string[], prefix: string) {
    // Show progress notification
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBar.text = "$(sync~spin) Prefixing words...";
    statusBar.show();

    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is opened');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const excludePattern = '{**/.git,**/node_modules,**/vendor}/**';
        
        // Track statistics
        let filesProcessed = 0;
        let matchesReplaced = 0;
        
        // Process each word
        for (const word of wordsList) {
            // Find all files in workspace
            const files = await vscode.workspace.findFiles('**/*', excludePattern);
            
            // Process each file
            for (const file of files) {
                const filePath = file.fsPath;
                
                // Skip binary files or other non-text files
                if (!isTextFile(filePath)) {
                    continue;
                }
                
                try {
                    // Read file content
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();
                    
                    // Create a regular expression with word boundaries to match whole words only
                    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g');
                    
                    // Check if the file contains any matches
                    if (regex.test(text)) {
                        // Reset regex since test() advances the lastIndex
                        regex.lastIndex = 0;
                        
                        // Replace matches with prefix + word
                        const newText = text.replace(regex, `${prefix}${word}`);
                        
                        // Count matches
                        const matchCount = (text.match(regex) || []).length;
                        matchesReplaced += matchCount;
                        
                        // Write changes back to file
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(
                            file, 
                            new vscode.Range(0, 0, document.lineCount, 0), 
                            newText
                        );
                        await vscode.workspace.applyEdit(edit);
                        
                        filesProcessed++;
                    }
                } catch (err) {
                    console.error(`Error processing file ${filePath}:`, err);
                }
            }
        }
        
        vscode.window.showInformationMessage(
            `Prefixing complete! Modified ${matchesReplaced} matches in ${filesProcessed} files.`
        );
    } catch (err) {
        vscode.window.showErrorMessage(`Error during prefix operation: ${err}`);
    } finally {
        statusBar.dispose();
    }
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to check if file is likely a text file
function isTextFile(filePath: string) {
    const binaryExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.mp3', '.mp4', '.avi', '.mov', '.flv',
        '.dll', '.exe', '.so', '.dylib'
    ];
    
    const ext = path.extname(filePath).toLowerCase();
    return !binaryExtensions.includes(ext);
}

export function deactivate() {}
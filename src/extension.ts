import * as vscode from 'vscode';
import * as path from 'path';
import { Routes } from './routes';
import { Contents } from './contents';

export async function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Two);
      return;
    }

    let routes: Routes;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('There is no workspace. Open workspace and then retry.');
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'railsRoutesNavigator',
      'Rails Routes Navigator',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
      }
    );
    currentPanel.webview.html = getWebviewContent(new Contents(currentPanel.webview, context));
    currentPanel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (message.command) {
            case 'search':
              currentPanel?.webview.postMessage({ routes: routes.filterWith(message.text).createHtml() });
              break;
            case 'showTextDocument':
              const document = await openDocument(workspaceFolders[0], message.filePath);
              const index = await getActionIndex(document, message.action);
              const options: vscode.TextDocumentShowOptions = {
                viewColumn: vscode.ViewColumn.One,
                selection: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, 0)),
              };
              vscode.window.showTextDocument(document, options);
              break;
            case 'initializeRoutes':
              routes = new Routes(workspaceFolders[0]);
              routes.loadRoutes(false);
              currentPanel?.webview.postMessage({ routes: routes.createHtml() });
              break;
            case 'refreshRoutes':
              routes.loadRoutes(true);
              currentPanel?.webview.postMessage({ routes: routes.createHtml() });
              break;
          }
        } catch (error) {
          vscode.window.showErrorMessage(`${error}`);
          return;
        }
      },
      undefined,
      context.subscriptions
    );

    currentPanel.onDidDispose(
      () => currentPanel = undefined,
      null,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

async function openDocument(workspaceFolder: vscode.WorkspaceFolder, filePath: string) {
  return await vscode.workspace.openTextDocument(path.join(workspaceFolder.uri.fsPath, filePath));
};

async function getActionIndex(document: vscode.TextDocument, action: string) {
  const regexp = new RegExp(`^\\s*def\\s+\\b${action}\\b\\s*$`);
  for (let index = 0; index < document.lineCount; index++) {
    const line = document.lineAt(index);
    if (regexp.test(line.text)) {
      return index;
    }
  }
  return 0;
};

function getWebviewContent(contents: Contents) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' ${contents.webview.cspSource} https:; script-src ${contents.webview.cspSource} 'unsafe-inline'">
  <script defer src="${contents.scriptUri}" type="text/javascript"></script>
  <link href="${contents.stylesheetUri}" rel="stylesheet" type="text/css">
  <title>Rails Routes Navigator</title>
</head>
<body>
  <h1>Rails Routes Navigator</h1>
  <div id="inputPanel">
    <button id="refreshButton"><img id="refreshImage" src="${contents.iconPath}" alt="Reload routes" /></button>
    <div>
      <input type="search" id="search" placeholder="Input some chars for Rails routes" />
      <span id="notes">Space-separated words are used as AND search.</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <td>Verb</td>
        <td>URI Pattern</td>
        <td>Controller#Action</td>
        <td>Prefix</td>
      </tr>
    </thead>
    <tbody id="allRoutes"></tbody>
  </table>
</body>
</html>`;
}

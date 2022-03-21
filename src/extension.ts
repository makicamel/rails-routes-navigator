import * as vscode from 'vscode';
import * as path from 'path';
import { Routes } from './routes';

export async function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Two);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'railsRoutesNavigator',
      'Rails Routes Navigator',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src'))],
      }
    );

    let routes: Routes;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    try {
      if (!workspaceFolders) { throw Error('There is no workspace.'); }
      routes = new Routes(workspaceFolders[0]);
      routes.loadRoutes();
    } catch (error) {
      vscode.window.showErrorMessage(`${error}`);
      return;
    }

    const scriptUri = vscode.Uri.file(path.join(context.extensionPath, 'src', 'script.js')).with({ scheme: 'vscode-resource' });
    const stylesheetUri = vscode.Uri.file(path.join(context.extensionPath, 'src', 'style.css')).with({ scheme: 'vscode-resource' });
    currentPanel.webview.html = getWebviewContent(currentPanel.webview, scriptUri, stylesheetUri);
    currentPanel.webview.postMessage({ routes: routes.createHtml() });
    currentPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'search':
            if (currentPanel) {
              currentPanel.webview.postMessage({ routes: routes.filterWith(message.text).createHtml() });
            }
          case 'showTextDocument':
            const document = await openDocument(workspaceFolders[0], message.filePath);
            const index = await getActionIndex(document, message.action);
            const options: vscode.TextDocumentShowOptions = {
              viewColumn: vscode.ViewColumn.One,
              selection: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, 0)),
            };
            vscode.window.showTextDocument(document, options);
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

function getWebviewContent(webview: vscode.Webview, scriptUri: vscode.Uri, stylesheetUri: vscode.Uri) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline'">
  <script defer src="${scriptUri}" type="text/javascript"></script>
  <link href="${stylesheetUri}" rel="stylesheet" type="text/css">
  <title>Rails Routes Navigator</title>
</head>
<body>
  <h1>Rails Routes Navigator</h1>
  <input type="search" id="search" placeholder="Input some chars for Rails routes" />

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

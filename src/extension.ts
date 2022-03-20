import * as vscode from 'vscode';
import * as path from 'path';
import { Routes } from './routes';

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
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
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('There is no workspace.');
      return;
    } else {
      try {
        routes = new Routes(workspaceFolders[0]);
        routes.execRailsRoutes();
      } catch (error) {
        vscode.window.showErrorMessage(`${error}`);
        return;
      }
    }
    const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'style.css'));
    const stylesheetUri = onDiskPath.with({ scheme: 'vscode-resource' });
    currentPanel.webview.html = getWebviewContent(currentPanel.webview, stylesheetUri);
    currentPanel.webview.postMessage({ routes: routes.createHtml() });
    currentPanel.webview.onDidReceiveMessage(
      message => {
        if (currentPanel) {
          currentPanel.webview.postMessage({ routes: routes.filterWith(message.text).createHtml() });
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

function getWebviewContent(webview: vscode.Webview, stylesheetUri: vscode.Uri) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' ${webview.cspSource} https:; script-src 'nonce-11032b2d27d2' ">
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

  <script nonce="11032b2d27d2">
    const vscode = acquireVsCodeApi();
    const previousState = vscode.getState();
    let previousRoutes = previousState ? previousState.routes : '<tr></tr>';
    let previousInputText = previousState ? previousState.inputText : '';

    const search = document.getElementById('search');
    search.value = previousInputText;
    search.addEventListener('keyup', () => {
      vscode.postMessage({
        command: 'keyup',
        text: search.value
      })
    });

    const allRoutes = document.getElementById('allRoutes');
    allRoutes.innerHTML = previousRoutes;

    window.addEventListener('message', event => {
      const inputText = search.value;
      const routes = event.data.routes;
      allRoutes.innerHTML = routes;
      vscode.setState({ routes, inputText });
    });
  </script>

</body>
</html>`;
}

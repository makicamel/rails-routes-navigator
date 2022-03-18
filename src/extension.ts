import * as vscode from 'vscode';
import { loadRoutes, parseRoutesText, parseRoutesMap } from './parser';

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'railsRoutesNavigator',
        'Rails Routes Navigator',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
        }
      );

      const rawRoutes = loadRoutes(`${__dirname}/routes.txt`);
      let routes = [];
      if (rawRoutes) {
        const routesMap = parseRoutesText(rawRoutes);
        routes = parseRoutesMap(routesMap);
      }
      else { /* TODO: showInformationMessage and abort */ }

      currentPanel.webview.html = getWebviewContent(currentPanel.webview, routes);
      currentPanel.onDidDispose(
        () => currentPanel = undefined,
        null,
        context.subscriptions
      );
    }
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(webview: vscode.Webview, routes: Array<Array<string>>) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' ${webview.cspSource} https:; script-src 'nonce-11032b2d27d2' ">
  <title>Rails Routes Navigator</title>
</head>
<body>
  <h1>Rails Routes Navigator</h1>
  <input type="search" id="search" placeholder="Input some chars for Rails routes" />
  <div id="input-chars"></div>
  <div id="allRoutes">${routes}</div>

  <script nonce="11032b2d27d2">
    let search = document.getElementById('search');
    const chars = document.getElementById('input-chars');

    search.addEventListener('keyup', () => {
      chars.innerHTML = search.value;
    });
  </script>

</body>
</html>`;
}

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    currentPanel = vscode.window.createWebviewPanel(
      'railsRoutesNavigator',
      'Rails Routes Navigator',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
      }
    );

    currentPanel.webview.html = getWebviewContent(currentPanel.webview);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }

function getWebviewContent(webview: vscode.Webview) {
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

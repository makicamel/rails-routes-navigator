import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    vscode.window.showInputBox({
      prompt: 'Input Rails Routes',
      validateInput: (input: string): string | undefined =>
        (!input) ? 'Input some chars for Rails routes' : undefined
    }).then(
      inputString => {
        if (!inputString) { return; };

        const panel = vscode.window.createWebviewPanel(
          'railsRoutesNavigator',
          'Rails Routes Navigator',
          vscode.ViewColumn.Two,
          {}
        );
        panel.webview.html = getWebviewContent(panel.webview, inputString);
      }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }

function getWebviewContent(webview: vscode.Webview, inputString: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:;">
  <title>Rails Routes Navigator</title>
</head>
<body>
  <h1>Rails Routes Navigator</h1>
  ${inputString}
</body>
</html>`;
}

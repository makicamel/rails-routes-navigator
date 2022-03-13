import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    vscode.window.showInformationMessage('Hello World! from Rails Routes Navigator!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('rails-routes-navigator.railsRoutesNavigate', () => {
    vscode.window.showInputBox({
      prompt: 'Input Rails Routes',
      validateInput: (input: string): string | undefined =>
        (!input) ? 'Input some chars for Rails routes' : undefined
    }).then(
      inputString => {
        vscode.window.showInformationMessage(inputString);
      }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }

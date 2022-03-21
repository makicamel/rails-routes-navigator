import * as vscode from 'vscode';
import * as path from 'path';

export class Contents {
  constructor(
    public readonly webview: vscode.Webview,
    private readonly context: vscode.ExtensionContext,
  ) {
    this.scriptUri = vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'script.js')).with({ scheme: 'vscode-resource' });
    this.stylesheetUri = vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'style.css')).with({ scheme: 'vscode-resource' });
    const onDiskPath = vscode.Uri.file(
      path.join(this.context.extensionPath, 'media', 'refresh.png')
    );
    this.iconPath = webview.asWebviewUri(onDiskPath);
  }

  public readonly scriptUri: vscode.Uri;
  public readonly stylesheetUri: vscode.Uri;
  public readonly iconPath: vscode.Uri;
}

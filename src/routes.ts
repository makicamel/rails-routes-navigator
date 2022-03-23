import * as fs from 'fs';
import * as readline from 'readline';
import { WorkspaceFolder } from 'vscode';
import { spawn } from 'child_process';
import { Readable } from 'stream';

export class Routes {
  private _allRoutes!: Array<Route>;
  private _routes!: Array<Route>;
  private readonly workSpaceFolder: WorkspaceFolder;

  constructor(workSpaceFolder: WorkspaceFolder) {
    this.workSpaceFolder = workSpaceFolder;
    this.allRoutes = [];
    this.routes = [];
  }

  public async loadRoutes(refresh: boolean): Promise<void> {
    let readStream: Readable;
    if (refresh || !fs.existsSync(this.routesFilePath)) {
      readStream = this.execRailsRoutes();
    } else {
      readStream = fs.createReadStream(this.routesFilePath);
    }
    await this.putRoutes(readStream);
  }

  private execRailsRoutes(): Readable {
    const exec = spawn('bundle', ['exec', 'rails', 'routes'], {
      cwd: this.workSpaceFolder.uri.fsPath,
    });
    const write = fs.createWriteStream(this.routesFilePath, 'utf8');
    exec.stdout.pipe(write);
    return exec.stdout;
  }

  private async putRoutes(readStream: Readable): Promise<void> {
    this.routes = this.allRoutes = [];
    const lines: readline.Interface = readline.createInterface({
      input: readStream
    });

    for await (const line of lines) {
      const route = await this.parse(line);
      if (route) { this.allRoutes.push(route); }
    }
    lines.on('close', () => {
      this.routes = this.allRoutes;
    });
  }

  private async parse(line: string): Promise<Route | undefined> {
    if (!/(GET|POST|PUT|PATCH|DELETE)/.test(line)) { return; }

    const routesFragments = line.match(/\s*([\s\w]+)\s+([|\w]+)\s+([-_/\w().:]+)\s+([/\w]+)#([/\w]+)/)?.slice(1);
    if (routesFragments) {
      return new Route(
        routesFragments[0], // prefix
        routesFragments[1], // verb
        routesFragments[2], // uri
        routesFragments[3], // controller
        routesFragments[4], // action
        this.allRoutes[this.allRoutes.length - 1] // previousRoute
      );
    }
  }

  public createHtml(): string {
    return this.routes.map(route => route.createHtml()).join('');
  }

  public filterWith(text: string): Routes {
    const keywords = text.split(/\s+/);
    this.routes = this.allRoutes.filter((route) => route.isMatchedRoute(keywords));
    return this;
  }

  private get routesFilePath(): string {
    return `${__dirname}/routes-${this.workSpaceFolder.name}.txt`;
  }

  private get allRoutes(): Array<Route> {
    return this._allRoutes || [];
  }

  private get routes(): Array<Route> {
    return this._routes || [];
  }

  private set allRoutes(allRoutes: Array<Route>) {
    this._allRoutes = allRoutes;
  }

  private set routes(routes: Array<Route>) {
    this._routes = routes;
  }
}

class Route {
  private readonly prefix: string;
  private readonly verb: string;
  private readonly uri: string;
  private readonly controller: string;
  private readonly action: string;

  constructor(prefix: string, verb: string, uri: string, controller: string, action: string, previousRoute: Route | undefined) {
    this.prefix = (prefix === ' ' && previousRoute && controller === previousRoute.controller) ? previousRoute.prefix : prefix;
    this.verb = verb;
    this.uri = uri;
    this.controller = controller;
    this.action = action;
  }

  public isMatchedRoute(keywords: Array<string>): boolean {
    const target = `${this.prefix}${this.verb.toLowerCase()}${this.verb}${this.uri}${this.controller}#${this.action}`;
    return keywords.reduce((previousValue: boolean, currentValue: string) => {
      return previousValue && target.includes(currentValue);
    },
      true // initialValue
    );
  }

  public createHtml(): string {
    return `<tr onclick="showTextDocument('${this.filePath}', '${this.action}')">
      <td class="verb ${this.verbClass}">${this.verb}</td>
      <td>${this.uri}</td>
      <td>${this.controller}#${this.action}</td>
      <td>${this.prefix}</td>
    </tr>`;
  }

  private get verbClass(): string {
    switch (this.verb) {
      case 'GET':
        return 'get';
      case 'POST':
        return 'post';
      case 'DELETE':
        return 'delete';
      default:
        return 'put';
    }
  }

  private get filePath(): string {
    return `app/controllers/${this.controller}_controller.rb`;
  }
}

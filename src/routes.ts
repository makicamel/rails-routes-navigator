import * as fs from 'fs';
import { WorkspaceFolder } from 'vscode';
import { spawn } from 'child_process';

export class Routes {
  private _allRoutes!: Array<Route>;
  private _routes!: Array<Route>;
  private readonly workSpaceFolder: WorkspaceFolder;

  constructor(workSpaceFolder: WorkspaceFolder) {
    this.workSpaceFolder = workSpaceFolder;
    this.allRoutes = [];
    this.routes = [];
  }

  public loadRoutes(refresh: boolean): void {
    if (refresh || !fs.existsSync(this.routesFilePath)) {
      this.writeRoutes();
    }
    const routesString = this.load();
    this.routes = this.allRoutes = this.parse(routesString);
  }

  public createHtml(): string {
    return this.routes.map(route => route.createHtml()).join('');
  }

  public filterWith(text: string): Routes {
    const keywords = text.split(/\s+/);
    this.routes = this.allRoutes.filter((route) => route.isMatchedRoute(keywords));
    return this;
  }

  private writeRoutes(): void {
    const task = spawn('bundle', ['exec', 'rails', 'routes'], {
      cwd: this.workSpaceFolder.uri.fsPath,
    });
    const dest = fs.createWriteStream(this.routesFilePath, 'utf8');
    task.stdout.pipe(dest);
  }

  private load(): string {
    return fs.readFileSync(this.routesFilePath).toString();
  }

  private parse(routesString: string): Array<Route> {
    const lines = routesString.split(/[\n\r\n]/).filter(line => /(GET|POST|PUT|PATCH|DELETE)/.test(line));
    const routes: Array<Route> = [];
    lines.forEach((line) => {
      const routesFragments = line.match(/\s*([\s\w]+)\s+([|\w]+)\s+([-_/\w().:]+)\s+([/\w]+)#([/\w]+)/)?.slice(1);
      if (routesFragments) {
        const route = new Route(
          routesFragments[0], // prefix
          routesFragments[1], // verb
          routesFragments[2], // uri
          routesFragments[3], // controller
          routesFragments[4], // action
          routes[routes.length - 1] // previousRoute
        );
        routes.push(route);
      }
    });
    return routes;
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

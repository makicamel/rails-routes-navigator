import * as fs from 'fs';

export class Routes {
  private routes: Array<Route>;
  private readonly routesFilePath = `${__dirname}/routes.txt`;

  constructor() {
    const routesString = this.load();
    this.routes = routesString ? this.parse(routesString) : [];
  }

  public createHtml(): string {
    return this.routes.map(route => route.createHtml()).join('');
  }

  public filterWith(text: string): Routes {
    this.routes = this.routes.filter((route) => route.isMatchedRoute(text));
    return this;
  }

  private load() {
    return fs.readFileSync(this.routesFilePath).toString();
  }

  private parse(routesString: string): Array<Route> {
    const lines = routesString.split(/[\n\r\n]/).filter(line => /(GET|POST|PUT|PATCH|DELETE)/.test(line));
    const routes: Array<Route> = [];
    lines.forEach((line) => {
      const routesFragments = line.match(/\s*([\s\w]+)\s+([|\w]+)\s+([-_/\w().:]+)\s+([/\w#]+)/)?.slice(1);
      if (routesFragments) {
        const route = new Route(
          routesFragments[0], // prefix
          routesFragments[1], // verb
          routesFragments[2], // uri
          routesFragments[3], // controllerAction
        );
        routes.push(route);
      }
    });
    return routes;
  }
}

class Route {
  prefix: string;
  verb: string;
  uri: string;
  controllerAction: string;

  constructor(prefix: string, verb: string, uri: string, controllerAction: string) {
    this.prefix = prefix;
    this.verb = verb;
    this.uri = uri;
    this.controllerAction = controllerAction;
  }

  public isMatchedRoute(input: string): boolean {
    return this.prefix.includes(input) ||
      this.verb.includes(input) ||
      this.verb.toLowerCase().includes(input) ||
      this.uri.includes(input) ||
      this.controllerAction.includes(input);
  }

  public createHtml(): string {
    return `<tr>
      <td>${this.verb}</td>
      <td>${this.uri}</td>
      <td>${this.controllerAction}</td>
      <td>${this.prefix}</td>
    </tr>`;
  }
}

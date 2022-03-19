import * as fs from 'fs';

export function loadRoutes(path: string) {
  try {
    const buffer = fs.readFileSync(path);
    return buffer.toString();
  } catch (error) {
    console.log(`failed to read ${error}`);
  }
}

export function parseRoutes(rawRoutes: string): Array<Route> {
  const lines = rawRoutes.split(/[\n\r\n]/).filter(line => /(GET|POST|PUT|PATCH|DELETE)/.test(line));
  const routes: Array<Route> = [];
  lines.forEach((line) => {
    const routesFragments = line.match(/\s*([\s\w]+)\s+([|\w]+)\s+([-_/\w().:]+)\s+([/\w#]+)/)?.slice(1);
    if (routesFragments) {
      routes.push({
        prefix: routesFragments[0],
        verb: routesFragments[1],
        uri: routesFragments[2],
        controllerAction: routesFragments[3],
      });
    }
  });
  return routes;
}

export type Route = {
  prefix: string,
  verb: string,
  uri: string,
  controllerAction: string,
};

export function isMatchedRoute(input: string, route: Route): boolean {
  return route.prefix.includes(input) ||
    route.verb.includes(input) ||
    route.verb.toLowerCase().includes(input) ||
    route.uri.includes(input) ||
    route.controllerAction.includes(input);
}

export function createRoutesHtml(route: Route) {
  return `<tr>
  <td>${route.verb}</td>
  <td>${route.uri}</td>
  <td>${route.controllerAction}</td>
  <td>${route.prefix}</td>
</tr>`;
}

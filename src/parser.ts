import * as fs from 'fs';
import { Route } from './types';

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
    const routesFragments = line.match(/\s*([\s\w]+)\s+(\w+)\s+([-_/\w().:]+)\s+([\w#]+)/)?.slice(1);
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

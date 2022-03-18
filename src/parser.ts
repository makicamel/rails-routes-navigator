import * as fs from 'fs';

export function loadRoutes(path: string) {
  try {
    const buffer = fs.readFileSync(path);
    return buffer.toString();
  } catch (error) {
    console.log(`failed to read ${error}`);
  }
}

export function parseRoutesText(rawRoutes: string) {
  const lines = rawRoutes.split(/[\n\r\n]/).filter(line => /(GET|POST|PUT|PATCH|DELETE)/.test(line));
  const routesMap = new Map();
  lines.forEach((line) => {
    const routesFragments = line.match(/\s*([\s\w]+)\s+(\w+)\s+([-_/\w().:]+)\s+([\w#]+)/)?.slice(1);
    if (routesFragments) {
      // 0: Prefix
      // 1: Verb
      // 2: URI Pattern
      // 3: Controller#Action
      const identifier = `${routesFragments[1]}:${routesFragments[2]}`;
      routesMap.set(identifier, { prefix: routesFragments[0], controller: routesFragments[3] });
    }
  });
  return routesMap;
}

export function parseRoutesMap(routesMap: Map<string, object>) {
  const routesArray = new Array;
  routesMap.forEach((value: object, identifier: string, _self: Map<string, object>) =>
    routesArray.push([identifier, ...Object.values(value)])
  );
  return routesArray;
}

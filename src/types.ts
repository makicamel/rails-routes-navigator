export type Route = {
  prefix: string,
  verb: string,
  uri: string,
  controllerAction: string,
};

export function isMatchedRoute(input: string, route: Route): boolean {
  return route.prefix.includes(input) ||
    route.verb.includes(input) ||
    route.uri.includes(input) ||
    route.controllerAction.includes(input);
}

export function createRoutesHtml(route: Route) {
  return `
  <p>${route.verb}:${route.uri}:${route.controllerAction}</p>
  `;
}

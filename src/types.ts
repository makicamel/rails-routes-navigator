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

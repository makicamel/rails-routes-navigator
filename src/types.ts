export type Route = {
  prefix: string,
  verb: string,
  uri: string,
  controllerAction: string,
};

export function createRoutesHtml(route: Route) {
  return `
  <p>${route.verb}:${route.uri}:${route.controllerAction}</p>
  `;
}

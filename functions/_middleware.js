// Legacy hostnames: permanent redirect to the matching place in this lab. Assets never reach this (see public/_routes.json).
const LEGACY = {"labs.mohammed-km.in": "https://engineering.mohammed-km.in/", "grid.mohammed-km.in": "https://engineering.mohammed-km.in/#grid", "orbits.mohammed-km.in": "https://engineering.mohammed-km.in/#orbits"};
export async function onRequest({ request, next }) {
  const target = LEGACY[new URL(request.url).hostname];
  return target ? Response.redirect(target, 308) : next();
}

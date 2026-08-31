/**
 * Liveness probe for the container HEALTHCHECK.
 *
 * Deliberately separate from `/`: the home page calls the API, so using it as
 * the probe would mark this container unhealthy - and get it restarted -
 * whenever the *backend* is down.
 */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ status: 'ok', uptime: process.uptime() });
}

/**
 * Live adapters consume generated OpenAPI clients once contracts stabilize.
 * Until then, production composition roots use explicit unavailable adapters
 * rather than silent mock fallbacks.
 */
export { UnavailablePreparationRouteRepository } from "./unavailablePreparationRouteRepository";

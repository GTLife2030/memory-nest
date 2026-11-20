import { personas, type PersonaId } from "./data";

export const PERSONA_COOKIE = "mn_persona";

export function resolvePersona(value: string | undefined) {
  return personas.find((persona) => persona.id === value) ?? personas[0];
}

export const isPersonaId = (value: unknown): value is PersonaId =>
  personas.some((persona) => persona.id === value);

/** Reads `?stap=` as a step number; anything else means the first step. */
export function stepFrom(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

import { PortablePersonaSchema, PersonaSchema } from '../schemas/persona';
import type { LocalPersona, PortablePersona } from '../schemas/persona';

export class CodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodecError';
  }
}

export function b64urlEncode(str: string): string {
  if (typeof TextEncoder === 'undefined') {
    // fallback for environments without TextEncoder if needed, but jsdom/browsers have it
    const b64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const b64 = btoa(binString);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binString = atob(b64);
  
  if (typeof TextDecoder === 'undefined') {
    return decodeURIComponent(Array.prototype.map.call(binString, (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}

export type ExportPersonaOptions = {
  includeAvatar?: boolean;
  includeDescription?: boolean;
  includeAdvancedRules?: boolean;
  includeTags?: boolean;
  
  includeUiColor?: boolean;
  includeRecommendedModel?: boolean;
  includeIsCouncilMember?: boolean;
  includeWelcomeMessage?: boolean;
  includePrice?: boolean;
  includeDefaultWordLimit?: boolean;
  includeIsFavorite?: boolean;
  includeIsArchived?: boolean;
  includeLastUsedAt?: boolean;
};

export function encodePersona(localPersona: LocalPersona, options: ExportPersonaOptions = {}): string {
  const persona = PersonaSchema.parse(localPersona);
  
  if (options.includeAvatar === false) delete persona.avatar;
  if (options.includeDescription === false) delete persona.description;
  if (options.includeAdvancedRules === false) delete persona.advancedRules;
  if (options.includeTags === false) delete persona.tags;

  const localConfig: PortablePersona['localConfig'] = {};
  if (options.includeUiColor && localPersona.ui_color !== undefined) localConfig.ui_color = localPersona.ui_color;
  if (options.includeRecommendedModel && localPersona.recommended_model !== undefined) localConfig.recommended_model = localPersona.recommended_model;
  if (options.includeIsCouncilMember && localPersona.is_council_member !== undefined) localConfig.is_council_member = localPersona.is_council_member;
  if (options.includeWelcomeMessage && localPersona.welcome_message !== undefined) localConfig.welcome_message = localPersona.welcome_message;
  if (options.includePrice && localPersona.price !== undefined) localConfig.price = localPersona.price;
  if (options.includeDefaultWordLimit && localPersona.defaultWordLimit !== undefined) localConfig.defaultWordLimit = localPersona.defaultWordLimit;
  if (options.includeIsFavorite && localPersona.isFavorite !== undefined) localConfig.isFavorite = localPersona.isFavorite;
  if (options.includeIsArchived && localPersona.isArchived !== undefined) localConfig.isArchived = localPersona.isArchived;
  if (options.includeLastUsedAt && localPersona.lastUsedAt !== undefined) localConfig.lastUsedAt = localPersona.lastUsedAt;

  const portable: PortablePersona = {
    version: 'framework-engine.persona/v1',
    persona,
  };
  
  if (Object.keys(localConfig).length > 0) {
    portable.localConfig = localConfig;
  }

  const jsonStr = JSON.stringify(portable);
  return b64urlEncode(jsonStr);
}

export function decodePersona(encoded: string): PortablePersona {
  try {
    const jsonStr = b64urlDecode(encoded);
    const parsed = JSON.parse(jsonStr);
    return PortablePersonaSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      throw new CodecError('Invalid portable persona schema version or data.');
    }
    throw new CodecError('Failed to decode portable persona data.');
  }
}

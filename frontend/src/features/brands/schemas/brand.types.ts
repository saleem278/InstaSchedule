/**
 * Brand shape as returned by the API (Mongoose document serialized to JSON).
 */
export interface Brand {
  _id: string;
  user: string;
  name: string;
  logoUrl?: string;
  colors?: string[];
  fonts?: string[];
  tone?: string;
  audience?: string;
  website?: string;
  instagramUsername?: string;
  /** IG Business/Creator account id (publish target). */
  instagramUserId?: string;
  /** Derived by the API: true when an IG account id is configured. The raw access token is never returned. */
  instagramConnected?: boolean;
  defaultTextProvider?: string;
  defaultImageProvider?: string;
  defaultTextModel?: string;
  defaultImageModel?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload accepted by POST /brands and PATCH /brands/:brandId.
 * `colors` is [primary, secondary?] and `fonts` is [fontPairingId] to keep
 * parity with the backend's flat string-array fields while the wizard works
 * with richer step-shaped data.
 */
export interface BrandPayload {
  name: string;
  logoUrl?: string;
  colors?: string[];
  fonts?: string[];
  tone?: string;
  audience?: string;
  website?: string;
  instagramUsername?: string;
  instagramUserId?: string;
  /** Write-only: sent when the user enters/changes the token; never returned by reads. */
  instagramAccessToken?: string;
  defaultTextProvider?: string;
  defaultImageProvider?: string;
  defaultTextModel?: string;
  defaultImageModel?: string;
}

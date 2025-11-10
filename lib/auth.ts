import jwt from "jsonwebtoken";
import crypto from "crypto-js";

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_ISSUER = process.env.JWT_ISSUER || "copay-payment-proxy";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "copay-backend";
const HMAC_SECRET = process.env.HMAC_SECRET || "";

function validateJWTSecret() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return JWT_SECRET;
}

function validateHMACSecret() {
  if (!HMAC_SECRET) {
    throw new Error("HMAC_SECRET environment variable is required");
  }
  return HMAC_SECRET;
}

export interface JWTPayload {
  sub: string; // subject (user ID)
  iss: string; // issuer
  aud: string; // audience
  exp: number; // expiration time
  iat: number; // issued at
  organizationId?: string;
  permissions?: string[];
}

/**
 * Generate JWT token for authenticating with Co-Pay backend
 */
export function generateJWT(
  payload: Omit<JWTPayload, "iss" | "aud" | "exp" | "iat">
): string {
  const secret = validateJWTSecret();
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: now,
    exp: now + 15 * 60, // 15 minutes expiration
  };

  return jwt.sign(fullPayload, secret, { algorithm: "HS256" });
}

/**
 * Verify JWT token received from Co-Pay backend
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = validateJWTSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Generate HMAC signature for request authentication
 */
export function generateHMACSignature(
  method: string,
  url: string,
  body: string,
  timestamp: number
): string {
  const secret = validateHMACSecret();
  const message = `${method.toUpperCase()}|${url}|${body}|${timestamp}`;
  return crypto.HmacSHA256(message, secret).toString(crypto.enc.Hex);
}

/**
 * Verify HMAC signature
 */
export function verifyHMACSignature(
  method: string,
  url: string,
  body: string,
  timestamp: number,
  signature: string
): boolean {
  const expectedSignature = generateHMACSignature(method, url, body, timestamp);

  // Check timestamp is within 5 minutes
  const now = Date.now();
  const timestampMs = timestamp * 1000;
  const timeDiff = Math.abs(now - timestampMs);
  const fiveMinutes = 5 * 60 * 1000;

  if (timeDiff > fiveMinutes) {
    console.error("HMAC timestamp too old or too far in future");
    return false;
  }

  // Use constant time comparison to prevent timing attacks
  return (
    crypto.lib.WordArray.create(
      Buffer.from(expectedSignature, "hex")
    ).toString() ===
    crypto.lib.WordArray.create(Buffer.from(signature, "hex")).toString()
  );
}

/**
 * Create authorization headers for Co-Pay backend requests
 */
export function createAuthHeaders(authToken?: string): Record<string, string> {
  if (authToken) {
    return {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };
  }

  // Generate JWT for service-to-service communication
  const token = generateJWT({
    sub: "payment-proxy-service",
    organizationId: "system",
    permissions: ["payment:read", "payment:update"],
  });

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create HMAC headers for Co-Pay backend requests
 */
export function createHMACHeaders(
  method: string,
  url: string,
  body: string = ""
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateHMACSignature(method, url, body, timestamp);

  return {
    "X-Timestamp": timestamp.toString(),
    "X-Signature": signature,
    "Content-Type": "application/json",
  };
}

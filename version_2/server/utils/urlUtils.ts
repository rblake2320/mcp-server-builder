import { Request } from 'express';

/**
 * Gets the proper origin from the request
 * This handles various proxies and edge cases in Replit
 */
export function getOrigin(req: Request): string {
  const headers = req.headers;
  
  // First try to get from X-Forwarded headers
  const protocol = headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = headers['x-forwarded-host'] || headers.host || req.get('host');
  
  // If we don't have a host, fall back to Replit domain if available
  if (!host && process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}`;
  }
  
  // Default fallback
  return `${protocol}://${host}`;
}

/**
 * Builds a full URL for a path, using the request to determine the origin
 */
export function buildUrl(req: Request, path: string): string {
  const origin = getOrigin(req);
  
  // Ensure path starts with / but avoid duplicates
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${origin}${normalizedPath}`;
}

/**
 * Gets the callback URL for OAuth providers
 * This is a convenience function for building OAuth callback URLs
 */
export function getOAuthCallbackUrl(req: Request, provider: string): string {
  return buildUrl(req, `/auth/${provider}/callback`);
}
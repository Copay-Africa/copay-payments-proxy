import { NextRequest, NextResponse } from 'next/server'

// Security headers for all responses
const securityHeaders = {
  // Prevent the site from being embedded in frames
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent referrer information from being sent to other sites
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com",
    "style-src 'self' 'unsafe-inline' https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://dashboard.irembopay.com https://dashboard.sandbox.irembopay.com https://api.irembopay.com https://api.sandbox.irembopay.com https://api-js.mixpanel.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
}

// Rate limiting storage (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function getClientKey(request: NextRequest): string {
  // Use forwarded IP if behind a proxy, otherwise use request IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  return `rate_limit:${ip}`
}

function checkRateLimit(key: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = requestCounts.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset window
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000) // Clean every minute

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Rate limiting for payment pages
  if (request.nextUrl.pathname.startsWith('/pay/')) {
    const clientKey = getClientKey(request)
    
    if (!checkRateLimit(clientKey, 30, 60000)) { // 30 requests per minute per IP
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            ...securityHeaders
          }
        }
      )
    }
  }
  
  // Validate required query parameters for payment pages
  if (request.nextUrl.pathname.match(/^\/pay\/[^\/]+$/)) {
    const searchParams = request.nextUrl.searchParams
    const requiredParams = ['invoiceNumber', 'authToken', 'callback']
    
    for (const param of requiredParams) {
      if (!searchParams.has(param)) {
        return NextResponse.json(
          { error: `Missing required parameter: ${param}` },
          { 
            status: 400,
            headers: securityHeaders
          }
        )
      }
    }
    
    // Validate callback URL format
    const callback = searchParams.get('callback')
    if (callback) {
      try {
        const url = new URL(callback)
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Invalid callback URL protocol' },
            { 
              status: 400,
              headers: securityHeaders
            }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid callback URL format' },
          { 
            status: 400,
            headers: securityHeaders
          }
        )
      }
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
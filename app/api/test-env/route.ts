import { NextResponse } from 'next/server'

export async function GET() {
  // Return all environment variables for debugging (be careful in production!)
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY: process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY,
    IREMBOPAY_PUBLIC_KEY: process.env.IREMBOPAY_PUBLIC_KEY,
    NEXT_PUBLIC_IREMBOPAY_CDN_URL: process.env.NEXT_PUBLIC_IREMBOPAY_CDN_URL,
    IREMBOPAY_CDN_URL: process.env.IREMBOPAY_CDN_URL,
    public_key_exists: !!process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY,
    public_key_length: process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY?.length,
    private_key_exists: !!process.env.IREMBOPAY_PUBLIC_KEY,
    private_key_length: process.env.IREMBOPAY_PUBLIC_KEY?.length,
  }

  console.log('Environment Debug:', envDebug)

  return NextResponse.json({
    message: 'Environment variables debug',
    env: envDebug
  })
}
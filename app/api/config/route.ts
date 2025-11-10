import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Debug: Log all environment variables to see what's available
    console.log('Environment variables debug:')
    console.log('NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY:', process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY)
    console.log('IREMBOPAY_PUBLIC_KEY:', process.env.IREMBOPAY_PUBLIC_KEY)
    console.log('NEXT_PUBLIC_IREMBOPAY_CDN_URL:', process.env.NEXT_PUBLIC_IREMBOPAY_CDN_URL)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    // Return public configuration that's safe to expose to client
    const config = {
      irembopayPublicKey: process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY || process.env.IREMBOPAY_PUBLIC_KEY,
      irembopayScriptUrl: process.env.NEXT_PUBLIC_IREMBOPAY_CDN_URL,
      environment: process.env.NODE_ENV,
    }

    // Validate required config
    if (!config.irembopayPublicKey) {
      console.error('Missing NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY in environment variables')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    if (!config.irembopayScriptUrl) {
      console.error('Missing NEXT_PUBLIC_IREMBOPAY_CDN_URL in environment variables')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)

  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}
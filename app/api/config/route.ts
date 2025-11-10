import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      irembopayPublicKey: process.env.NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY || process.env.IREMBOPAY_PUBLIC_KEY,
      irembopayScriptUrl: process.env.NEXT_PUBLIC_IREMBOPAY_CDN_URL,
      environment: process.env.NODE_ENV,
    }

    if (!config.irembopayPublicKey) {
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    if (!config.irembopayScriptUrl) {
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)

  } catch {
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}
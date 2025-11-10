import { NextRequest, NextResponse } from 'next/server'
import { getCopayApi, CopayApiError } from '@/lib/copay-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const body = await request.json()
    
    const { status, transactionId, authToken, failureReason, gatewayData } = body
    
    if (!status || !authToken) {
      return NextResponse.json(
        { error: 'Missing required fields: status, authToken' },
        { status: 400 }
      )
    }

    if (!['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "PROCESSING", "COMPLETED", "FAILED", or "CANCELLED"' },
        { status: 400 }
      )
    }

    // Update payment status in Co-Pay backend via callback endpoint
    await getCopayApi().updatePaymentStatus(
      paymentId,
      status as "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED",
      transactionId,
      authToken,
      failureReason,
      gatewayData
    )

    return NextResponse.json({ 
      status: 'success',
      message: 'Payment status updated successfully',
      paymentId,
      paymentStatus: status,
      transactionId
    })

  } catch (err) {
    console.error('Payment callback error:', err)
    
    if (err instanceof CopayApiError) {
      return NextResponse.json(
        { 
          status: 'error',
          error: err.message || 'Failed to update payment status' 
        },
        { status: err.status || 500 }
      )
    }

    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to update payment status' 
      },
      { status: 500 }
    )
  }
}
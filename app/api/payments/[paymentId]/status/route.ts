import { NextRequest, NextResponse } from 'next/server'
import { getCopayApi, CopayApiError } from '@/lib/copay-api'

export async function PUT(
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

    // Update payment status in Copay backend
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
    if (err instanceof CopayApiError) {
      return NextResponse.json(
        { error: err.message || 'Failed to update payment status' },
        { status: err.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    )
  }
}

// Add POST method for payment callbacks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  // Use the same logic as PUT for callbacks
  return PUT(request, { params })
}
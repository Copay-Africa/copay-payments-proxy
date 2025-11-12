import { NextRequest, NextResponse } from "next/server";
import { getCopayApi, CopayApiError } from "@/lib/copay-api";
import {
  validatePaymentRequest,
  sanitizeParams,
  isPaymentValid,
} from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const { searchParams } = new URL(request.url);

    // Get and sanitize query parameters
    const rawParams = Object.fromEntries(searchParams.entries())
    console.log('Raw parameters:', rawParams)
    
    const sanitizedParams = sanitizeParams(rawParams)
    console.log('Sanitized parameters:', sanitizedParams)

    // Validate required parameters
    const requestData = validatePaymentRequest({
      invoiceNumber: sanitizedParams.invoiceNumber,
      authToken: sanitizedParams.authToken,
      callback: sanitizedParams.callback,
      locale: sanitizedParams.locale || 'en'
    })
    
    console.log('Validated request data:', { 
      ...requestData, 
      authToken: 'present' // Don't log the actual token
    })

    // Fetch payment information from Copay backend
    const payment = await getCopayApi().getPaymentInfo(
      paymentId,
      requestData.authToken
    );

    // Validate payment is still processable
    const validation = isPaymentValid(payment);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || "Payment cannot be processed" },
        { status: 400 }
      );
    }

    // Verify invoice number matches
    if (payment.invoiceNumber !== requestData.invoiceNumber) {
      return NextResponse.json(
        { error: "Invalid payment request. Invoice number mismatch." },
        { status: 400 }
      );
    }

    return NextResponse.json(payment);
  } catch (err) {
    const { paymentId } = await params
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    
    console.error("Payment API error:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
      paymentId,
      backendUrl: process.env.COPAY_BACKEND_URL,
      authToken: rawParams?.authToken ? "present" : "missing",
      invoiceNumber: rawParams?.invoiceNumber || "missing",
      callback: rawParams?.callback || "missing"
    });

    if (err instanceof CopayApiError) {
      const statusCode = err.status || 500;
      let errorMessage = "Failed to load payment information";

      switch (err.status) {
        case 401:
          errorMessage = "Authentication failed. Invalid or expired token.";
          break;
        case 404:
          errorMessage = "Payment not found. Please check the payment ID.";
          break;
        case 403:
          errorMessage =
            "Access denied. You do not have permission to view this payment.";
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    return NextResponse.json(
      { error: "Failed to load payment information. Please try again." },
      { status: 500 }
    );
  }
}

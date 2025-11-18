/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PaymentPage from '@/components/payment-page'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { PaymentInfo, PaymentRequest, validatePaymentRequest, sanitizeParams, isPaymentValid, IremboPayCallback } from '@/lib/validation'

interface PaymentClientProps {
  paymentId: string
}

export default function PaymentClient({ paymentId }: PaymentClientProps) {
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validatedRequest, setValidatedRequest] = useState<PaymentRequest | null>(null)
  const [config, setConfig] = useState<{ irembopayPublicKey: string; irembopayScriptUrl: string } | null>(null)
  const [processingCallback, setProcessingCallback] = useState(false)

  useEffect(() => {
    async function loadPayment() {
      try {
        // First, load the configuration
        const configResponse = await fetch('/api/config')
        if (!configResponse.ok) {
          throw new Error('Failed to load payment configuration')
        }
        const configData = await configResponse.json()
        setConfig(configData)

        // Get and sanitize query parameters
        const rawParams = Object.fromEntries(searchParams.entries())
        const sanitizedParams = sanitizeParams(rawParams)

        // Validate required parameters
        const requestData = validatePaymentRequest({
          invoiceNumber: sanitizedParams.invoiceNumber,
          authToken: sanitizedParams.authToken,
          callback: sanitizedParams.callback,
          locale: sanitizedParams.locale || 'en',
          deeplink: sanitizedParams.deeplink === 'true'
        })

        setValidatedRequest(requestData)

        // Fetch payment information from API route
        const response = await fetch(`/api/payments/${paymentId}?authToken=${encodeURIComponent(requestData.authToken)}&invoiceNumber=${encodeURIComponent(requestData.invoiceNumber)}&callback=${encodeURIComponent(requestData.callback)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Request failed with status ${response.status}`)
        }

        const payment = await response.json()

        // Validate payment is still processable
        const validation = isPaymentValid(payment)
        if (!validation.valid) {
          setError(validation.reason || 'Payment cannot be processed')
          return
        }

        // Verify invoice number matches
        if (payment.invoiceNumber !== requestData.invoiceNumber) {
          setError('Invalid payment request. Invoice number mismatch.')
          return
        }

        setPaymentInfo(payment)
      } catch (err) {
        if (err instanceof Error) {
          // Parse error message for specific status codes
          if (err.message.includes('401') || err.message.includes('Authentication')) {
            setError('Authentication failed. Invalid or expired token.')
          } else if (err.message.includes('404') || err.message.includes('not found')) {
            setError('Payment not found. Please check the payment ID.')
          } else if (err.message.includes('403') || err.message.includes('Access denied')) {
            setError('Access denied. You do not have permission to view this payment.')
          } else {
            setError(err.message || 'Failed to load payment information')
          }
        } else {
          setError('Failed to load payment information. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadPayment()
  }, [paymentId, searchParams])

  const handlePaymentSuccess = async (response: IremboPayCallback) => {
    try {
      if (validatedRequest) {
        setProcessingCallback(true)

        const statusResponse = await fetch(`/api/payments/${paymentId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'PROCESSING',
            transactionId: response.transactionId || null,
            authToken: validatedRequest.authToken,
            gatewayData: {
              message: response.message,
              amount: response.amount,
              timestamp: new Date().toISOString(),
              invoiceNumber: response.invoiceNumber
            }
          }),
        })

        if (!statusResponse.ok) {
          throw new Error('Failed to update payment status on server')
        }

        const result = await statusResponse.json()

        if (result.status === 'success') {
          // Redirect to success page with parameters for deep link handling
          if (validatedRequest.callback) {
            const successUrl = `/payment-success?transactionId=${encodeURIComponent(response.transactionId || '')}&paymentId=${encodeURIComponent(paymentId)}&callback=${encodeURIComponent(validatedRequest.callback)}&deeplink=${validatedRequest.deeplink}`
            window.location.href = successUrl
          }
        } else {
          throw new Error(result.message || 'Server returned error status')
        }
      }
    } catch {
      setProcessingCallback(false)
      alert('Payment was processed but there was an error updating the system. Please contact support.')
    }
  }

  const handlePaymentError = async (error: IremboPayCallback) => {
    try {
      if (validatedRequest) {
        setProcessingCallback(true)

        const statusResponse = await fetch(`/api/payments/${paymentId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'FAILED',
            authToken: validatedRequest.authToken,
            failureReason: error.message || 'Payment failed',
            gatewayData: {
              errors: error.errors || [],
              timestamp: new Date().toISOString(),
              invoiceNumber: error.invoiceNumber
            }
          }),
        })

        if (statusResponse.ok) {
          const result = await statusResponse.json()
          if (result.status !== 'success') {
            // Log but don't block redirect
          }
        }

        // Redirect to callback URL with failure status
        if (validatedRequest.callback) {
          const url = new URL(validatedRequest.callback)
          url.searchParams.set('status', 'failed')
          url.searchParams.set('error', error.message || 'Payment failed')
          url.searchParams.set('paymentId', paymentId)
          window.location.href = url.toString()
        }
      }
    } catch {
      // Still redirect to callback URL even if status update fails
      if (validatedRequest && validatedRequest.callback) {
        const url = new URL(validatedRequest.callback)
        url.searchParams.set('status', 'failed')
        url.searchParams.set('error', error.message || 'Payment failed')
        url.searchParams.set('paymentId', paymentId)
        window.location.href = url.toString()
      }
    } finally {
      setProcessingCallback(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:p-6">
        <div className="mx-auto max-w-md mt-12 sm:mt-20">
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center space-y-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto text-blue-500" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse"></div>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Setting up your payment...</h2>
                <p className="text-sm sm:text-base text-gray-600 px-4">Please wait while we prepare everything for you. This usually takes just a few seconds.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:p-6">
        <div className="mx-auto max-w-md mt-12 sm:mt-20">
          <Card className="shadow-lg border-red-200">
            <CardContent className="py-8 sm:py-12">
              <Alert variant="destructive" className="border-0 bg-red-50">
                <AlertDescription className="text-center space-y-3">
                  <div className="text-red-500 text-xl sm:text-2xl mb-2">😟</div>
                  <div className="font-semibold text-red-800 text-base sm:text-lg">Oops! Something went wrong</div>
                  <div className="text-sm sm:text-base text-red-700 leading-relaxed px-2">
                    {error.includes('Authentication') ?
                      'It looks like your payment link has expired or is invalid. Please request a new payment link from the app.' :
                      error.includes('not found') ?
                        'We couldn\'t find this payment. Please check your payment link or contact support.' :
                        'We\'re having trouble loading your payment. Please try refreshing the page or contact support if the problem continues.'}
                  </div>
                  <div className="text-xs text-red-600 mt-3 p-2 bg-red-100 rounded">
                    Error: {error}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state - render payment page
  if (paymentInfo && validatedRequest && config) {
    return (
      <>
        <PaymentPage
          paymentInfo={paymentInfo}
          irembopayPublicKey={config.irembopayPublicKey}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        {/* Processing Callback Overlay */}
        {processingCallback && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm mx-4 shadow-2xl">
              <CardContent className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-green-500" />
                    <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-pulse"></div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Processing your payment...</h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                    Please don't close this page. We're confirming your payment with our secure servers.
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    This usually takes less than 30 seconds
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    )
  }

  // Fallback
  return null
}
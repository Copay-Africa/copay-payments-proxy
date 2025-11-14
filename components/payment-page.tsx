'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Building, Calendar, DollarSign } from 'lucide-react'
import { PaymentInfo, IremboPayCallback } from '@/lib/validation'

// Declare IremboPay global
declare global {
  interface Window {
    IremboPay: {
      initiate: (config: {
        publicKey: string
        invoiceNumber: string
        locale: string
        callback: (error: unknown, response: unknown) => void
      }) => void
      closeModal: () => void
      locale: {
        EN: string
        FR: string
        RW: string
      }
    }
  }
}

interface PaymentPageProps {
  paymentInfo: PaymentInfo
  irembopayPublicKey: string
  onSuccess: (response: IremboPayCallback) => void
  onError: (error: IremboPayCallback) => void
}

export default function PaymentPage({
  paymentInfo,
  irembopayPublicKey,
  onSuccess,
  onError
}: PaymentPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [irembopayLoaded, setIrembopayLoaded] = useState(false)

  // Check if IremboPay script is loaded
  useEffect(() => {
    const checkIremboPay = () => {
      if (typeof window !== 'undefined' && window.IremboPay) {
        setIrembopayLoaded(true)
      }
    }

    // Check immediately
    checkIremboPay()

    // Check periodically in case script loads later
    const interval = setInterval(checkIremboPay, 100)

    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(interval), 10000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'PENDING':
        return 'default'
      case 'PROCESSING':
        return 'secondary'
      case 'COMPLETED':
        return 'default'
      case 'FAILED':
        return 'destructive'
      case 'CANCELLED':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const handlePayment = () => {
    if (!irembopayLoaded || !window.IremboPay) {
      setError('Payment system not loaded. Please refresh the page and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!irembopayPublicKey || irembopayPublicKey.trim().length === 0) {
        throw new Error('Public key is empty or undefined')
      }

      if (!paymentInfo.invoiceNumber || paymentInfo.invoiceNumber.trim().length === 0) {
        throw new Error('Invoice number is empty or undefined')
      }

      window.IremboPay.initiate({
        publicKey: irembopayPublicKey.trim(),
        invoiceNumber: paymentInfo.invoiceNumber.trim(),
        locale: window.IremboPay.locale.EN,
        callback: (err: unknown, resp: unknown) => {
          setIsLoading(false)

          if (err) {
            const errorObj = err as { message?: string; errors?: Array<{ code: string; detail: string }> }
            const errorCallback: IremboPayCallback = {
              success: false,
              message: errorObj.message || 'Payment failed',
              invoiceNumber: paymentInfo.invoiceNumber,
              errors: errorObj.errors || [{ code: 'PAYMENT_ERROR', detail: errorObj.message || 'Unknown error' }]
            }
            onError(errorCallback)

            // Provide more specific error messages
            if (errorObj.message === 'Public key is not valid') {
              setError('Invalid payment configuration. Please contact support.')
            } else if (errorObj.message?.includes('invoice') || errorObj.message?.includes('404')) {
              setError('Payment not found in the payment system. Please verify the payment details.')
            } else {
              setError(errorObj.message || 'Payment failed. Please try again.')
            }
          } else {
            const respObj = resp as { message?: string; transactionId?: string; amount?: number }
            const successCallback: IremboPayCallback = {
              success: true,
              message: respObj.message || 'Payment successful',
              transactionId: respObj.transactionId,
              invoiceNumber: paymentInfo.invoiceNumber,
              amount: respObj.amount
            }

            onSuccess(successCallback)
          }
        }
      })
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed'
      setError(errorMessage)
    }
  }

  const isDueOrExpired = paymentInfo.dueDate ? new Date(paymentInfo.dueDate) <= new Date() : false
  const canPay = paymentInfo.status === 'PENDING' && !isDueOrExpired

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Secure Payment</h1>
          <p className="text-sm sm:text-base text-gray-600">Complete your payment safely and securely</p>
        </div>

        {/* Payment Info Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="break-words">{paymentInfo.cooperative?.name || 'Payment Service'}</span>
              </CardTitle>
              <Badge variant={getStatusColor(paymentInfo.status)} className="self-start sm:self-center">
                {paymentInfo.status.charAt(0).toUpperCase() + paymentInfo.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            <CardDescription className="text-sm sm:text-base leading-relaxed">
              {paymentInfo.description || 'Service payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Amount - Prominent Display */}
            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200 text-center">
              <div className="text-sm text-green-700 font-medium mb-2">Total Amount</div>
              <div className="text-3xl sm:text-4xl font-bold text-green-800 flex items-center justify-center gap-2">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
                {formatCurrency(paymentInfo.amount)}
              </div>
            </div>

            {/* Payment Details - Mobile Friendly Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Invoice Number</span>
                  <p className="font-mono font-medium text-sm sm:text-base break-all">{paymentInfo.invoiceNumber}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Payment ID</span>
                  <p className="font-mono font-medium text-sm sm:text-base break-all">{paymentInfo.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Payment Type</span>
                  <p className="font-medium text-sm sm:text-base">{paymentInfo.paymentType?.name || 'Standard Payment'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Method</span>
                  <p className="font-medium text-sm sm:text-base">{paymentInfo.paymentMethod?.replace('_', ' ') || 'Online Payment'}</p>
                </div>
              </div>
            </div>

            {/* Due Date - Only show if exists */}
            {paymentInfo.dueDate && (
              <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium text-sm">Payment Due</span>
                </div>
                <p className="text-amber-800 font-semibold mt-1">{formatDate(paymentInfo.dueDate)}</p>
                <p className="text-xs text-amber-600 mt-1">Please complete your payment by this date</p>
              </div>
            )}

            {/* Sender Information - Only show if exists */}
            {paymentInfo.sender && (
              <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
                <p className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-2">Payment For</p>
                <p className="font-semibold text-blue-900">
                  {paymentInfo.sender.firstName} {paymentInfo.sender.lastName}
                </p>
                {paymentInfo.sender.phone && (
                  <p className="text-sm text-blue-700">{paymentInfo.sender.phone}</p>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold text-red-800 mb-1">Payment Error</div>
                    <div className="text-red-700 text-sm leading-relaxed">{error}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Expired Warning */}
            {isDueOrExpired && paymentInfo.dueDate && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="flex items-start gap-2">
                  <span className="text-lg">⏰</span>
                  <div>
                    <div className="font-semibold text-red-800">Payment Overdue</div>
                    <div className="text-red-700 text-sm">This payment was due on {formatDate(paymentInfo.dueDate)}. Please contact the organization for assistance.</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Status Alerts */}
            {paymentInfo.status === 'COMPLETED' && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="font-semibold text-green-800">Payment Complete</div>
                    <div className="text-green-700 text-sm">This payment has already been completed successfully.</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {paymentInfo.status === 'PROCESSING' && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="flex items-start gap-2">
                  <Loader2 className="h-4 w-4 animate-spin mt-1" />
                  <div>
                    <div className="font-semibold text-blue-800">Processing Payment</div>
                    <div className="text-blue-700 text-sm">Your payment is currently being processed. Please wait for confirmation.</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* IremboPay Loading */}
            {!irembopayLoaded && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-amber-800">Setting up secure payment system...</span>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Action */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Ready to Pay?</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                  Click the button below to be securely redirected to complete your payment
                </p>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!canPay || isLoading || !irembopayLoaded}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200 shadow-lg"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Setting up payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <span>Pay {formatCurrency(paymentInfo.amount)}</span>
                  </div>
                )}
              </Button>

              {!canPay && paymentInfo.status === 'PENDING' && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    🚫 Payment cannot be processed at this time
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please check the payment status or contact support
                  </p>
                </div>
              )}
              
              {/* Security & Trust Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                  <span>🔒</span>
                  <span>Your payment is protected with 256-bit encryption</span>
                </div>
                <div className="text-center text-xs text-gray-400">
                  Powered by IremboPay • Trusted by thousands of businesses
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
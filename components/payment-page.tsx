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

  const isDueOrExpired = new Date(paymentInfo.dueDate) <= new Date()
  const canPay = paymentInfo.status === 'PENDING' && !isDueOrExpired

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
          <p className="mt-2 text-gray-600">Co-Pay Payment Processing</p>
        </div>

        {/* Payment Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {paymentInfo.cooperative.name}
              </CardTitle>
              <Badge variant={getStatusColor(paymentInfo.status)}>
                {paymentInfo.status.charAt(0).toUpperCase() + paymentInfo.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            <CardDescription>{paymentInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="flex items-center justify-between py-4 border-t border-b">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(paymentInfo.amount)}
              </span>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Invoice Number</span>
                <p className="font-mono font-medium">{paymentInfo.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Payment ID</span>
                <p className="font-mono font-medium">{paymentInfo.id}</p>
              </div>
              <div>
                <span className="text-gray-600">Payment Type</span>
                <p className="font-medium">{paymentInfo.paymentType.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Method</span>
                <p className="font-medium">{paymentInfo.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Due date: {formatDate(paymentInfo.dueDate)}</span>
            </div>

            {/* Sender Information */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payment for:</p>
              <p className="font-medium">{paymentInfo.sender.firstName} {paymentInfo.sender.lastName}</p>
              <p className="text-sm text-gray-600">{paymentInfo.sender.phone}</p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Expired Warning */}
            {isDueOrExpired && (
              <Alert variant="destructive">
                <AlertDescription>
                  This payment is overdue. Please contact the organization for assistance.
                </AlertDescription>
              </Alert>
            )}

            {/* Already Completed */}
            {paymentInfo.status === 'COMPLETED' && (
              <Alert>
                <AlertDescription>
                  This payment has already been completed successfully.
                </AlertDescription>
              </Alert>
            )}

            {/* Processing */}
            {paymentInfo.status === 'PROCESSING' && (
              <Alert>
                <AlertDescription>
                  This payment is currently being processed. Please wait...
                </AlertDescription>
              </Alert>
            )}

            {/* IremboPay Not Loaded Warning */}
            {!irembopayLoaded && (
              <Alert variant="destructive">
                <AlertDescription>
                  Payment system is loading. Please wait...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Action */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Complete Your Payment</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You will be redirected to a secure payment portal
                </p>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!canPay || isLoading || !irembopayLoaded}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay {formatCurrency(paymentInfo.amount)}
                  </>
                )}
              </Button>

              {!canPay && paymentInfo.status === 'PENDING' && (
                <p className="text-center text-sm text-gray-500">
                  Payment cannot be processed at this time
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Powered by IremboPay • Secure Payment Processing</p>
        </div>
      </div>
    </div>
  )
}
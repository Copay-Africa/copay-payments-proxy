import { Suspense } from 'react'
import { Metadata } from 'next'
import PaymentClient from '../payment-client'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PaymentPageProps {
  params: Promise<{
    paymentId: string
  }>
  searchParams: Promise<{
    invoiceNumber?: string
    authToken?: string
    callback?: string
    locale?: string
  }>
}

// Generate metadata for the payment page
export async function generateMetadata({ params }: PaymentPageProps): Promise<Metadata> {
  const { paymentId } = await params
  
  return {
    title: `Payment ${paymentId} - Copay`,
    description: 'Secure payment processing powered by Copay and IremboPay',
    robots: 'noindex, nofollow', // Prevent indexing of payment pages
  }
}

// Loading component
function PaymentLoading() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-md mt-20">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <h2 className="text-lg font-semibold">Initializing Payment</h2>
              <p className="text-gray-600">Setting up secure payment processing...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { paymentId } = await params

  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentClient paymentId={paymentId} />
    </Suspense>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Smartphone, ExternalLink } from 'lucide-react'

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const [countdown, setCountdown] = useState(5)
    const [redirectStarted, setRedirectStarted] = useState(false)

    const transactionId = searchParams.get('transactionId')
    const paymentId = searchParams.get('paymentId')
    const callbackUrl = searchParams.get('callback')
    const useDeepLink = searchParams.get('deeplink') === 'true'

    useEffect(() => {
        if (!callbackUrl || redirectStarted) return

        const handleRedirect = () => {
            setRedirectStarted(true)

            if (useDeepLink) {
                // Deep link mode: Try to open the app via deep link
                const deepLinkUrl = `copay://payment/success?transactionId=${transactionId || ''}&paymentId=${paymentId || ''}`

                // Create a hidden link and click it
                const link = document.createElement('a')
                link.href = deepLinkUrl
                link.style.display = 'none'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Start countdown for fallback
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer)
                            // Fallback to callback URL if app doesn't open
                            window.location.href = callbackUrl
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                return () => clearInterval(timer)
            } else {
                // Normal callback mode: Direct redirect after short delay
                setCountdown(3) // Shorter countdown for normal redirects

                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer)
                            window.location.href = callbackUrl
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                return () => clearInterval(timer)
            }
        }

        // Use setTimeout to avoid direct setState in effect
        const initTimeout = setTimeout(handleRedirect, 100)
        return () => clearTimeout(initTimeout)
    }, [callbackUrl, redirectStarted, transactionId, paymentId, useDeepLink])

    const handleOpenApp = () => {
        const deepLinkUrl = `copay://payment/success?transactionId=${transactionId || ''}&paymentId=${paymentId || ''}`
        window.location.href = deepLinkUrl
    }

    const handleOpenWeb = () => {
        if (callbackUrl) {
            window.location.href = callbackUrl
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 p-4">
            <div className="mx-auto max-w-md mt-20">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">
                            Payment Successful!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {transactionId && (
                            <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm text-green-700 font-medium">
                                    Transaction ID: {transactionId}
                                </p>
                            </div>
                        )}

                        <div className="text-gray-600">
                            <p className="mb-2">Your payment has been processed successfully.</p>
                            {countdown > 0 ? (
                                <p className="text-sm">
                                    {useDeepLink
                                        ? `Opening Copay app automatically in ${countdown} seconds...`
                                        : `Redirecting you back in ${countdown} seconds...`
                                    }
                                </p>
                            ) : (
                                <p className="text-sm">
                                    {useDeepLink
                                        ? "If the app didn't open, use the buttons below."
                                        : "Redirecting..."
                                    }
                                </p>
                            )}
                        </div>

                        {useDeepLink && (
                            <div className="space-y-3">
                                <Button
                                    onClick={handleOpenApp}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    <Smartphone className="mr-2 h-5 w-5" />
                                    Open Copay App
                                </Button>

                                {callbackUrl && (
                                    <Button
                                        onClick={handleOpenWeb}
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <ExternalLink className="mr-2 h-5 w-5" />
                                        Continue in Browser
                                    </Button>
                                )}
                            </div>
                        )}

                        {useDeepLink && (
                            <div className="text-xs text-gray-500 mt-4">
                                <p>If you&rsquo;re having trouble opening the app, make sure Copay is installed on your device.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
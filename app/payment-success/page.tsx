'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Smartphone, ExternalLink, Loader2 } from 'lucide-react'

function PaymentSuccessContent() {
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
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 px-4 py-6">
            <div className="mx-auto max-w-md mt-12 sm:mt-20">
                <Card className="text-center shadow-xl border-green-200">
                    <CardHeader className="pb-4">
                        <div className="mx-auto mb-4">
                            <div className="relative">
                                <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 mx-auto" />
                                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20"></div>
                            </div>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700">
                            🎉 Payment Successful!
                        </CardTitle>
                        <div className="text-sm sm:text-base text-green-600 mt-2 px-2">
                            Your payment has been processed successfully
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                        {transactionId && (
                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                                <div className="text-xs uppercase tracking-wide text-green-600 font-medium mb-1">
                                    Transaction Reference
                                </div>
                                <p className="text-sm sm:text-base text-green-800 font-mono font-semibold break-all">
                                    {transactionId}
                                </p>
                            </div>
                        )}

                        <div className="text-gray-600 space-y-2">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-700">Transaction Complete</span>
                            </div>
                            
                            {countdown > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm sm:text-base leading-relaxed">
                                        {useDeepLink 
                                            ? `📱 Opening the Copay app automatically in ${countdown} seconds...`
                                            : `🔄 Taking you back in ${countdown} seconds...`
                                        }
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm sm:text-base">
                                    {useDeepLink
                                        ? "📱 If the app didn't open automatically, use the buttons below."
                                        : "🔄 Redirecting you now..."
                                    }
                                </p>
                            )}
                        </div>

                        {useDeepLink && (
                            <div className="space-y-3 sm:space-y-4">
                                <Button
                                    onClick={handleOpenApp}
                                    className="w-full h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg"
                                    size="lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
                                        <span className="text-base sm:text-lg font-semibold">Open Copay App</span>
                                    </div>
                                </Button>

                                {callbackUrl && (
                                    <Button
                                        onClick={handleOpenWeb}
                                        variant="outline"
                                        className="w-full h-12 sm:h-14 border-2 hover:bg-gray-50 transition-all duration-200"
                                        size="lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6" />
                                            <span className="text-base sm:text-lg font-semibold">Continue in Browser</span>
                                        </div>
                                    </Button>
                                )}
                            </div>
                        )}

                        {useDeepLink && (
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mt-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-500 text-sm">ℹ️</span>
                                    <div className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                                        <strong>Need help?</strong> Make sure the Copay app is installed on your device. 
                                        If you're having trouble, you can always continue in your web browser.
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 px-4 py-6">
            <div className="mx-auto max-w-md mt-16 sm:mt-20">
                <Card className="text-center shadow-lg">
                    <CardContent className="flex items-center justify-center py-8 sm:py-12">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto text-green-500" />
                                <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-pulse"></div>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-green-700">Loading Payment Success</h2>
                            <p className="text-sm sm:text-base text-gray-600">Please wait while we prepare your success page...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    )
}
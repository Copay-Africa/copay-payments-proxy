import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CreditCard, Globe, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 pt-8 sm:pt-16">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Welcome to Copay Payments
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
            Fast, secure, and reliable payment processing for your business. 
            Accept payments from customers across Rwanda with ease.
          </p>
          <Badge variant="default" className="text-xs sm:text-sm px-3 py-1">
            ✨ Trusted & Secure
          </Badge>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                Bank-Level Security
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your payments are protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li>🔐 Advanced encryption</li>
                <li>🛡️ Fraud protection</li>
                <li>⚡ Real-time monitoring</li>
                <li>🔒 Secure data handling</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Pay Your Way
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Choose from popular payment methods in Rwanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li>📱 MTN Mobile Money</li>
                <li>📲 Airtel Money</li>
                <li>💳 Visa & MasterCard</li>
                <li>💎 American Express</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                Works Everywhere
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Access payments from any device, anywhere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li>📱 Mobile apps</li>
                <li>💻 Web browsers</li>
                <li>☎️ USSD (*182*8#)</li>
                <li>🔌 API integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                Fully Compliant
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Meets international security and privacy standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li>🏆 PCI DSS certified</li>
                <li>🌍 GDPR compliant</li>
                <li>📋 Full audit trails</li>
                <li>🔐 End-to-end encryption</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* API Usage */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">For Developers</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Simple API integration for your applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto">
              <code className="text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                {`GET /pay/{paymentId}?invoiceNumber={invoice}&authToken={token}&callback={url}`}
              </code>
            </div>
            <div className="mt-4 space-y-3 text-sm sm:text-base text-gray-600">
              <p className="font-semibold text-gray-800">What you need:</p>
              <div className="grid gap-2 sm:gap-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">paymentId</code>
                  <span className="text-sm">Your unique payment ID</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">authToken</code>
                  <span className="text-sm">Secure authentication token</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">callback</code>
                  <span className="text-sm">Where to redirect after payment</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-500 pb-6 sm:pb-8 pt-4">
          <p className="leading-relaxed">
            Copay Payment Proxy v1.0<br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            Built with ❤️ using Next.js & IremboPay
          </p>
        </div>
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CreditCard, Globe, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-4xl space-y-8 pt-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Copay Payment Proxy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure payment processing service for the Copay platform, powered by IremboPay
          </p>
          <Badge variant="default" className="text-sm">
            Production Ready
          </Badge>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Secure Processing
              </CardTitle>
              <CardDescription>
                End-to-end encryption with JWT/HMAC authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• JWT token authentication</li>
                <li>• HMAC signature validation</li>
                <li>• Rate limiting protection</li>
                <li>• XSS and CSRF protection</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Payment Options
              </CardTitle>
              <CardDescription>
                Multiple payment methods through IremboPay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• MTN Mobile Money</li>
                <li>• Airtel Money</li>
                <li>• Visa & MasterCard</li>
                <li>• American Express</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Multi-Platform
              </CardTitle>
              <CardDescription>
                Compatible with all Copay client platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Flutter mobile apps</li>
                <li>• Web applications</li>
                <li>• USSD integration</li>
                <li>• API endpoints</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Compliance
              </CardTitle>
              <CardDescription>
                Built with security and compliance in mind
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• PCI DSS compliant</li>
                <li>• GDPR ready</li>
                <li>• Audit logging</li>
                <li>• Data encryption</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>
              How to integrate with the Copay Payment Proxy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <code className="text-sm">
                {`GET /pay/{paymentId}?invoiceNumber={invoice}&authToken={token}&callback={url}`}
              </code>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><strong>Required Parameters:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• <code>paymentId</code> - Unique payment identifier</li>
                <li>• <code>invoiceNumber</code> - IremboPay invoice number</li>
                <li>• <code>authToken</code> - JWT authentication token</li>
                <li>• <code>callback</code> - URL to redirect after payment</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>
            Copay Payment Proxy v1.0 • Built with Next.js & IremboPay
          </p>
        </div>
      </div>
    </div>
  )
}

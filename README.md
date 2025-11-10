# Co-Pay Payment Proxy

A secure, hosted payment proxy service for the Co-Pay platform using Next.js (App Router) and shadcn/ui. This service handles the payment flow between the Co-Pay backend and IremboPay, providing a web-hosted checkout page that Flutter, Web, and USSD users can all redirect to for secure payment processing.

## 🚀 Features

### Core Features
- **Dynamic Payment Pages**: `/pay/[paymentId]` route for secure payment processing
- **IremboPay Integration**: Full integration with IremboPay JavaScript widget
- **Multi-Platform Support**: Compatible with Flutter, Web, and USSD applications
- **Real-time Validation**: Parameter sanitization and validation for security

### Security Features
- **JWT Authentication**: Secure communication with Co-Pay backend
- **HMAC Signatures**: Alternative authentication method using HMAC
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **CSP Headers**: Content Security Policy for XSS protection
- **Request Validation**: Comprehensive input validation and sanitization

### Payment Features
- **MTN Mobile Money**: Native mobile money integration
- **Airtel Money**: Support for Airtel mobile payments
- **Card Payments**: Visa, MasterCard, and American Express
- **Real-time Status**: Live payment status updates and callbacks

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- IremboPay account and API keys
- Co-Pay backend URL and authentication secrets

### Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd copay-payment-proxy
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env.local
```

3. **Update environment variables** in `.env.local`:
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ISSUER=copay-payment-proxy
JWT_AUDIENCE=copay-backend

# HMAC Configuration (alternative to JWT)
HMAC_SECRET=your-super-secret-hmac-key-change-this-in-production

# IremboPay Configuration
IREMBOPAY_PUBLIC_KEY=your-irembopay-public-key
NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY=your-irembopay-public-key

# Co-Pay Backend Configuration
COPAY_BACKEND_URL=https://api.copay.example.com
```

4. **Start development server**:
```bash
npm run dev
```

## 📖 API Documentation

### Payment Page Endpoint

**URL**: `/pay/[paymentId]`

**Method**: `GET`

**Required Query Parameters**:
- `invoiceNumber`: IremboPay invoice number
- `authToken`: JWT authentication token from Co-Pay backend
- `callback`: URL to redirect after payment completion

**Optional Parameters**:
- `locale`: Payment page language (`en`, `fr`, `rw`) - defaults to `en`

**Example**:
```
GET /pay/12345?invoiceNumber=INV001&authToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...&callback=https://app.copay.com/payment-success
```

### Authentication

The service supports two authentication methods:

#### 1. JWT Authentication (Recommended)
```javascript
// Co-Pay backend generates JWT token
const token = jwt.sign({
  sub: 'user-id',
  organizationId: 'org-123',
  permissions: ['payment:read']
}, JWT_SECRET)
```

#### 2. HMAC Signatures
```javascript
// Generate HMAC signature
const signature = hmac('sha256', HMAC_SECRET)
  .update(`${method}|${url}|${body}|${timestamp}`)
  .digest('hex')
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT token validation |
| `HMAC_SECRET` | Yes | Secret key for HMAC signature validation |
| `IREMBOPAY_PUBLIC_KEY` | Yes | Public key from IremboPay dashboard |
| `NEXT_PUBLIC_IREMBOPAY_PUBLIC_KEY` | Yes | Public key for client-side IremboPay widget |
| `COPAY_BACKEND_URL` | Yes | Base URL of Co-Pay backend API |
| `COPAY_BACKEND_TIMEOUT` | No | API request timeout (default: 30000ms) |

### Security Headers

The service automatically applies security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Restricted to allow only necessary resources

### Rate Limiting

- **Payment pages**: 30 requests per minute per IP
- **General requests**: 60 requests per minute per IP

## 🔄 Payment Flow

1. **User Initiation**: User initiates payment on Co-Pay application
2. **Token Generation**: Co-Pay backend generates JWT token with payment details
3. **Redirect**: User redirected to payment proxy with payment ID and parameters
4. **Validation**: Payment proxy validates token and fetches payment info
5. **Payment Page**: Secure payment page displayed with IremboPay widget
6. **Payment Processing**: User completes payment through IremboPay
7. **Status Update**: Payment status updated in Co-Pay backend
8. **Callback**: User redirected back to Co-Pay application

## 🛡️ Security Considerations

### Authentication
- All requests to Co-Pay backend include JWT tokens or HMAC signatures
- Tokens have short expiration times (15 minutes)
- Payment IDs and invoice numbers must match exactly

### Input Validation
- All query parameters are sanitized
- Payment amounts and currencies validated
- Organization access controls enforced

### Rate Limiting
- Per-IP rate limiting prevents abuse
- Configurable limits for different endpoints

### Content Security Policy
- Restricts script execution to trusted sources
- Prevents XSS attacks and code injection
- Allows only necessary external resources

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Configuration

Ensure production environment variables are set:
```bash
NODE_ENV=production
JWT_SECRET=<strong-production-secret>
HMAC_SECRET=<strong-production-secret>
IREMBOPAY_PUBLIC_KEY=<production-public-key>
COPAY_BACKEND_URL=<production-backend-url>
```

## 🧪 Testing

### Development Testing

1. Start the development server:
```bash
npm run dev
```

2. Create a test payment URL:
```
http://localhost:3000/pay/test-payment-123?invoiceNumber=INV001&authToken=test-token&callback=http://localhost:3000
```

## 📝 Error Handling

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing Parameter | Required query parameter missing |
| 401 | Authentication Failed | Invalid or expired JWT token |
| 403 | Access Denied | Insufficient permissions |
| 404 | Payment Not Found | Payment ID not found in backend |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Backend communication failure |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the Co-Pay development team

---

**Built with ❤️ by the Co-Pay Team**

http://localhost:4000/pay/6911a7fecd4b2ef2f5dd58e7?invoiceNumber=881110978366&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGYwY2M4YWRjZWI1ZTE2ZDU3YzkzOGIiLCJwaG9uZSI6IisyNTA3ODgxMTEyMjQiLCJyb2xlIjoiVEVOQU5UIiwiY29vcGVyYXRpdmVJZCI6IjY4ZjBjYjRiZGNlYjVlMTZkNTdjOTM4OSIsImlhdCI6MTc2MjY5NDI1NiwiZXhwIjoxNzYzMjk5MDU2fQ.CYlYawUjhewT2J_LZryu48sUB_fPY9LLoPe1G5xMbeo&callback=http://localhost:4000
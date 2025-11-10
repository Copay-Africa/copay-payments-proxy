import { z } from "zod";

// Validation schemas
export const PaymentIdSchema = z
  .string()
  .min(1, "Payment ID is required")
  .max(100, "Payment ID too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Payment ID contains invalid characters");

export const InvoiceNumberSchema = z
  .string()
  .min(1, "Invoice number is required")
  .max(100, "Invoice number too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invoice number contains invalid characters");

export const AuthTokenSchema = z
  .string()
  .min(1, "Auth token is required")
  .max(1000, "Auth token too long");

export const CallbackUrlSchema = z
  .string()
  .url("Invalid callback URL")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Callback URL must use HTTP or HTTPS");

// Payment request validation schema
export const PaymentRequestSchema = z.object({
  invoiceNumber: InvoiceNumberSchema,
  authToken: AuthTokenSchema,
  callback: CallbackUrlSchema,
  locale: z.enum(["en", "fr", "rw"]).optional().default("en"),
});

// Payment info from Co-Pay backend
export const PaymentInfoSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]),
  description: z.string(),
  dueDate: z.string().datetime(),
  paymentType: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  }),
  paymentMethod: z.enum([
    "MOBILE_MONEY_MTN",
    "MOBILE_MONEY_AIRTEL",
    "CARD",
    "BANK_TRANSFER",
  ]),
  paymentReference: z.string(),
  invoiceNumber: z.string(),
  sender: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
  }),
  cooperative: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }),
  paidAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// IremboPay callback response
export const IremboPayCallbackSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  transactionId: z.string().optional(),
  invoiceNumber: z.string(),
  amount: z.number().optional(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        detail: z.string(),
      })
    )
    .optional(),
});

// Types
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;
export type IremboPayCallback = z.infer<typeof IremboPayCallbackSchema>;

/**
 * Sanitize and validate payment request parameters
 */
export function validatePaymentRequest(data: unknown): PaymentRequest {
  return PaymentRequestSchema.parse(data);
}

/**
 * Sanitize URL parameters to prevent XSS and injection attacks
 */
export function sanitizeParams(
  params: Record<string, unknown>
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      // Remove potentially dangerous characters
      const cleaned = value
        .replace(/[<>"/\\&]/g, "") // Remove HTML/script characters
        .replace(/[^\w\-@.:/?=&]/g, "") // Allow only safe URL characters
        .trim()
        .slice(0, 500); // Limit length

      if (cleaned.length > 0) {
        sanitized[key] = cleaned;
      }
    }
  }

  return sanitized;
}

/**
 * Validate organization access for payment
 */
export function validateOrganizationAccess(
  paymentInfo: PaymentInfo,
  organizationId?: string
): boolean {
  if (!organizationId) {
    return false;
  }

  return paymentInfo.cooperative.id === organizationId;
}

/**
 * Check if payment is still valid for processing
 */
export function isPaymentValid(paymentInfo: PaymentInfo): {
  valid: boolean;
  reason?: string;
} {
  if (paymentInfo.status === "COMPLETED") {
    return { valid: false, reason: "Payment has already been completed" };
  }

  if (paymentInfo.status === "CANCELLED") {
    return { valid: false, reason: "Payment has been cancelled" };
  }

  if (paymentInfo.status === "FAILED") {
    return { valid: false, reason: "Payment has failed" };
  }

  if (paymentInfo.status === "PROCESSING") {
    return { valid: false, reason: "Payment is currently being processed" };
  }

  const dueDate = new Date(paymentInfo.dueDate);
  const now = new Date();

  if (dueDate <= now) {
    return { valid: false, reason: "Payment has expired" };
  }

  return { valid: true };
}

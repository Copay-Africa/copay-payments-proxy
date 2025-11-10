import { createAuthHeaders, createHMACHeaders } from "./auth";
import { PaymentInfo, PaymentInfoSchema } from "./validation";

const COPAY_BACKEND_URL = process.env.COPAY_BACKEND_URL || "";

const COPAY_BACKEND_TIMEOUT = parseInt(
  process.env.COPAY_BACKEND_TIMEOUT || "30000"
);

function validateBackendUrl() {
  if (!COPAY_BACKEND_URL) {
    throw new Error("COPAY_BACKEND_URL environment variable is required");
  }
  return COPAY_BACKEND_URL;
}

export class CopayApiError extends Error {
  public code?: string;
  public status: number;

  constructor(options: { message: string; code?: string; status: number }) {
    super(options.message);
    this.name = "CopayApiError";
    this.code = options.code;
    this.status = options.status;
  }
}

export class CopayApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout: number = COPAY_BACKEND_TIMEOUT) {
    const url = baseUrl || validateBackendUrl();
    this.baseUrl = url.replace(/\/$/, "");
    this.timeout = timeout;
  }

  /**
   * Fetch payment information by payment ID
   */
  async getPaymentInfo(
    paymentId: string,
    authToken?: string
  ): Promise<PaymentInfo> {
    const url = `${this.baseUrl}/payments/${encodeURIComponent(paymentId)}`;

    try {
      const headers = authToken
        ? createAuthHeaders(authToken)
        : createHMACHeaders("GET", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new CopayApiError({
          message: errorText || "Failed to fetch payment information",
          status: response.status,
        });
      }

      const data = await response.json();

      // Validate the response against our schema
      return PaymentInfoSchema.parse(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new CopayApiError({
            message: "Request timeout",
            code: "TIMEOUT",
            status: 408,
          });
        }

        if (error.constructor.name === "ZodError") {
          throw new CopayApiError({
            message: "Invalid payment data received from backend",
            code: "INVALID_DATA",
            status: 502,
          });
        }
      }

      if (error instanceof CopayApiError) {
        throw error;
      }

      throw new CopayApiError({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "NETWORK_ERROR",
        status: 500,
      });
    }
  }

  /**
   * Update payment status (e.g., mark as processing, completed, or failed)
   */
  async updatePaymentStatus(
    paymentId: string,
    status: "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED",
    transactionId?: string,
    authToken?: string,
    failureReason?: string,
    gatewayData?: Record<string, unknown>
  ): Promise<void> {
    const url = `${this.baseUrl}/payments/callback/${encodeURIComponent(
      paymentId
    )}/status`;
    const body = JSON.stringify({
      status,
      transactionId,
      failureReason,
      gatewayData,
      updatedAt: new Date().toISOString(),
    });

    try {
      const headers = authToken
        ? createAuthHeaders(authToken)
        : createHMACHeaders("POST", url, body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new CopayApiError({
          message: errorText || "Failed to update payment status",
          status: response.status,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new CopayApiError({
            message: "Request timeout",
            code: "TIMEOUT",
            status: 408,
          });
        }
      }

      if (error instanceof CopayApiError) {
        throw error;
      }

      throw new CopayApiError({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "NETWORK_ERROR",
        status: 500,
      });
    }
  }

  /**
   * Validate that the payment proxy has access to the specified organization
   */
  async validateOrganizationAccess(
    organizationId: string,
    authToken?: string
  ): Promise<boolean> {
    const url = `${this.baseUrl}/organizations/${encodeURIComponent(
      organizationId
    )}/access`;

    try {
      const headers = authToken
        ? createAuthHeaders(authToken)
        : createHMACHeaders("GET", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.error("Organization access validation failed:", error);
      return false;
    }
  }
}

// Export a function to get the default instance
let defaultInstance: CopayApiClient | null = null;

export function getCopayApi(): CopayApiClient {
  if (!defaultInstance) {
    defaultInstance = new CopayApiClient();
  }
  return defaultInstance;
}

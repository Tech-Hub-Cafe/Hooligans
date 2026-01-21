"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { getItemTypeFromCategory } from "@/lib/itemCategory";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<Payments>;
    };
  }
}

interface Payments {
  card: (options?: { postalCode?: boolean | string }) => Promise<Card>;
  applePay: (options?: ApplePayOptions) => Promise<ApplePay>;
  googlePay: (options?: GooglePayOptions) => Promise<GooglePay>;
}

interface ApplePayOptions {
  countryCode: string;
  currencyCode: string;
}

interface GooglePayOptions {
  countryCode: string;
  currencyCode: string;
}

interface Card {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

interface ApplePay {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

interface GooglePay {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

interface TokenResult {
  status: string;
  token?: string;
  errors?: Array<{ message: string }>;
}

interface SquarePaymentFormProps {
  amount: number;
  onPaymentSuccess: (token: string) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  cartItems?: Array<{ category?: string; name: string }>; // Optional: for validating ordering time by item type
}

export default function SquarePaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing,
  cartItems = [],
}: SquarePaymentFormProps) {
  const cardRef = useRef<Card | null>(null);
  const applePayRef = useRef<ApplePay | null>(null);
  const googlePayRef = useRef<GooglePay | null>(null);
  const isInitializingRef = useRef(false); // Prevent duplicate initializations
  const initializedRef = useRef(false); // Track if already initialized
  const isMountedRef = useRef(true); // Track if component is mounted
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track retry timeout

  // Create a unique ID for this instance to prevent collisions
  const containerId = useRef(`card-container-${Math.random().toString(36).substring(2, 9)}`).current;

  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  // const [postalCodeRequired, setPostalCodeRequired] = useState(false); // Deprecated: forcing postalCode: false

  // Logging utility
  const log = {
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SquarePayment] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      console.log(`[SquarePayment] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[SquarePayment] ${message}`, ...args);
    },
    error: (message: string, error?: any) => {
      console.error(`[SquarePayment] ${message}`, error || '');
    },
  };

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  // Check if Square is configured
  const isSquareConfigured = !!(appId && locationId);

  // Determine Square environment for SDK URL
  const getSquareSDKUrl = () => {
    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
    if (env === 'production') {
      return "https://web.squarecdn.com/v1/square.js";
    }
    return "https://sandbox.web.squarecdn.com/v1/square.js";
  };

  // Set mounted flag on mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load Square SDK
  useEffect(() => {
    if (!isSquareConfigured) {
      setCardReady(true);
      return;
    }

    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.');
      const isSecure = window.location.protocol === 'https:';

      if (!isSecure && !isLocalhost) {
        setError("Payment forms require a secure connection (HTTPS). Please access this page over HTTPS.");
        log.warn("Page is not served over HTTPS. Payment forms may not work correctly.");
      }
    }

    const script = document.createElement("script");
    script.src = getSquareSDKUrl();
    script.onload = () => {
      if (isMountedRef.current) {
        setIsSquareLoaded(true);
      }
    };
    script.onerror = () => {
      if (isMountedRef.current) {
        setError("Failed to load payment system. Please ensure you're using HTTPS.");
        onPaymentError("Failed to load payment system");
      }
    };
    document.body.appendChild(script);

    return () => {
      isMountedRef.current = false;
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      // Cleanup payment methods
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch (e) {
          log.warn("Error destroying card:", e);
        }
        cardRef.current = null;
      }
      if (applePayRef.current) {
        try {
          applePayRef.current.destroy();
        } catch (e) {
          log.warn("Error destroying Apple Pay:", e);
        }
        applePayRef.current = null;
      }
      if (googlePayRef.current) {
        try {
          googlePayRef.current.destroy();
        } catch (e) {
          log.warn("Error destroying Google Pay:", e);
        }
        googlePayRef.current = null;
      }
      // Cleanup script
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      // Reset states
      setIsSquareLoaded(false);
      setCardReady(false);
      setApplePayReady(false);
      setGooglePayReady(false);
      initializedRef.current = false;
      isInitializingRef.current = false;
    };
  }, [isSquareConfigured, onPaymentError]);

  // Fetch location country on mount
  useEffect(() => {
    if (!locationId) return;

    async function fetchLocationCountry() {
      try {
        const response = await fetch("/api/square/location");
        if (response.ok) {
          const data = await response.json();
          const country = data.location?.country;
          setLocationCountry(country || null);

          // Countries that require postal codes
          const requiresPostalCode = ['US', 'CA', 'GB', 'MX'];
          // setPostalCodeRequired(requiresPostalCode.includes(country));

          log.debug("Location country:", country);
        }
      } catch (err) {
        log.error("Failed to fetch location country", err);
        // Continue without country info
      }
    }

    fetchLocationCountry();
  }, [locationId]);

  // Initialize payment methods
  useEffect(() => {
    if (!isSquareLoaded || !window.Square || !appId || !locationId) return;
    if (!isSquareConfigured) return; // Don't initialize if Square is not configured

    // Prevent multiple initializations (but this ref alone isn't enough for Strict Mode race conditions)
    if (initializedRef.current || isInitializingRef.current) {
      log.debug("Payment methods already initialized or initializing, skipping...");
      return;
    }

    // Check if card container already has Square's form attached
    const existingContainer = document.getElementById(containerId);
    if (existingContainer?.querySelector('.sq-card-input')) {
      log.debug("Card form already exists in DOM, skipping initialization");
      setCardReady(true);
      initializedRef.current = true;
      return;
    }

    let isCancelled = false;
    isInitializingRef.current = true;

    async function initializePayments() {
      try {
        log.info("Initializing payment methods...");

        // Wait for card container to be available
        // Update waitForCardContainer to use the unique ID
        const waitForContainer = async (maxRetries = 10, delay = 200): Promise<HTMLElement | null> => {
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (isCancelled) return null;
            const container = document.getElementById(containerId);
            if (container) return container;
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          return null;
        };

        const cardContainer = await waitForContainer();

        if (isCancelled) {
          log.debug("Initialization cancelled");
          isInitializingRef.current = false;
          return;
        }

        if (!cardContainer) {
          if (!isMountedRef.current) {
            log.debug("Component unmounted during initialization, aborting");
            isInitializingRef.current = false;
            return;
          }
          log.error("Card container not found after retries");
          setError("Payment form is not ready. Please refresh the page if this persists.");
          isInitializingRef.current = false;
          return;
        }

        const payments = await window.Square!.payments(appId!, locationId!);
        if (isCancelled) return;

        log.debug("Payments instance created");

        // Initialize Card Payment
        try {
          // Clear any existing content in card container
          cardContainer.innerHTML = ''; // Clear any duplicate forms

          let card;

          // Determine if we are in Sandbox
          const isSandbox = appId?.startsWith('sandbox');

          if (isSandbox) {
            // SANDBOX: Use default settings (often requires postal code)
            log.debug("Sandbox detected - enabling default fields (including postal code) for testing.");
            card = await payments.card();
          } else {
            // PRODUCTION: For Australia, force disable postal code
            if (locationCountry === 'AU') {
              try {
                card = await payments.card({
                  postalCode: false // Force disable for AU Production
                });
                if (isCancelled) return;
                log.debug("Production (AU): Card created with postalCode: false");
              } catch (e) {
                log.warn("Failed to force disable postal code in production:", e);
                card = await payments.card();
              }
            } else {
              // Production non-AU: Default behavior
              card = await payments.card();
            }
          }

          if (isCancelled) {
            if (card) await card.destroy();
            return;
          }

          // Double-check container still exists before attaching (component might have unmounted)
          const finalContainer = document.getElementById(containerId);
          if (!finalContainer) {
            log.error("Card container disappeared before attach");
            setError("Payment form container is not available. Please refresh the page.");
            isInitializingRef.current = false;
            return;
          }

          await card.attach(`#${containerId}`);

          if (isCancelled) {
            await card.destroy();
            return;
          }

          cardRef.current = card;
          setCardReady(true);
          initializedRef.current = true;
          isInitializingRef.current = false;
          log.info("Card form ready");
        } catch (cardError: any) {
          log.error("Failed to initialize card", cardError);
          // Don't show error to user if component is unmounted (likely due to ordering time)
          if (!isCancelled && isMountedRef.current) {
            setError(`Failed to initialize card form: ${cardError.message || "Unknown error"}`);
          }
          isInitializingRef.current = false;
        }

        // Initialize Apple Pay
        // (Similar checks for isCancelled)
        try {
          if (isCancelled) return;
          const applePay = await payments.applePay({
            countryCode: "AU", // Australia
            currencyCode: "AUD",
          });

          // Check if Apple Pay is available
          const applePayAvailable = await (applePay as any).canTokenize();
          if (applePayAvailable) {
            if (isCancelled) {
              await applePay.destroy();
              return;
            }
            await applePay.attach("#apple-pay-button");
            applePayRef.current = applePay;
            setApplePayReady(true);
            log.debug("Apple Pay ready");
          } else {
            log.debug("Apple Pay not available on this device");
          }
        } catch (applePayError: any) {
          log.debug("Apple Pay initialization failed (may not be available):", applePayError.message);
          // Apple Pay might not be available - that's okay
        }

        // Initialize Google Pay
        try {
          if (isCancelled) return;
          const googlePay = await payments.googlePay({
            countryCode: "AU", // Australia
            currencyCode: "AUD",
          });

          // Check if Google Pay is available
          const googlePayAvailable = await (googlePay as any).canTokenize();
          if (googlePayAvailable) {
            if (isCancelled) {
              await googlePay.destroy();
              return;
            }
            await googlePay.attach("#google-pay-button");
            googlePayRef.current = googlePay;
            setGooglePayReady(true);
            log.debug("Google Pay ready");
          } else {
            log.debug("Google Pay not available on this device");
          }
        } catch (googlePayError: any) {
          log.debug("Google Pay initialization failed (may not be available):", googlePayError.message);
          // Google Pay might not be available - that's okay
        }

      } catch (e: any) {
        if (isCancelled) return;
        log.error("Failed to initialize payments", {
          error: e,
          message: e?.message,
          stack: e?.stack,
        });
        // Only show error if component is still mounted
        if (isMountedRef.current) {
          const errorMessage = e?.message || e?.toString() || "Unknown error";
          setError(`Failed to initialize payment form: ${errorMessage}`);
          onPaymentError(`Payment form initialization failed: ${errorMessage}`);
        }
        isInitializingRef.current = false;
      }
    }

    initializePayments();

    // Cleanup function
    return () => {
      isCancelled = true;
      isInitializingRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [isSquareLoaded, appId, locationId, isSquareConfigured, locationCountry]);

  // Check ordering availability
  const { data: orderingStatus } = useQuery({
    queryKey: ["ordering-availability"],
    queryFn: async () => {
      const res = await fetch("/api/ordering-time");
      if (!res.ok) throw new Error("Failed to fetch ordering status");
      return res.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const handlePayment = async (paymentMethod: 'card' | 'applePay' | 'googlePay' = 'card') => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check if ordering is available for each item type
      if (orderingStatus && cartItems.length > 0) {
        const unavailableTypes: string[] = [];

        // Check each item's type
        for (const item of cartItems) {
          const itemType = getItemTypeFromCategory(item.category || "");
          const status = itemType === "drinks" ? orderingStatus.drinks : orderingStatus.food;

          if (status && !status.isOrderingAvailable) {
            if (!unavailableTypes.includes(itemType)) {
              unavailableTypes.push(itemType);
            }
          }
        }

        if (unavailableTypes.length > 0) {
          const errorMsg = unavailableTypes.includes("food") && unavailableTypes.includes("drinks")
            ? "Food and drinks ordering is currently closed"
            : unavailableTypes.includes("food")
              ? orderingStatus.food?.message || "Food ordering is currently closed"
              : orderingStatus.drinks?.message || "Drinks ordering is currently closed";

          setError(errorMsg);
          onPaymentError(errorMsg);
          setIsProcessing(false);
          return;
        }
      } else if (orderingStatus && (!orderingStatus.food?.isOrderingAvailable || !orderingStatus.drinks?.isOrderingAvailable)) {
        // Fallback: check general availability if no items provided
        const errorMsg = !orderingStatus.food?.isOrderingAvailable && !orderingStatus.drinks?.isOrderingAvailable
          ? "Ordering is currently closed"
          : !orderingStatus.food?.isOrderingAvailable
            ? orderingStatus.food?.message || "Food ordering is currently closed"
            : orderingStatus.drinks?.message || "Drinks ordering is currently closed";

        setError(errorMsg);
        onPaymentError(errorMsg);
        setIsProcessing(false);
        return;
      }

      if (!isSquareConfigured) {
        onPaymentSuccess("demo_token");
        return;
      }

      let result: TokenResult;

      if (paymentMethod === 'applePay' && applePayRef.current) {
        result = await applePayRef.current.tokenize();
      } else if (paymentMethod === 'googlePay' && googlePayRef.current) {
        result = await googlePayRef.current.tokenize();
      } else if (cardRef.current) {
        result = await cardRef.current.tokenize();
      } else {
        throw new Error("Payment method not ready");
      }

      if (result.status === "OK" && result.token) {
        onPaymentSuccess(result.token);
      } else {
        const errorMessage = result.errors?.[0]?.message || "Payment failed";

        // Handle postal code validation error specifically
        const isSandbox = appId?.startsWith('sandbox');

        if (errorMessage.toLowerCase().includes("postal code") || errorMessage.toLowerCase().includes("zip code")) {
          // In Sandbox, just show the raw error to be helpful for debugging
          if (isSandbox) {
            setError(errorMessage);
            onPaymentError(errorMessage);
          } else {
            // Production logic for AU
            const postalCodeError = locationCountry === 'AU'
              ? "Postal code validation failed. Your Square location may need to be set to Australia in Square Dashboard."
              : `Postal code validation failed. Please enter a valid postal code for ${locationCountry || 'your location'}.`;
            setError(postalCodeError);
            onPaymentError(postalCodeError);
          }
        } else {
          setError(errorMessage);
          onPaymentError(errorMessage);
        }
        setIsProcessing(false);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Payment failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Apple Pay Button */}
      {applePayReady && (
        <div className="space-y-2">
          <div id="apple-pay-button" className="min-h-[48px]" />
        </div>
      )}

      {/* Google Pay Button */}
      {googlePayReady && (
        <div className="space-y-2">
          <div id="google-pay-button" className="min-h-[48px]" />
        </div>
      )}

      {/* Divider if digital wallets are available */}
      {(applePayReady || googlePayReady) && (
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>
      )}

      {/* Card Input Container */}
      {isSquareConfigured ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Card Details</label>
          <div
            id={containerId}
            className="min-h-[50px] p-3 border rounded-lg bg-white"
          />
          {!cardReady && !error && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading payment form...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> Square payment is not configured.
            Orders will be placed without real payment processing.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="button"
        onClick={() => handlePayment('card')}
        disabled={isProcessing || (!cardReady && isSquareConfigured)}
        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-6 text-lg"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>Secured by Square</span>
        </div>
        {typeof window !== 'undefined' &&
          window.location.protocol !== 'https:' &&
          window.location.hostname !== 'localhost' &&
          !window.location.hostname.startsWith('192.168.') && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <p className="font-medium mb-1">⚠️ Security Notice</p>
              <p>For secure payment processing, this page should be accessed over HTTPS. The payment form will still work, but some browser features may be limited.</p>
            </div>
          )}
        {/* Postal Code warnings removed as we are forcing postal code disable */
          locationCountry === 'AU' && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <p className="font-medium mb-1">✓ Location Set to Australia</p>
              <p>Postal code field has been disabled for this location.</p>
            </div>
          )}
        {/* Sandbox Notice */}
        {appId?.startsWith('sandbox') && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <p className="font-medium mb-1">🛠️ Sandbox Mode</p>
            <p><strong>Note:</strong> Valid postal code required for testing (e.g. <strong>12345</strong>).</p>
          </div>
        )}
      </div>
    </div>
  );
}

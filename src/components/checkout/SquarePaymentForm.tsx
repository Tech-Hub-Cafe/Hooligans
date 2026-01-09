"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Lock, Smartphone } from "lucide-react";

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
}

export default function SquarePaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing,
}: SquarePaymentFormProps) {
  const cardRef = useRef<Card | null>(null);
  const applePayRef = useRef<ApplePay | null>(null);
  const googlePayRef = useRef<GooglePay | null>(null);
  const isInitializingRef = useRef(false); // Prevent duplicate initializations
  const initializedRef = useRef(false); // Track if already initialized
  
  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  const [postalCodeRequired, setPostalCodeRequired] = useState(false);

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  // Check if Square is configured
  const isSquareConfigured = appId && locationId;

  // Determine Square environment for SDK URL
  const getSquareSDKUrl = () => {
    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
    if (env === 'production') {
      return "https://web.squarecdn.com/v1/square.js";
    }
    return "https://sandbox.web.squarecdn.com/v1/square.js";
  };

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
        console.warn("[Square Payment] Page is not served over HTTPS. Payment forms may not work correctly.");
      }
    }

    const script = document.createElement("script");
    script.src = getSquareSDKUrl();
    script.onload = () => setIsSquareLoaded(true);
    script.onerror = () => {
      setError("Failed to load payment system. Please ensure you're using HTTPS.");
      onPaymentError("Failed to load payment system");
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup payment methods
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch (e) {
          console.warn("[Square Payment] Error destroying card:", e);
        }
        cardRef.current = null;
      }
      if (applePayRef.current) {
        try {
          applePayRef.current.destroy();
        } catch (e) {
          console.warn("[Square Payment] Error destroying Apple Pay:", e);
        }
        applePayRef.current = null;
      }
      if (googlePayRef.current) {
        try {
          googlePayRef.current.destroy();
        } catch (e) {
          console.warn("[Square Payment] Error destroying Google Pay:", e);
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
          setPostalCodeRequired(requiresPostalCode.includes(country));
          
          console.log("[Square Payment] Location country:", country, "Postal code required:", requiresPostalCode.includes(country));
        }
      } catch (err) {
        console.error("[Square Payment] Failed to fetch location country:", err);
        // Continue without country info
      }
    }

    fetchLocationCountry();
  }, [locationId]);

  // Initialize payment methods
  useEffect(() => {
    if (!isSquareLoaded || !window.Square || !appId || !locationId) return;
    
    // Prevent multiple initializations
    if (initializedRef.current || isInitializingRef.current) {
      console.log("[Square Payment] Payment methods already initialized or initializing, skipping...");
      return;
    }

    // Check if card container already has Square's form attached
    const cardContainer = document.getElementById("card-container");
    if (cardContainer && cardContainer.querySelector('.sq-card-input')) {
      console.log("[Square Payment] Card form already exists in DOM, skipping initialization");
      setCardReady(true);
      initializedRef.current = true;
      return;
    }

    isInitializingRef.current = true;

    async function initializePayments() {
      try {
        console.log("[Square Payment] Initializing payment methods...");

        const payments = await window.Square!.payments(appId!, locationId!);
        console.log("[Square Payment] Payments instance created");

        // Initialize Card Payment
        try {
          // Clear any existing content in card container
          const cardContainer = document.getElementById("card-container");
          if (cardContainer) {
            cardContainer.innerHTML = ''; // Clear any duplicate forms
          }

          let card;
          
          // For Australia, try to disable postal code
          // Note: Square may still show postal code field based on location settings
          if (locationCountry === 'AU') {
            try {
              card = await payments.card({ postalCode: false });
              console.log("[Square Payment] Card created with postalCode: false (for Australia)");
            } catch (configError: any) {
              console.warn("[Square Payment] postalCode: false not supported, using default:", configError);
              // If postalCode: false fails, Square location might require it
              card = await payments.card();
              console.log("[Square Payment] Card created with default settings - postal code may be required by Square");
            }
          } else if (!postalCodeRequired && locationCountry && locationCountry !== 'US' && locationCountry !== 'CA' && locationCountry !== 'GB') {
            // For other non-postal-code countries
            try {
              card = await payments.card({ postalCode: false });
              console.log("[Square Payment] Card created with postalCode: false");
            } catch (configError: any) {
              card = await payments.card();
              console.log("[Square Payment] Card created with default settings");
            }
          } else {
            // Location requires postal code - use default
            card = await payments.card();
            console.log("[Square Payment] Card created with default settings (postal code required for", locationCountry, ")");
          }
          
          await card.attach("#card-container");
          cardRef.current = card;
          setCardReady(true);
          initializedRef.current = true;
          isInitializingRef.current = false;
          console.log("[Square Payment] Card form ready");
        } catch (cardError: any) {
          console.error("[Square Payment] Failed to initialize card:", cardError);
          setError(`Failed to initialize card form: ${cardError.message || "Unknown error"}`);
          isInitializingRef.current = false;
        }

        // Initialize Apple Pay
        try {
          const applePay = await payments.applePay({
            countryCode: "AU", // Australia
            currencyCode: "AUD",
          });
          
          // Check if Apple Pay is available
          const applePayAvailable = await applePay.canTokenize();
          if (applePayAvailable) {
            await applePay.attach("#apple-pay-button");
            applePayRef.current = applePay;
            setApplePayReady(true);
            console.log("[Square Payment] Apple Pay ready");
          } else {
            console.log("[Square Payment] Apple Pay not available on this device");
          }
        } catch (applePayError: any) {
          console.log("[Square Payment] Apple Pay initialization failed (may not be available):", applePayError.message);
          // Apple Pay might not be available - that's okay
        }

        // Initialize Google Pay
        try {
          const googlePay = await payments.googlePay({
            countryCode: "AU", // Australia
            currencyCode: "AUD",
          });
          
          // Check if Google Pay is available
          const googlePayAvailable = await googlePay.canTokenize();
          if (googlePayAvailable) {
            await googlePay.attach("#google-pay-button");
            googlePayRef.current = googlePay;
            setGooglePayReady(true);
            console.log("[Square Payment] Google Pay ready");
          } else {
            console.log("[Square Payment] Google Pay not available on this device");
          }
        } catch (googlePayError: any) {
          console.log("[Square Payment] Google Pay initialization failed (may not be available):", googlePayError.message);
          // Google Pay might not be available - that's okay
        }

      } catch (e: any) {
        console.error("[Square Payment] Failed to initialize payments:", {
          error: e,
          message: e?.message,
          stack: e?.stack,
        });
        const errorMessage = e?.message || e?.toString() || "Unknown error";
        setError(`Failed to initialize payment form: ${errorMessage}`);
        onPaymentError(`Payment form initialization failed: ${errorMessage}`);
        isInitializingRef.current = false;
      }
    }

    initializePayments();
    
    // Cleanup function
    return () => {
      isInitializingRef.current = false;
    };
  }, [isSquareLoaded, appId, locationId]); // Removed locationCountry and postalCodeRequired from dependencies to prevent re-initialization

  const handlePayment = async (paymentMethod: 'card' | 'applePay' | 'googlePay' = 'card') => {
    setIsProcessing(true);
    setError(null);

    try {
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
        if (errorMessage.toLowerCase().includes("postal code") || errorMessage.toLowerCase().includes("zip code")) {
          const postalCodeError = locationCountry === 'AU' 
            ? "Postal code validation failed. Your Square location may need to be set to Australia in Square Dashboard. For now, try entering '0000' as a temporary workaround."
            : `Postal code validation failed. Please enter a valid postal code for ${locationCountry || 'your location'}.`;
          setError(postalCodeError);
          onPaymentError(postalCodeError);
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
            id="card-container"
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
        {/* Postal Code Notice */}
        {postalCodeRequired && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <p className="font-medium mb-1">⚠️ Postal Code Required</p>
            <p className="mb-2">Your Square location is set to <strong>{locationCountry}</strong>, which requires a postal code for payments.</p>
            <p className="mb-1"><strong>To fix this issue:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to <a href="https://squareup.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Square Dashboard</a></li>
              <li>Navigate to <strong>Locations</strong> → Select your location</li>
              <li>Change the <strong>Country</strong> to <strong>Australia</strong></li>
              <li>Save the changes</li>
            </ol>
            <p className="mt-2 text-red-600">Until you change this, you'll need to enter a valid postal code for {locationCountry}.</p>
          </div>
        )}
        {!postalCodeRequired && locationCountry && locationCountry !== 'AU' && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <p className="font-medium mb-1">ℹ️ Location Country: {locationCountry}</p>
            <p>Postal code is optional for your location. If you see a postal code field, you can leave it blank or enter any value.</p>
          </div>
        )}
        {locationCountry === 'AU' && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            <p className="font-medium mb-1">✓ Location Set to Australia</p>
            <p>Postal code is not required for Australian locations. If you see a postal code field, please contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}

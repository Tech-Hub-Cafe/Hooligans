"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface PaymentRequest {
  countryCode: string;
  currencyCode: string;
  total: {
    amount: string;
    label: string;
  };
}

interface PaymentRequestOptions {
  countryCode: string;
  currencyCode: string;
  total: {
    amount: string;
    label: string;
  };
}

interface Payments {
  card: (options?: { postalCode?: boolean | string }) => Promise<Card>;
  applePay: (paymentRequest: PaymentRequest) => Promise<ApplePay>;
  googlePay: (paymentRequest: PaymentRequest) => Promise<GooglePay>;
  paymentRequest: (options: PaymentRequestOptions) => PaymentRequest;
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

  // Create a unique ID for this instance
  const uniqueId = React.useId();
  // Sanitize the ID for use in DOM selectors
  const containerId = `card-container-${uniqueId.replace(/:/g, '')}`;

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
      if (error) {
        // Better error serialization
        if (error instanceof Error) {
          console.error(`[SquarePayment] ${message}`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error as any).code && { code: (error as any).code },
            ...(error as any).type && { type: (error as any).type },
          });
        } else if (typeof error === 'object') {
          console.error(`[SquarePayment] ${message}`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } else {
          console.error(`[SquarePayment] ${message}`, error);
        }
      } else {
        console.error(`[SquarePayment] ${message}`);
      }
    },
  };

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const squareEnvironment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;

  // Determine Square environment
  // Logic: 
  // 1. If NEXT_PUBLIC_SQUARE_ENVIRONMENT is explicitly set, use it.
  // 2. Else, infer from Application ID (starts with 'sandbox-' => sandbox, 'sq0idp-' => production).
  const isProduction = (() => {
    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
    if (env === 'production' || env === 'prod') return true;
    if (env === 'sandbox') return false;

    // Fallback: Infer from App ID
    if (appId?.startsWith('sandbox-')) return false;
    // Default to production if no "sandbox" prefix found (standard Square convention)
    return true;
  })();


  const isSquareConfigured = !!(appId && locationId);

  // Log configuration status for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const explicitEnv = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;

      console.log("[SquarePayment] Configuration check:", {
        hasAppId: !!appId,
        hasLocationId: !!locationId,
        explicitEnv: explicitEnv || "not set",
        inferredMode: isProduction ? "PRODUCTION" : "SANDBOX",
        isConfigured: isSquareConfigured,
        appIdPreview: appId ? `${appId.substring(0, 10)}...` : "missing",
      });

      // Warn if mismatch might occur
      if (explicitEnv === 'sandbox' && isProduction) {
        console.warn("[SquarePayment] ⚠️ MISMTACH: Env set to SANDBOX but App ID looks like PRODUCTION. This may fail.");
      }
      if ((explicitEnv === 'production' || explicitEnv === 'prod') && !isProduction) {
        console.warn("[SquarePayment] ⚠️ MISMTACH: Env set to PRODUCTION but App ID looks like SANDBOX. This may fail.");
      }
    }
  }, [appId, locationId, isProduction, isSquareConfigured]);

  // Determine Square SDK URL based on the robust logic above
  const getSquareSDKUrl = () => {
    if (isProduction) {
      console.log("[SquarePayment] Using Production SDK");
      return "https://web.squarecdn.com/v1/square.js";
    }

    console.log("[SquarePayment] Using Sandbox SDK");
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

    // Check if Square SDK is already loaded
    if (typeof window !== 'undefined' && ((window as any).Square || (globalThis as any).Square)) {
      log.debug("Square SDK already loaded");
      setIsSquareLoaded(true);
      return;
    }

    // Since we are loading the script via next/script in layout, we just need to wait for it.
    log.debug("Waiting for Square SDK to load (from global script)...");

    // Check every 100ms
    const checkSquare = setInterval(() => {
      const Square = (window as any).Square || (globalThis as any).Square;
      if (Square && typeof Square.payments === 'function') {
        clearInterval(checkSquare);
        if (isMountedRef.current) {
          log.debug("Square SDK detected");
          setIsSquareLoaded(true);
        }
      }
    }, 100);

    // Timeout after 15 seconds (give mobile more time)
    const timeoutId = setTimeout(() => {
      clearInterval(checkSquare);
      const Square = (window as any).Square || (globalThis as any).Square;
      if (!Square && isMountedRef.current) {
        log.error("Square SDK failed to load (timeout)");
        setError("Failed to load payment system. Please refresh the page.");
      }
    }, 15000);

    return () => {
      clearInterval(checkSquare);
      clearTimeout(timeoutId);
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
    // Check for Square availability - try both window.Square and global Square
    const Square = typeof window !== 'undefined' ? (window as any).Square : null;
    const hasSquare = Square && typeof Square.payments === 'function';

    if (!isSquareLoaded || !hasSquare || !appId || !locationId) {
      if (!isSquareLoaded) {
        log.debug("Waiting for Square SDK to load...");
      }
      if (!hasSquare) {
        log.debug("Waiting for Square.payments to be available...", {
          hasWindow: typeof window !== 'undefined',
          hasSquareObject: !!Square,
          hasPaymentsMethod: Square ? typeof Square.payments === 'function' : false
        });
      }
      if (!appId || !locationId) {
        log.debug("Waiting for Square credentials...", { hasAppId: !!appId, hasLocationId: !!locationId });
      }
      return;
    }
    if (!isSquareConfigured) return; // Don't initialize if Square is not configured

    // Prevent multiple initializations (but this ref alone isn't enough for Strict Mode race conditions)
    if (initializedRef.current || isInitializingRef.current) {
      log.debug("Payment methods already initialized or initializing, skipping...");
      return;
    }

    // Quick check if container exists in DOM
    const quickCheck = document.getElementById(containerId);
    if (!quickCheck) {
      log.debug("Container not yet in DOM, will wait for it during initialization", { containerId });
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
      // Define options at top level to ensure availability in all try/catch blocks
      const cardOptions: { postalCode?: boolean | string } = {};

      try {
        log.info("Initializing payment methods...");

        // Wait for card container to be available
        // Update waitForCardContainer to use the unique ID
        const waitForContainer = async (maxRetries = 20, delay = 200): Promise<HTMLElement | null> => {
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (isCancelled) return null;
            const container = document.getElementById(containerId);
            if (container) {
              // Verify container is actually in the DOM and accessible
              const rect = container.getBoundingClientRect();
              const isInDOM = container.isConnected;
              const hasDimensions = rect.width > 0 || rect.height > 0;

              log.debug(`Container found (attempt ${attempt + 1}/${maxRetries})`, {
                containerId,
                isInDOM,
                hasDimensions,
                dimensions: { width: rect.width, height: rect.height },
                parentElement: container.parentElement?.tagName,
              });

              // Return container even if dimensions are 0 (Square SDK can handle this)
              if (isInDOM) {
                return container;
              }
            }

            // Log what containers exist for debugging
            if (attempt === 0 || attempt % 5 === 0) {
              const allContainers = Array.from(document.querySelectorAll('[id*="card-container"]'));
              log.debug(`Waiting for container (attempt ${attempt + 1})`, {
                containerId,
                foundContainers: allContainers.map(el => ({
                  id: el.id,
                  isConnected: el.isConnected,
                  dimensions: el.getBoundingClientRect(),
                })),
              });
            }

            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Final check - maybe container exists but with different ID format
          const allContainers = Array.from(document.querySelectorAll('[id*="card-container"]'));
          log.error("Container not found after retries", {
            containerId,
            maxRetries,
            delay,
            allContainers: allContainers.map(el => ({
              id: el.id,
              isConnected: el.isConnected,
              dimensions: el.getBoundingClientRect(),
              className: el.className,
            })),
            documentReadyState: document.readyState,
            bodyChildren: Array.from(document.body.children).map(el => ({
              tagName: el.tagName,
              id: el.id,
              className: el.className,
            })),
          });
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

        // Check if container is visible/has size
        const { width, height } = cardContainer.getBoundingClientRect();
        if (width === 0 || height === 0) {
          log.warn(`Card container has zero dimensions (${width}x${height}). This may cause initialization failure.`);
          // We'll proceed anyway as sometimes sizes update late, but this is a red flag.
        }

        // Validate appId and locationId before calling Square API
        if (!appId || !locationId) {
          throw new Error(`Missing Square configuration: appId=${!!appId}, locationId=${!!locationId}`);
        }

        // Validate Square SDK is loaded - try multiple ways to access it
        const Square = (window as any).Square || (globalThis as any).Square;
        if (!Square) {
          log.error("Square SDK not available", {
            hasWindow: typeof window !== 'undefined',
            windowSquare: !!(window as any).Square,
            globalThisSquare: !!(globalThis as any).Square,
            scriptExists: !!document.getElementById("square-js-script"),
            scriptSrc: document.getElementById("square-js-script")?.getAttribute('src'),
          });
          throw new Error("Square SDK not loaded. Please refresh the page.");
        }

        // Validate credentials format
        if (!appId || appId.length < 10) {
          throw new Error(`Invalid Application ID format. Expected at least 10 characters, got ${appId?.length || 0}.`);
        }
        if (!locationId || locationId.length < 10) {
          throw new Error(`Invalid Location ID format. Expected at least 10 characters, got ${locationId?.length || 0}.`);
        }

        log.debug("Creating payments instance", {
          appId: appId.substring(0, 10) + "...",
          locationId: locationId.substring(0, 10) + "...",
          appIdLength: appId.length,
          locationIdLength: locationId.length,
          hasSquareSDK: !!window.Square,
          environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || "not set",
          sdkUrl: getSquareSDKUrl(),
        });

        // Verify we're in a secure context (HTTPS or localhost)
        if (typeof window !== 'undefined') {
          const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.');
          const isSecure = window.location.protocol === 'https:';

          if (!isSecure && !isLocalhost) {
            throw new Error("Square payment forms require HTTPS in production. Please access this page over HTTPS.");
          }
        }

        let payments;
        try {
          // Get Square object (try both window.Square and global Square)
          const Square = (window as any).Square || (globalThis as any).Square;
          if (!Square || typeof Square.payments !== 'function') {
            throw new Error("Square.payments is not a function. The Square SDK may not be loaded correctly.");
          }

          payments = await Square.payments(appId, locationId);

          // Verify payments object has card method
          if (!payments || typeof payments.card !== 'function') {
            throw new Error("Payments instance is invalid. The card method is not available.");
          }

          log.debug("Payments instance created successfully", {
            hasCardMethod: typeof payments.card === 'function',
            hasApplePayMethod: typeof payments.applePay === 'function',
            hasGooglePayMethod: typeof payments.googlePay === 'function',
          });
        } catch (paymentsError: any) {
          log.error("Square payments() call failed", {
            error: paymentsError,
            message: paymentsError?.message,
            name: paymentsError?.name,
            code: paymentsError?.code,
            type: paymentsError?.type,
            stack: paymentsError?.stack,
            appId: appId?.substring(0, 10) + "...",
            locationId: locationId?.substring(0, 10) + "...",
            environment: squareEnvironment,
            sdkUrl: getSquareSDKUrl(),
          });

          // Provide more specific error messages
          let errorMsg = paymentsError?.message || paymentsError?.toString() || "Unknown error";

          if (errorMsg.includes("UNAUTHORIZED") || errorMsg.includes("401")) {
            errorMsg = `Authentication failed (401). Your Square Application ID or Location ID may be incorrect. ` +
              `Verify they match your ${squareEnvironment === 'production' ? 'production' : 'sandbox'} environment.`;
          } else if (errorMsg.includes("Invalid") || errorMsg.includes("invalid")) {
            errorMsg = `Invalid credentials: ${errorMsg}. Please check your NEXT_PUBLIC_SQUARE_APPLICATION_ID and NEXT_PUBLIC_SQUARE_LOCATION_ID.`;
          }

          throw new Error(
            `Square payments initialization failed: ${errorMsg}. ` +
            `Check that NEXT_PUBLIC_SQUARE_APPLICATION_ID and NEXT_PUBLIC_SQUARE_LOCATION_ID are set correctly ` +
            `and match your SQUARE_ENVIRONMENT (${squareEnvironment || 'not set'}).`
          );
        }

        if (isCancelled) return;

        log.debug("Payments instance created successfully");

        // Helper function to build PaymentRequest for digital wallets
        const buildPaymentRequest = (payments: Payments): PaymentRequest => {
          return payments.paymentRequest({
            countryCode: "AU",
            currencyCode: "AUD",
            total: {
              amount: amount.toFixed(2),
              label: "Total",
            },
          });
        };

        // Postal code configuration
        // Square automatically handles postal code requirements based on the location country
        // set in Square Dashboard. For Australia, Square will automatically hide the postal code
        // field if the location is configured as Australia. We don't need to set postalCode option.
        if (locationCountry) {
          log.debug(`${isProduction ? 'Production' : 'Sandbox'} (${locationCountry}): Square will automatically handle postal code based on location country`);
        } else {
          log.debug(`${isProduction ? 'Production' : 'Sandbox'}: Location country not yet fetched, Square will use default behavior based on account settings`);
        }

        // Initialize Card Payment
        try {
          // Clear any existing content in card container
          cardContainer.innerHTML = '';

          let card;
          const isSandbox = !isProduction;

          // Create card instance
          try {
            // Verify payments.card is available
            if (!payments || typeof payments.card !== 'function') {
              throw new Error("payments.card() method is not available. This usually means the Square SDK failed to initialize correctly.");
            }

            log.debug("Creating card instance", {
              options: cardOptions,
              isProduction,
              locationCountry,
              hasCardMethod: typeof payments.card === 'function',
            });

            // Create card with a timeout to catch hanging requests
            log.info(`Attempting to create card with options: ${JSON.stringify(cardOptions)}`);

            const cardPromise = Object.keys(cardOptions).length > 0
              ? payments.card(cardOptions)
              : payments.card();

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Card creation timed out after 10 seconds. This may indicate invalid credentials or network issues.")), 10000);
            });

            // Wrap cardPromise to catch and log any errors
            const wrappedCardPromise = cardPromise.catch((err: unknown) => {
              log.error("Card promise rejected", err);
              throw err;
            });

            card = await Promise.race([wrappedCardPromise, timeoutPromise]) as any;

            // Verify card instance is valid
            if (!card || typeof card.attach !== 'function') {
              throw new Error("Card instance is invalid. The attach method is not available.");
            }

            log.debug("Card instance created successfully", {
              hasAttachMethod: typeof card.attach === 'function',
              hasTokenizeMethod: typeof card.tokenize === 'function',
              hasDestroyMethod: typeof card.destroy === 'function',
            });
          } catch (cardCreateError: any) {
            // Extract the actual error message - Square sometimes wraps errors
            const actualError = cardCreateError?.error || cardCreateError?.cause || cardCreateError;
            const errorMessage = actualError?.message || cardCreateError?.message || cardCreateError?.toString() || "Unknown error";
            const errorName = actualError?.name || cardCreateError?.name;
            const errorCode = actualError?.code || cardCreateError?.code;

            log.error("Failed to create card instance", {
              error: cardCreateError,
              actualError,
              message: errorMessage,
              name: errorName,
              code: errorCode,
              type: cardCreateError?.type,
              stack: cardCreateError?.stack,
              options: cardOptions,
              isProduction,
              locationCountry,
              appId: appId?.substring(0, 10) + "...",
              locationId: locationId?.substring(0, 10) + "...",
              squareSDKLoaded: !!(window as any).Square || !!(globalThis as any).Square,
              sdkUrl: getSquareSDKUrl(),
              environment: squareEnvironment,
            });

            // Provide more specific error messages based on error content
            let userFriendlyMessage = errorMessage;

            if (errorMessage.includes("UNAUTHORIZED") || errorMessage.includes("401") || errorCode === 401) {
              userFriendlyMessage = `Authentication failed (401). Your Square Application ID or Location ID may be incorrect for ${isProduction ? "production" : "sandbox"} environment.`;
            } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
              userFriendlyMessage = `Card creation timed out. This usually means:
- Invalid Application ID or Location ID
- Network connectivity issues
- Square API is not responding

Please verify your credentials are correct.`;
            } else if (errorMessage.includes("Card") || errorName === "CardError") {
              // This is the generic Square error we're seeing
              userFriendlyMessage = `Card initialization failed: "${errorMessage}"

Common causes:
1. Invalid Application ID or Location ID - Verify in Square Dashboard
2. Environment mismatch - Production credentials with sandbox SDK (or vice versa)
3. Square account not fully activated for payments
4. Location ID doesn't belong to the Application ID

Please verify:
- NEXT_PUBLIC_SQUARE_APPLICATION_ID matches your ${isProduction ? "production" : "sandbox"} app in Square Dashboard
- NEXT_PUBLIC_SQUARE_LOCATION_ID is correct and active for your Square account
- NEXT_PUBLIC_SQUARE_ENVIRONMENT=${isProduction ? "production" : "sandbox"} matches your credentials
- SDK URL is ${isProduction ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js"}

Check browser console for detailed error logs.`;
            } else if (errorMessage.includes("not available") || errorMessage.includes("undefined")) {
              userFriendlyMessage = `Square SDK method not available: ${errorMessage}. The Square SDK may not be loaded correctly. Please refresh the page.`;
            }

            // Append debug info to the error message (only in development)
            if (process.env.NODE_ENV === 'development') {
              userFriendlyMessage += `\n\nDebug Info:
Mode: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}
App ID: ${appId?.substring(0, 8)}...
Loc ID: ${locationId?.substring(0, 8)}...`;
            }

            throw new Error(userFriendlyMessage);
          }

          if (isCancelled) {
            if (card) {
              try {
                await card.destroy();
              } catch (destroyError) {
                log.warn("Error destroying card during cancellation:", destroyError);
              }
            }
            return;
          }

          // Double-check container still exists before attaching
          const finalContainer = document.getElementById(containerId);
          if (!finalContainer) {
            log.error("Card container disappeared before attach");
            if (card) {
              try {
                await card.destroy();
              } catch (destroyError) {
                log.warn("Error destroying card:", destroyError);
              }
            }
            setError("Payment form container is not available. Please refresh the page.");
            isInitializingRef.current = false;
            return;
          }

          // Attach card to container
          // Square SDK best practice: Verify container exists and is ready before attaching
          const attachContainer = document.getElementById(containerId);
          if (!attachContainer) {
            throw new Error(`Container element #${containerId} not found in DOM`);
          }

          // Check if container has dimensions (Square SDK requires visible container)
          const rect = attachContainer.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            log.warn("Container has zero dimensions, but proceeding with attach", {
              width: rect.width,
              height: rect.height,
              containerId,
            });
          }

          log.debug("Attaching card to container", {
            containerId,
            containerExists: !!attachContainer,
            containerDimensions: { width: rect.width, height: rect.height },
          });

          try {
            // Square SDK: attach() must be called with a valid selector
            await card.attach(`#${containerId}`);
            log.debug("Card attached successfully");
          } catch (attachError: any) {
            const scriptTag = document.getElementById('square-js-script') as HTMLScriptElement;
            const loadedSdkUrl = scriptTag?.src;

            log.error("Failed to attach card to container", {
              error: attachError,
              message: attachError?.message,
              name: attachError?.name,
              code: attachError?.code,
              type: attachError?.type,
              category: attachError?.category,
              details: attachError?.details,
              stack: attachError?.stack,
              containerId,
              containerExists: !!document.getElementById(containerId),
              squareSDKLoaded: !!(window as any).Square || !!(globalThis as any).Square,
              loadedSdkUrl,
              expectedEnvironment: isProduction ? "Production" : "Sandbox",
              appIdPrefix: appId?.substring(0, 8),
            });

            // Square SDK best practice: Clean up card instance on failure
            if (card) {
              try {
                await card.destroy();
              } catch (destroyError) {
                log.warn("Error destroying card after attach failure:", destroyError);
              }
            }

            // Provide more specific error messages
            let errorMessage = attachError?.message || attachError?.toString() || "Unknown error";

            // Check for common Square error patterns
            if (errorMessage.includes("UNAUTHORIZED") || errorMessage.includes("401")) {
              errorMessage = `Authentication failed. Please verify your Square Application ID and Location ID are correct for ${isProduction ? "production" : "sandbox"} environment.`;
            } else if (errorMessage.includes("container") || errorMessage.includes("element")) {
              errorMessage = `Payment form container not found. Please refresh the page.`;
            } else if (errorMessage.includes("Card")) {
              const detailedError = attachError?.details ? JSON.stringify(attachError.details) : "";
              errorMessage = `Card initialization failed: ${attachError?.message || "Please verify your Square credentials."} ${detailedError}`;
            }

            throw new Error(errorMessage);
          }

          if (isCancelled) {
            if (card) {
              try {
                await card.destroy();
              } catch (destroyError) {
                log.warn("Error destroying card:", destroyError);
              }
            }
            return;
          }

          cardRef.current = card;
          setCardReady(true);
          initializedRef.current = true;
          isInitializingRef.current = false;
          log.info("Card form initialized and ready");
        } catch (cardError: any) {
          // Extract error details more thoroughly
          let errorDetails: any;

          if (cardError instanceof Error) {
            errorDetails = {
              name: cardError.name,
              message: cardError.message,
              stack: cardError.stack,
              ...(cardError as any).code && { code: (cardError as any).code },
              ...(cardError as any).type && { type: (cardError as any).type },
              ...(cardError as any).details && { details: (cardError as any).details },
            };
          } else if (cardError && typeof cardError === 'object') {
            // Check if it's an empty object
            const keys = Object.keys(cardError);
            if (keys.length === 0) {
              errorDetails = {
                message: "Empty error object received - this may indicate a Square SDK initialization issue",
                rawError: cardError,
              };
            } else {
              errorDetails = cardError;
            }
          } else {
            errorDetails = cardError || "Unknown error occurred";
          }

          log.error("Failed to initialize card", errorDetails);

          // Don't show error to user if component is unmounted
          if (!isCancelled && isMountedRef.current) {
            let errorMessage = "Unknown error";

            if (cardError instanceof Error) {
              errorMessage = cardError.message || cardError.toString();
            } else if (cardError && typeof cardError === 'object') {
              errorMessage = cardError.message ||
                cardError.error?.message ||
                JSON.stringify(cardError) ||
                "Card initialization failed";
            } else if (cardError) {
              errorMessage = String(cardError);
            }

            setError(`Failed to initialize payment form: ${errorMessage}`);
            onPaymentError(`Payment form initialization failed: ${errorMessage}`);
          }
          isInitializingRef.current = false;
        }

        // Initialize Apple Pay
        try {
          if (isCancelled) return;
          
          // Check if paymentRequest method is available
          if (!payments.paymentRequest) {
            log.debug("PaymentRequest method not available, skipping Apple Pay");
            return;
          }

          const paymentRequest = buildPaymentRequest(payments);
          const applePay = await payments.applePay(paymentRequest);

          // Check if Apple Pay is available
          const applePayAvailable = await (applePay as any).canTokenize();
          if (applePayAvailable) {
            if (isCancelled) {
              await applePay.destroy();
              return;
            }
            // Ensure button container exists before attaching
            const applePayContainer = document.getElementById("apple-pay-button");
            if (!applePayContainer) {
              log.debug("Apple Pay button container not found, skipping");
              return;
            }

            await applePay.attach("#apple-pay-button");
            applePayRef.current = applePay;
            setApplePayReady(true);
            log.debug("Apple Pay ready");

            // Add click handler for Apple Pay button
            // Square's attach() creates the button, wait for it to be ready
            const setupApplePayClickHandler = () => {
              const applePayContainer = document.getElementById("apple-pay-button");
              if (applePayContainer) {
                // Square creates a button element inside the container
                const squareButton = applePayContainer.querySelector('button');
                if (squareButton) {
                  // Add click listener - Square's button handles the UI, we handle tokenization
                  squareButton.addEventListener("click", async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Apple Pay requires immediate tokenize() call - no async operations before
                    if (applePayRef.current) {
                      await handlePayment('applePay');
                    }
                  });
                  return true;
                }
              }
              return false;
            };

            // Try immediately, then retry if needed (Square might need a moment to create the button)
            if (!setupApplePayClickHandler()) {
              setTimeout(() => {
                setupApplePayClickHandler();
              }, 300);
            }
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
          
          // Check if paymentRequest method is available
          if (!payments.paymentRequest) {
            log.debug("PaymentRequest method not available, skipping Google Pay");
            return;
          }

          const paymentRequest = buildPaymentRequest(payments);
          const googlePay = await payments.googlePay(paymentRequest);

          // Check if Google Pay is available
          const googlePayAvailable = await (googlePay as any).canTokenize();
          if (googlePayAvailable) {
            if (isCancelled) {
              await googlePay.destroy();
              return;
            }
            // Ensure button container exists before attaching
            const googlePayContainer = document.getElementById("google-pay-button");
            if (!googlePayContainer) {
              log.debug("Google Pay button container not found, skipping");
              return;
            }

            await googlePay.attach("#google-pay-button");
            googlePayRef.current = googlePay;
            setGooglePayReady(true);
            log.debug("Google Pay ready");

            // Add click handler for Google Pay button
            // Square's attach() creates the button, wait for it to be ready
            const setupGooglePayClickHandler = () => {
              const googlePayContainer = document.getElementById("google-pay-button");
              if (googlePayContainer) {
                // Square creates a button element inside the container
                const squareButton = googlePayContainer.querySelector('button');
                if (squareButton) {
                  // Add click listener - Square's button handles the UI, we handle tokenization
                  squareButton.addEventListener("click", async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (googlePayRef.current) {
                      await handlePayment('googlePay');
                    }
                  });
                  return true;
                }
              }
              return false;
            };

            // Try immediately, then retry if needed (Square might need a moment to create the button)
            if (!setupGooglePayClickHandler()) {
              setTimeout(() => {
                setupGooglePayClickHandler();
              }, 300);
            }
          } else {
            log.debug("Google Pay not available on this device");
          }
        } catch (googlePayError: any) {
          log.debug("Google Pay initialization failed (may not be available):", googlePayError.message);
          // Google Pay might not be available - that's okay
        }

      } catch (e: any) {
        if (isCancelled) return;

        // Extract error details more thoroughly
        let errorDetails: any;

        if (e instanceof Error) {
          errorDetails = {
            name: e.name,
            message: e.message,
            stack: e.stack,
            ...(e as any).code && { code: (e as any).code },
            ...(e as any).type && { type: (e as any).type },
            ...(e as any).details && { details: (e as any).details },
          };
        } else if (e && typeof e === 'object') {
          // Check if it's an empty object
          const keys = Object.keys(e);
          if (keys.length === 0) {
            errorDetails = {
              message: "Empty error object received - this may indicate a Square SDK initialization issue",
              rawError: e,
            };
          } else {
            errorDetails = e;
          }
        } else {
          errorDetails = e || "Unknown error occurred";
        }

        log.error("Failed to initialize payments", errorDetails);

        // Only show error if component is still mounted
        if (isMountedRef.current) {
          let errorMessage = "Unknown error";

          if (e instanceof Error) {
            errorMessage = e.message || e.toString();
          } else if (e && typeof e === 'object') {
            errorMessage = e.message ||
              e.error?.message ||
              JSON.stringify(e) ||
              "Payment initialization failed";
          } else if (e) {
            errorMessage = String(e);
          }

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
  }, [isSquareLoaded, appId, locationId, isSquareConfigured, locationCountry, containerId]);

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
            // Production logic
            const postalCodeError = `Postal code validation failed. Please enter a valid postal code${locationCountry ? ` for ${locationCountry}` : ''}.`;
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
      {/* Apple Pay Button - always render container, show when ready */}
      <div className="space-y-2" style={{ display: applePayReady ? 'block' : 'none' }}>
        <div id="apple-pay-button" className="min-h-[48px]" />
      </div>

      {/* Google Pay Button - always render container, show when ready */}
      <div className="space-y-2" style={{ display: googlePayReady ? 'block' : 'none' }}>
        <div id="google-pay-button" className="min-h-[48px]" />
      </div>

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

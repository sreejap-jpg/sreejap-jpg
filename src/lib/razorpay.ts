// Loads the Razorpay checkout.js SDK from the official CDN exactly once.
// Razorpay's standard web checkout script — required to open the modal.

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Razorpay checkout SDK.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Types for Razorpay order creation response from our edge function
export type RazorpayOrderResponse = {
  order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
};

export type RazorpayVerifyResponse = {
  verified: boolean;
  order_id?: string;
  payment_id?: string;
  error?: string;
};

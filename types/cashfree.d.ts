declare global {
  interface Window {
    Cashfree: {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: string;
      }) => Promise<void>;
      dropin: (container: HTMLElement, options: {
        paymentSessionId: string;
        components: string[];
        onSuccess: (data: any) => void;
        onFailure: (data: any) => void;
        style?: {
          color?: string;
          fontFamily?: string;
          theme?: string;
        };
      }) => void;
    };
  }
}

export {};

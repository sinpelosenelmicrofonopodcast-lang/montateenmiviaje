interface PayPalButtonsComponentOptions {
  style?: {
    layout?: "vertical" | "horizontal";
    color?: "gold" | "blue" | "silver" | "white" | "black";
    shape?: "rect" | "pill";
    label?: "paypal" | "checkout" | "buynow" | "pay";
  };
  createOrder: () => Promise<string> | string;
  onApprove: (data: { orderID: string }) => Promise<void> | void;
  onError?: (err: unknown) => void;
}

interface PayPalNamespace {
  Buttons: (options: PayPalButtonsComponentOptions) => {
    render: (selector: string) => Promise<void>;
  };
}

interface Window {
  paypal?: PayPalNamespace;
}

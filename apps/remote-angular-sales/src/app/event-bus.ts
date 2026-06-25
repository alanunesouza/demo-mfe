export type CartItem = {
  id: number;
  name: string;
  price: number;
};

export const SALES_EVENTS = {
  SEARCH_CHANGED: 'sales:search-changed',
  CART_ADD: 'sales:cart-add',
  CART_CLEARED: 'sales:cart-cleared',
} as const;

type SalesMfeEvents = {
  [SALES_EVENTS.SEARCH_CHANGED]: {
    query: string;
  };
  [SALES_EVENTS.CART_ADD]: CartItem;
  [SALES_EVENTS.CART_CLEARED]: undefined;
};

type EventHandler<T> = (payload: T) => void;

class BrowserEventBus<Events extends Record<string, unknown>> {
  on<K extends keyof Events & string>(
    eventName: K,
    handler: EventHandler<Events[K]>,
  ): () => void {
    const listener: EventListener = (event) => {
      const customEvent = event as CustomEvent<Events[K]>;
      handler(customEvent.detail);
    };

    window.addEventListener(eventName, listener);

    return () => {
      window.removeEventListener(eventName, listener);
    };
  }

  emit<K extends keyof Events & string>(
    eventName: K,
    ...payload: Events[K] extends undefined ? [] : [Events[K]]
  ): void {
    const detail = payload[0] as Events[K];
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

declare global {
  interface Window {
    __salesMfeEventBus?: BrowserEventBus<SalesMfeEvents>;
  }
}

export const bus =
  window.__salesMfeEventBus ?? (window.__salesMfeEventBus = new BrowserEventBus<SalesMfeEvents>());

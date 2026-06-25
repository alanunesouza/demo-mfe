export type CartItem = {
  id: number;
  name: string;
  price: number;
};

export const SALES_EVENTS: {
  readonly SEARCH_CHANGED: 'sales:search-changed';
  readonly CART_ADD: 'sales:cart-add';
  readonly CART_CLEARED: 'sales:cart-cleared';
};

export type SalesMfeEvents = {
  [SALES_EVENTS.SEARCH_CHANGED]: {
    query: string;
  };
  [SALES_EVENTS.CART_ADD]: CartItem;
  [SALES_EVENTS.CART_CLEARED]: undefined;
};

type EventHandler<T> = (payload: T) => void;

export interface BrowserEventBus<Events extends Record<string, unknown>> {
  on<K extends keyof Events & string>(
    eventName: K,
    handler: EventHandler<Events[K]>,
  ): () => void;
  emit<K extends keyof Events & string>(
    eventName: K,
    ...payload: Events[K] extends undefined ? [] : [Events[K]]
  ): void;
}

declare global {
  interface Window {
    __salesMfeEventBus?: BrowserEventBus<SalesMfeEvents>;
  }
}

export const bus: BrowserEventBus<SalesMfeEvents>;

export const SALES_EVENTS = {
  SEARCH_CHANGED: 'sales:search-changed',
  CART_ADD: 'sales:cart-add',
  CART_CLEARED: 'sales:cart-cleared',
};

class BrowserEventBus {
  on(eventName, handler) {
    const listener = (event) => {
      handler(event.detail);
    };

    window.addEventListener(eventName, listener);

    return () => {
      window.removeEventListener(eventName, listener);
    };
  }

  emit(eventName, payload) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  }
}

export const bus =
  window.__salesMfeEventBus ?? (window.__salesMfeEventBus = new BrowserEventBus());

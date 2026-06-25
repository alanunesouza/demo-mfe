import { useEffect, useState } from 'react';
import { registerApplication, start } from 'single-spa';
import { SALES_EVENTS, bus, type CartItem } from './shared/event-bus';
const SALES_REMOTE_BASE = 'http://localhost:4201';
const CHECKOUT_REMOTE_BASE = 'http://localhost:4202';

declare global {
  interface Window {
    salesAngularRemote?: {
      bootstrap: () => Promise<void>;
      mount: (props?: Record<string, unknown>) => Promise<void>;
      unmount: (props?: Record<string, unknown>) => Promise<void>;
    };
    checkoutAngularRemote?: {
      bootstrap: () => Promise<void>;
      mount: (props?: Record<string, unknown>) => Promise<void>;
      unmount: (props?: Record<string, unknown>) => Promise<void>;
    };
    __salesAngularRemoteRegistered?: boolean;
    __checkoutAngularRemoteRegistered?: boolean;
    __salesMfeRegistered?: boolean;
  }
}

type RemoteWindowKey = 'salesAngularRemote' | 'checkoutAngularRemote';

type RemoteLoaderConfig<T extends RemoteWindowKey> = {
  remoteName: 'sales' | 'checkout';
  baseUrl: string;
  remoteWindowKey: T;
  missingLifecycleError: string;
};

const REMOTE_BUNDLES = ['runtime', 'polyfills', 'main'] as const;

function createRemoteLoader<T extends RemoteWindowKey>(config: RemoteLoaderConfig<T>) {
  return () =>
    new Promise<NonNullable<Window[T]>>((resolve, reject) => {
      const existingRemote = window[config.remoteWindowKey];
      if (existingRemote) {
        resolve(existingRemote as NonNullable<Window[T]>);
        return;
      }

      const loadScript = (src: string, dataAttr: string, bundle: string) =>
        new Promise<void>((scriptResolve, scriptReject) => {
          const existingScript = document.querySelector(`script[${dataAttr}]`);
          if (existingScript) {
            scriptResolve();
            return;
          }

          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.id = `${config.remoteName}-${bundle}`;
          script.setAttribute(dataAttr, 'true');
          script.dataset.remote = config.remoteName;
          script.dataset.bundle = bundle;
          script.dataset.source = src;
          script.onload = () => scriptResolve();
          script.onerror = () => scriptReject(new Error(`Não foi possível carregar ${src}.`));
          document.head.appendChild(script);
        });

      console.info(`[shell] loading ${config.remoteName} remote`);

      REMOTE_BUNDLES.reduce(
        (loadChain, bundle) =>
          loadChain.then(() =>
            loadScript(
              `${config.baseUrl}/${bundle}.js`,
              `data-${config.remoteName}-remote-${bundle}`,
              bundle,
            ),
          ),
        Promise.resolve(),
      )
        .then(() => {
          const loadedRemote = window[config.remoteWindowKey];
          if (loadedRemote) {
            console.info(`[shell] ${config.remoteName} remote ready`);
            resolve(loadedRemote as NonNullable<Window[T]>);
            return;
          }

          reject(new Error(config.missingLifecycleError));
        })
        .catch(reject);
    });
}

const loadSalesRemote = createRemoteLoader({
  remoteName: 'sales',
  baseUrl: SALES_REMOTE_BASE,
  remoteWindowKey: 'salesAngularRemote',
  missingLifecycleError: 'O microfrontend Angular de vendas não registrou o lifecycle.',
});

const loadCheckoutRemote = createRemoteLoader({
  remoteName: 'checkout',
  baseUrl: CHECKOUT_REMOTE_BASE,
  remoteWindowKey: 'checkoutAngularRemote',
  missingLifecycleError: 'O microfrontend Angular de checkout não registrou o lifecycle.',
});

if (!window.__salesMfeRegistered) {
  registerApplication({
    name: '@sales/angular-offers',
    app: loadSalesRemote,
    activeWhen: (location: Location) => location.pathname === '/',
  });

  registerApplication({
    name: '@sales/angular-checkout',
    app: loadCheckoutRemote,
    activeWhen: (location: Location) => location.pathname === '/',
  });
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    document.title = 'Sales MFE Demo';
  }, []);

  useEffect(() => {
    if (!window.__salesMfeRegistered) {
      start();
      window.__salesMfeRegistered = true;
    }
  }, []);

  useEffect(() => {
    bus.emit(SALES_EVENTS.SEARCH_CHANGED, { query: searchQuery });
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribeCartAdd = bus.on(SALES_EVENTS.CART_ADD, (item) => {
      if (!item) {
        return;
      }

      setCartItems((currentItems) => {
        const existingItem = currentItems.find((current) => current.id === item.id);

        if (existingItem) {
          return currentItems.map((current) =>
            current.id === item.id
              ? { ...current, price: current.price + item.price }
              : current,
          );
        }

        return [...currentItems, item];
      });
    });

    const unsubscribeCartClear = bus.on(SALES_EVENTS.CART_CLEARED, () => {
      setCartItems([]);
    });

    return () => {
      unsubscribeCartAdd();
      unsubscribeCartClear();
    };
  }, []);

  const totalValue = cartItems.reduce((sum, item) => sum + item.price, 0);
  const totalItems = cartItems.length;
  const cartPreview = cartItems.slice(0, 3);
  const hasItems = totalItems > 0;

  const clearCart = () => {
    bus.emit(SALES_EVENTS.CART_CLEARED);
  };

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <article className="hero-card hero-card--featured">
          <div className="page-badges">
            <span className="badge badge-react">React shell</span>
            <span className="badge">Sales remote</span>
            <span className="badge">Checkout remote</span>
          </div>

          <p className="eyebrow">Storefront</p>
          <h1>One page. Three apps.</h1>
          <p className="lead">
            The shell frames the experience, Sales handles browsing, and Checkout keeps the cart
            detail visible.
          </p>

          <label className="search-bar" htmlFor="search-products">
            <span>Find products</span>
            <input
              id="search-products"
              type="search"
              placeholder="Product, brand, or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="module-strip" aria-label="App modules">
            <article className="module-card">
              <span className="eyebrow">Shell</span>
              <strong>Layout and cart summary</strong>
            </article>
            <article className="module-card">
              <span className="eyebrow">Sales</span>
              <strong>Product browsing</strong>
            </article>
            <article className="module-card">
              <span className="eyebrow">Checkout</span>
              <strong>Cart details</strong>
            </article>
          </div>
        </article>

        <aside className="summary-card" aria-label="Cart summary">
          <div className="summary-header">
            <div>
              <p className="eyebrow">Cart summary</p>
              <h2>React shell</h2>
            </div>
            <span className={`status-pill status-pill--compact ${hasItems ? 'status-pill--active' : ''}`}>
              {hasItems ? 'Live' : 'Empty'}
            </span>
          </div>

          <div className="summary-metrics">
            <div className="summary-metric">
              <strong>{totalItems}</strong>
              <span>Products</span>
            </div>
            <div className="summary-metric">
              <strong>R$ {totalValue.toFixed(2)}</strong>
              <span>Total</span>
            </div>
          </div>

          <button type="button" className="ghost-button" onClick={clearCart} disabled={!hasItems}>
            Clear cart
          </button>

          <div className="summary-list">
            {cartPreview.length > 0 ? (
              cartPreview.map((item) => (
                <div className="summary-list__item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>Cart item</span>
                  </div>
                  <strong>R$ {item.price.toFixed(2)}</strong>
                </div>
              ))
            ) : (
              <p className="empty-state">
                Add products from the sales remote and the summary will update here instantly.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="remote-grid">
        <article className="remote-section" id="sales-remote">
          <div className="remote-section__header">
            <div>
              <div className="page-badges page-badges--tight">
                <span className="badge badge-angular">Angular MFE</span>
                <span className="badge">Sales remote</span>
              </div>
              <h2>Product listing</h2>
              <p>Browse products and add items to the cart.</p>
            </div>
          </div>
          <div id="remote-angular-sales-root" className="remote-slot" aria-live="polite">
            <p>Loading product listing...</p>
          </div>
        </article>

        <article className="remote-section" id="checkout-remote">
          <div className="remote-section__header">
            <div>
              <div className="page-badges page-badges--tight">
                <span className="badge badge-angular">Angular MFE</span>
                <span className="badge">Checkout remote</span>
              </div>
              <h2>Checkout summary</h2>
              <p>Review the same cart state in a dedicated checkout surface.</p>
            </div>
          </div>
          <div id="remote-angular-checkout-root" className="remote-slot" aria-live="polite">
            <p>Loading checkout summary...</p>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App

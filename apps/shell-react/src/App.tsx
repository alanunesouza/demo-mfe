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

function loadSalesRemote() {
  return new Promise<NonNullable<Window['salesAngularRemote']>>((resolve, reject) => {
    if (window.salesAngularRemote) {
      resolve(window.salesAngularRemote);
      return;
    }

    const loadScript = (src: string, dataAttr: string) =>
      new Promise<void>((scriptResolve, scriptReject) => {
        const existingScript = document.querySelector(`script[${dataAttr}]`);
        if (existingScript) {
          scriptResolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.setAttribute(dataAttr, 'true');
        script.onload = () => scriptResolve();
        script.onerror = () => scriptReject(new Error(`Não foi possível carregar ${src}.`));
        document.head.appendChild(script);
      });

    Promise.resolve()
      // 1. Carrega o motor de runtime do Webpack/Angular
      .then(() => loadScript(`${SALES_REMOTE_BASE}/runtime.js`, 'data-sales-remote-runtime'))
      // 2. Carrega os polyfills para garantir compatibilidade com o navegador
      .then(() => loadScript(`${SALES_REMOTE_BASE}/polyfills.js`, 'data-sales-remote-polyfills'))
      // 3. Carrega o código de negócio (Onde está o AppModule e o singleSpaAngular)
      .then(() => loadScript(`${SALES_REMOTE_BASE}/main.js`, 'data-sales-remote-main'))
      .then(() => {
        if (window.salesAngularRemote) {
          resolve(window.salesAngularRemote);
        } else {
          reject(new Error('O microfrontend Angular de vendas não registrou o lifecycle.'));
        }
      })
      .catch(reject);
  });
}

function loadCheckoutRemote() {
  return new Promise<NonNullable<Window['checkoutAngularRemote']>>((resolve, reject) => {
    if (window.checkoutAngularRemote) {
      resolve(window.checkoutAngularRemote);
      return;
    }

    const loadScript = (src: string, dataAttr: string) =>
      new Promise<void>((scriptResolve, scriptReject) => {
        const existingScript = document.querySelector(`script[${dataAttr}]`);
        if (existingScript) {
          scriptResolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.setAttribute(dataAttr, 'true');
        script.onload = () => scriptResolve();
        script.onerror = () => scriptReject(new Error(`Não foi possível carregar ${src}.`));
        document.head.appendChild(script);
      });

    Promise.resolve()
      .then(() => loadScript(`${CHECKOUT_REMOTE_BASE}/runtime.js`, 'data-checkout-remote-runtime'))
      .then(() => loadScript(`${CHECKOUT_REMOTE_BASE}/polyfills.js`, 'data-checkout-remote-polyfills'))
      .then(() => loadScript(`${CHECKOUT_REMOTE_BASE}/main.js`, 'data-checkout-remote-main'))
      .then(() => {
        if (window.checkoutAngularRemote) {
          resolve(window.checkoutAngularRemote);
        } else {
          reject(new Error('O microfrontend Angular de checkout não registrou o lifecycle.'));
        }
      })
      .catch(reject);
  });
}

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
      <header className="shell-topbar">
        <div>
          <span className="eyebrow">Sales microfrontend demo</span>
          <p className="topbar-copy">React shell + Angular remotes, kept in sync through shared events.</p>
        </div>
        <span className={`status-pill ${hasItems ? 'status-pill--active' : ''}`}>
          {hasItems ? 'Cart updated live' : 'Ready to shop'}
        </span>
      </header>

      <section className="hero-grid">
        <article className="hero-card hero-card--featured">
          <div className="page-badges">
            <span className="badge badge-react">React shell</span>
            <span className="badge">Microfrontend orchestration</span>
            <span className="badge">Window events</span>
          </div>

          <p className="eyebrow">Microfrontend lab</p>
          <h1>Clean shell, clearer cart flow.</h1>
          <p className="lead">
            The React shell coordinates product search and the cart summary. Angular remotes keep the
            listing and checkout views focused, while a shared contract keeps every action in sync.
          </p>

          <div className="hero-highlights" aria-label="Project highlights">
            <span className="highlight-chip">React shell</span>
            <span className="highlight-chip">Sales remote</span>
            <span className="highlight-chip">Checkout remote</span>
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

      <section className="insight-grid" aria-label="Live insights">
        <article className="insight-card">
          <span className="eyebrow">Live sync</span>
          <strong>Search + cart events</strong>
          <p>Everything stays coordinated through a typed event contract, not component coupling.</p>
        </article>
        <article className="insight-card">
          <span className="eyebrow">Sales remote</span>
          <strong>Product browsing</strong>
          <p>The Angular listing owns filtering and product actions while the shell stays lightweight.</p>
        </article>
        <article className="insight-card">
          <span className="eyebrow">Checkout remote</span>
          <strong>Detailed cart view</strong>
          <p>The checkout area reflects the same state and keeps the purchase context visible.</p>
        </article>
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
              <p>Search the catalog and add products to the cart summary above.</p>
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
              <p>Review the same cart state in a more detailed checkout-focused surface.</p>
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

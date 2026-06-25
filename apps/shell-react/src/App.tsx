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

  const clearCart = () => {
    bus.emit(SALES_EVENTS.CART_CLEARED);
  };

  return (
    <main className="page-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <div className="page-badges">
            <span className="badge badge-react">React shell</span>
            <span className="badge">Página de vendas</span>
          </div>
          <h1>Vendas</h1>
        </div>

        <label className="search-bar" htmlFor="search-products">
          <span>Busca</span>
          <input
            id="search-products"
            type="search"
            placeholder="Produto, marca ou categoria"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </header>

      <section className="dashboard-grid" id="summary">
        <article className="panel panel-soft-blue">
          <div className="panel-topline">
            <span className="badge badge-react">React</span>
            <h2>Carrinho</h2>
          </div>
          <strong>{totalItems} item(ns)</strong>
          <p>R$ {totalValue.toFixed(2)}</p>
          <button type="button" className="ghost-button" onClick={clearCart} disabled={totalItems === 0}>
            Limpar
          </button>
        </article>
      </section>

      <section className="remote-grid">
        <article className="remote-section" id="sales-remote">
          <div className="remote-section__header">
            <div>
              <div className="page-badges page-badges--tight">
                <span className="badge badge-angular">Angular MFE</span>
                <span className="badge">Produtos</span>
              </div>
              <h2>Listagem</h2>
            </div>
          </div>
          <div id="remote-angular-sales-root" className="remote-slot" aria-live="polite">
            <p>Carregando lista de produtos...</p>
          </div>
        </article>

        <article className="remote-section" id="checkout-remote">
          <div className="remote-section__header">
            <div>
              <div className="page-badges page-badges--tight">
                <span className="badge badge-angular">Angular MFE</span>
                <span className="badge">Carrinho</span>
              </div>
              <h2>Resumo</h2>
            </div>
          </div>
          <div id="remote-angular-checkout-root" className="remote-slot" aria-live="polite">
            <p>Carregando carrinho...</p>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App

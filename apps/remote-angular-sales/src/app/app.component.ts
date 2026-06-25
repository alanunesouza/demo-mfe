import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { SALES_EVENTS, bus, type CartItem } from './event-bus';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  tag: string;
};

type SearchDetail = {
  query?: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Notebook leve',
    description: 'Ótimo para trabalho e estudo, com bateria duradoura.',
    price: 4299.9,
    tag: 'Mais vendido',
  },
  {
    id: 2,
    name: 'Fone sem fio',
    description: 'Som limpo e case compacto para usar o dia inteiro.',
    price: 399.9,
    tag: 'Frete grátis',
  },
  {
    id: 3,
    name: 'Cadeira ergonômica',
    description: 'Conforto para home office com suporte lombar.',
    price: 899.0,
    tag: 'Conforto',
  },
  {
    id: 4,
    name: 'Monitor 24 polegadas',
    description: 'Tela para produtividade com boa definição de imagem.',
    price: 1099.0,
    tag: 'Oferta relâmpago',
  },
];

@Component({
  selector: 'sales-remote-root',
  template: `
    <section class="remote-card">
      <div class="remote-card__header">
        <div>
          <div class="page-badges">
            <span class="badge badge-angular">Angular MFE</span>
            <span class="badge">Lista</span>
          </div>
          <h3>Produtos</h3>
        </div>
        <span class="counter">{{ filteredProducts.length }}</span>
      </div>

      <p>Filtra a lista e envia eventos de compra.</p>

      <div class="empty-state" *ngIf="filteredProducts.length === 0">
        Nenhum produto encontrado para "{{ currentQuery || 'todas as buscas' }}".
      </div>

      <div class="offer-list">
        <article *ngFor="let product of filteredProducts">
          <div class="offer-topline">
            <span class="tag">{{ product.tag }}</span>
            <strong>R$ {{ product.price.toFixed(2) }}</strong>
          </div>
          <h4>{{ product.name }}</h4>
          <p>{{ product.description }}</p>
          <button type="button" (click)="addToCart(product)">Adicionar ao carrinho</button>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .remote-card {
        width: 100%;
        border-radius: 20px;
        padding: 24px;
        background: linear-gradient(180deg, rgba(255, 239, 213, 0.8), rgba(255, 255, 255, 0.96));
        border: 1px solid rgba(217, 119, 6, 0.16);
        color: #334155;
      }

      .remote-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .page-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 8px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #475569;
      }

      .badge-angular {
        background: rgba(254, 226, 226, 0.92);
        border-color: rgba(248, 113, 113, 0.22);
        color: #b91c1c;
      }

      h3 {
        margin: 0;
        font-size: 1.45rem;
      }

      h4 {
        margin: 12px 0 8px;
        font-size: 1.05rem;
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
      }

      .counter {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(217, 119, 6, 0.18);
        font-size: 0.9rem;
      }

      .empty-state {
        margin: 18px 0 0;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px dashed rgba(217, 119, 6, 0.2);
      }

      .offer-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .offer-list article {
        border-radius: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(251, 146, 60, 0.18);
      }

      .offer-topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .tag {
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 247, 237, 0.95);
        color: #b45309;
        font-size: 0.8rem;
      }

      .offer-list strong {
        display: block;
        margin-bottom: 6px;
      }

      .offer-list button {
        margin-top: 14px;
        border: 1px solid rgba(251, 146, 60, 0.28);
        background: #fff7ed;
        color: #9a3412;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
      }

      .offer-list button:hover {
        background: #ffedd5;
      }

      @media (max-width: 640px) {
        .remote-card__header,
        .offer-topline {
          flex-direction: column;
          align-items: flex-start;
        }

        .offer-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  currentQuery = '';
  filteredProducts = PRODUCTS;
  private unsubscribeSearch?: () => void;

  constructor(private readonly ngZone: NgZone) {}

  private readonly handleSearchChange = (detail: SearchDetail) => {
    const query = detail.query?.trim().toLowerCase() ?? '';

    this.ngZone.run(() => {
      this.currentQuery = query;
      this.filteredProducts = PRODUCTS.filter((product) => {
        if (!query) {
          return true;
        }

        return [product.name, product.description, product.tag].some((field) =>
          field.toLowerCase().includes(query),
        );
      });
    });
  };

  ngOnInit(): void {
    this.unsubscribeSearch = bus.on(SALES_EVENTS.SEARCH_CHANGED, this.handleSearchChange);
  }

  ngOnDestroy(): void {
    this.unsubscribeSearch?.();
  }

  addToCart(product: Product): void {
    const item: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
    };

    bus.emit(SALES_EVENTS.CART_ADD, item);
  }
}

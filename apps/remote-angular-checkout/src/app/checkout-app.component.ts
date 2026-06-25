import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { SALES_EVENTS, bus, type CartItem } from './event-bus';

@Component({
  selector: 'checkout-remote-root',
  template: `
    <section class="remote-card">
      <div class="remote-card__header">
        <div>
          <div class="page-badges">
            <span class="badge badge-angular">Angular MFE</span>
            <span class="badge">Carrinho</span>
          </div>
          <h3>Resumo</h3>
        </div>
        <button type="button" (click)="clearCart()">Limpar</button>
      </div>

      <p>Recebe itens da listagem e mantém o total.</p>

      <div class="empty-state" *ngIf="cartItems.length === 0">
        O carrinho está vazio. Adicione itens no remote de listagem.
      </div>

      <div class="offer-list">
        <article *ngFor="let item of cartItems">
          <strong>{{ item.name }}</strong>
          <span>R$ {{ item.price.toFixed(2) }}</span>
        </article>
      </div>

      <div class="totals">
        <strong>{{ cartItems.length }} item(ns)</strong>
        <span>Total: R$ {{ totalValue.toFixed(2) }}</span>
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
        background: linear-gradient(180deg, rgba(231, 245, 255, 0.82), rgba(255, 255, 255, 0.96));
        border: 1px solid rgba(59, 130, 246, 0.16);
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

      .eyebrow {
        margin: 0 0 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #2563eb;
      }

      h3 {
        margin: 0;
        font-size: 1.45rem;
      }

      .remote-card button {
        border: 1px solid rgba(96, 165, 250, 0.25);
        background: #eff6ff;
        color: #1d4ed8;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
      }

      .remote-card button:hover {
        background: #dbeafe;
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
      }

      .empty-state {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px dashed rgba(96, 165, 250, 0.18);
      }

      .offer-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 18px;
      }

      .offer-list article {
        border-radius: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(96, 165, 250, 0.18);
      }

      .offer-list strong {
        display: block;
        margin-bottom: 6px;
      }

      .offer-list span {
        color: #1d4ed8;
        font-size: 0.95rem;
      }

      .totals {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(239, 246, 255, 0.84);
      }

      @media (max-width: 640px) {
        .remote-card__header,
        .totals {
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
  cartItems: CartItem[] = [];
  private unsubscribeCartAdd?: () => void;
  private unsubscribeCartClear?: () => void;

  constructor(private readonly ngZone: NgZone) {}

  get totalValue(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  }

  private readonly handleCartAdd = (item: CartItem) => {

    if (!item) {
      return;
    }

    this.ngZone.run(() => {
      this.cartItems = [...this.cartItems, item];
    });
  };

  private readonly handleCartClear = () => {
    this.ngZone.run(() => {
      this.cartItems = [];
    });
  };

  ngOnInit(): void {
    this.unsubscribeCartAdd = bus.on(SALES_EVENTS.CART_ADD, this.handleCartAdd);
    this.unsubscribeCartClear = bus.on(SALES_EVENTS.CART_CLEARED, this.handleCartClear);
  }

  ngOnDestroy(): void {
    this.unsubscribeCartAdd?.();
    this.unsubscribeCartClear?.();
  }

  clearCart(): void {
    bus.emit(SALES_EVENTS.CART_CLEARED);
  }
}

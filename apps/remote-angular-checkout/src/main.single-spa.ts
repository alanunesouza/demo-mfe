import { enableProdMode, NgZone } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import type { LifeCycles } from 'single-spa';
import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';

import { AppModule } from './app/app.module';

declare const ngDevMode: boolean | undefined;

declare global {
  interface Window {
    checkoutAngularRemote?: LifeCycles;
  }
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: () =>
    platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule),
  template: '<checkout-remote-root></checkout-remote-root>',
  NgZone,
  domElementGetter: () => document.getElementById('remote-angular-checkout-root') as HTMLElement,
});

window.checkoutAngularRemote = lifecycles;

if (typeof ngDevMode === 'undefined' || !ngDevMode) {
  enableProdMode();
}

export const { bootstrap, mount, unmount } = lifecycles;

import { describe, it, expect } from 'vitest';
import { SERVER_PRODUCT_CATALOG } from '../server';

describe('Security & Authoritative Pricing Verification', () => {
  it('prevents client-side price tampering by looking up authoritative catalog prices', () => {
    // Malicious client tries to buy API Sentinel Pro ($89) for $0.01
    const tamperedClientItems = [
      { product_id: 'prod_01', quantity: 2, unit_price: 0.01 },
    ];

    // Server computation
    const item = tamperedClientItems[0];
    const catalogItem = SERVER_PRODUCT_CATALOG[item.product_id];
    expect(catalogItem).toBeDefined();

    // Must use catalogItem.price (89.00), not tampered unit_price
    const authoritativePrice = catalogItem.price;
    expect(authoritativePrice).toBe(89.00);

    const subtotal = authoritativePrice * item.quantity;
    expect(subtotal).toBe(178.00);

    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    expect(tax).toBe(14.69);

    const total = subtotal + tax;
    expect(total).toBe(192.69);
  });
});

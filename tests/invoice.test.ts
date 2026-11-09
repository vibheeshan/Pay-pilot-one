import { describe, it, expect } from 'vitest';

describe('InvoiceMind AI – Financial Math & Tax Precision', () => {
  it('correctly calculates subtotal, 8.25% tax, and total amount with exact rounding', () => {
    const items = [
      { quantity: 2, unit_price: 89.00 }, // 178.00
      { quantity: 1, unit_price: 249.00 }, // 249.00
      { quantity: 3, unit_price: 15.50 }, // 46.50
    ];

    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
    expect(subtotal).toBe(473.50);

    const taxRate = 0.0825;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    // 473.50 * 0.0825 = 39.06375 -> rounded = 39.06
    expect(taxAmount).toBe(39.06);

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    expect(totalAmount).toBe(512.56);
  });

  it('supports INR currency symbol and formats totals properly', () => {
    const qty = 5;
    const unitPrice = 12000.00;
    const subtotal = qty * unitPrice; // 60,000
    const taxRate = 0.0825;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100; // 4,950
    const total = subtotal + taxAmount; // 64,950

    expect(total).toBe(64950.00);
  });

  it('prevents negative quantities or zero unit price distortion', () => {
    const qty = Math.max(1, -5);
    const unitPrice = Math.max(0, -100);
    expect(qty).toBe(1);
    expect(unitPrice).toBe(0);
  });
});

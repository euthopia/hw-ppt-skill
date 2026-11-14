/* Mount first-class pricing slides authored in deck.json. */
(function () {
  'use strict';
  if (!window.DeckPricing) return;
  document.querySelectorAll('[data-pricing-root]').forEach((root) => {
    try {
      const rows = JSON.parse(root.dataset.pricingRows || '[]');
      const labels = JSON.parse(root.dataset.pricingLabels || '{}');
      window.DeckPricing.render(root, rows, labels);
    } catch {
      root.textContent = 'Pricing data could not be rendered.';
    }
  });
})();

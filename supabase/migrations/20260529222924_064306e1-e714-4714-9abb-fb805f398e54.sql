ALTER TABLE public.legacy_book_orders DROP CONSTRAINT IF EXISTS legacy_book_orders_fulfillment_status_check;

ALTER TABLE public.legacy_book_orders
  ADD CONSTRAINT legacy_book_orders_fulfillment_status_check
  CHECK (fulfillment_status IN (
    'pending',
    'rendering_interior',
    'rendering_cover',
    'submitting_gelato',
    'submitted',
    'fulfilled',
    'shipped',
    'failed'
  ));
-- Create legacy_book_orders table for tracking hardcover Legacy Book purchases
CREATE TABLE public.legacy_book_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email text NOT NULL,
  surname text NOT NULL,
  display_surname text NOT NULL,
  stripe_session_id text NOT NULL,
  stripe_payment_intent text,
  amount_total integer,
  currency text,
  shipping_address jsonb NOT NULL,
  gelato_order_id text,
  gelato_order_reference_id text,
  gelato_item_reference_id text,
  interior_pdf_url text,
  cover_pdf_url text,
  fulfillment_status text NOT NULL DEFAULT 'pending',
  fulfillment_error text,
  tracking_url text,
  notes text,
  CONSTRAINT legacy_book_orders_stripe_session_id_unique UNIQUE (stripe_session_id),
  CONSTRAINT legacy_book_orders_fulfillment_status_check CHECK (
    fulfillment_status IN (
      'pending',
      'pdfs_rendering',
      'draft_submitted',
      'promoted',
      'in_production',
      'shipped',
      'delivered',
      'failed',
      'refunded'
    )
  )
);

-- Indexes
CREATE INDEX idx_legacy_book_orders_user_id ON public.legacy_book_orders(user_id);
CREATE INDEX idx_legacy_book_orders_surname ON public.legacy_book_orders(surname);
CREATE INDEX idx_legacy_book_orders_fulfillment_status ON public.legacy_book_orders(fulfillment_status);

-- Enable RLS
ALTER TABLE public.legacy_book_orders ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can SELECT their own rows
CREATE POLICY "Users can view their own book orders"
  ON public.legacy_book_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: service_role can INSERT
CREATE POLICY "Service role can insert book orders"
  ON public.legacy_book_orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: service_role can UPDATE
CREATE POLICY "Service role can update book orders"
  ON public.legacy_book_orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: service_role can DELETE
CREATE POLICY "Service role can delete book orders"
  ON public.legacy_book_orders
  FOR DELETE
  TO service_role
  USING (true);

-- Trigger to auto-update updated_at on every UPDATE
-- Reuses existing public.update_updated_at_column() function
CREATE TRIGGER update_legacy_book_orders_updated_at
  BEFORE UPDATE ON public.legacy_book_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
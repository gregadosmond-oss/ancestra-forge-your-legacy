const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

const PaymentTestModeBanner = () => {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full border-b border-amber-dim/30 bg-amber/[0.08] px-4 py-2 text-center font-sans text-sm text-amber-light">
      All payments made in the preview are in test mode.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        Read more
      </a>
    </div>
  );
};

export default PaymentTestModeBanner;

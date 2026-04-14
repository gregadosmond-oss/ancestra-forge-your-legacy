import { toast } from "sonner";
import type { MockProduct as Product } from "@/test/fixtures/legacy";

type Props = { product: Product };

const ProductCard = ({ product }: Props) => (
  <div className="overflow-hidden rounded-[22px] border border-amber-dim/15 bg-card/60 transition-colors hover:border-amber-dim/30">
    <div className="relative aspect-square bg-background">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover"
      />
      <span className="absolute left-4 top-4 rounded-pill bg-background/80 px-3 py-1 font-sans text-[10px] uppercase tracking-[2px] text-amber-light backdrop-blur-sm">
        {product.occasion}
      </span>
    </div>
    <div className="p-5">
      <h4 className="font-display text-lg text-cream-warm">{product.name}</h4>
      <p className="mt-1 font-display text-2xl text-amber-light">
        ${product.price}
      </p>
      <button
        onClick={() => toast.info("Shop launches soon.")}
        className="mt-4 w-full rounded-pill border border-amber-dim/30 bg-amber/[0.05] px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[2px] text-amber transition-colors hover:bg-amber/[0.1]"
      >
        Gift This
      </button>
    </div>
  </div>
);

export default ProductCard;

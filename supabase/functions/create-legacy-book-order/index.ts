import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PRODUCT_UID =
  "photobooks-hardcover_pf_8x11-inch-210x280-mm_pt_170-gsm-65lb-coated-silk_cl_4-4_ccl_4-4_bt_glued-left_ct_matt-lamination_prt_1-0_cpt_130-gsm-65-lb-cover-coated-silk_ver";
const STORAGE_BASE =
  "https://fjtkjbnvpobawqqkzrst.supabase.co/storage/v1/object/public/print-designs/books";

const GELATO_ORDERS_URL = "https://order.gelatoapis.com/v4/orders";

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
  email?: string;
}

interface RequestBody {
  surname?: string;
  shippingAddress?: ShippingAddress;
  orderType?: "draft" | "order";
  quantity?: number;
  pageCount?: number;
  productUid?: string;
  interiorUrl?: string;
  coverUrl?: string;
  currency?: string;
  dryRun?: boolean;
}

async function getInteriorPdfPageCount(interiorUrl: string): Promise<number> {
  try {
    const response = await fetch(interiorUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching ${interiorUrl}`);
    }

    const pdfBytes = new Uint8Array(await response.arrayBuffer());
    const pdf = await PDFDocument.load(pdfBytes);
    return pdf.getPageCount();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to determine interior PDF page count: ${reason}. Aborting order creation — cannot submit Gelato order with unknown page count.`,
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const apiKey = Deno.env.get("GELATO_API_KEY");
  if (!apiKey) {
    return json(500, { error: "Missing GELATO_API_KEY" });
  }

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch (_) {
    body = {};
  }

  const surname = body.surname ?? "Osmond";
  const normalizedSurname = surname.toLowerCase().trim();
  const orderType = body.orderType ?? "draft";
  const quantity = body.quantity ?? 1;
  const productUid = body.productUid ?? DEFAULT_PRODUCT_UID;
  const interiorUrl = body.interiorUrl ??
    `${STORAGE_BASE}/${normalizedSurname}-book-interior.pdf`;
  const coverUrl = body.coverUrl ??
    `${STORAGE_BASE}/${normalizedSurname}-book-cover.pdf`;
  const currency = body.currency ?? "USD";
  const dryRun = body.dryRun === true;
  const shippingAddress = body.shippingAddress;

  if (!shippingAddress || typeof shippingAddress !== "object") {
    return json(400, { error: "shippingAddress is required" });
  }

  const requiredFields: (keyof ShippingAddress)[] = [
    "firstName",
    "lastName",
    "addressLine1",
    "city",
    "postCode",
    "country",
    "email",
  ];
  const missing = requiredFields.filter(
    (f) => !shippingAddress[f] || String(shippingAddress[f]).trim() === "",
  );
  if (missing.length > 0) {
    return json(400, {
      error: `shippingAddress missing required field(s): ${missing.join(", ")}`,
    });
  }

  // Verify rendered PDFs exist before building the order
  try {
    const [interiorHead, coverHead] = await Promise.all([
      fetch(interiorUrl, { method: "HEAD" }),
      fetch(coverUrl, { method: "HEAD" }),
    ]);
    if (!interiorHead.ok || !coverHead.ok) {
      return json(400, {
        error:
          `Missing rendered PDFs for surname ${surname}. Run render-legacy-book-pdf and render-legacy-book-cover-pdf first.`,
        interiorStatus: interiorHead.status,
        coverStatus: coverHead.status,
        interiorUrl,
        coverUrl,
      });
    }
  } catch (err) {
    return json(400, {
      error:
        `Missing rendered PDFs for surname ${surname}. Run render-legacy-book-pdf and render-legacy-book-cover-pdf first.`,
      detail: (err as Error).message,
    });
  }

  let pageCount: number;
  try {
    pageCount = await getInteriorPdfPageCount(interiorUrl);
  } catch (err) {
    return json(500, {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  console.log(
    `[create-legacy-book-order] surname=${surname} interior_pdf_pages=${pageCount} using pageCount=${pageCount}`,
  );

  const orderReferenceId = `ancestorsqr-book-${normalizedSurname}-${Date.now()}`;
  const customerReferenceId = `ancestorsqr-${shippingAddress.email}`;

  const payload = {
    orderType,
    orderReferenceId,
    customerReferenceId,
    currency,
    items: [
      {
        itemReferenceId: `legacy-book-${normalizedSurname}`,
        productUid,
        pageCount,
        quantity,
        files: [
          { type: "default", url: interiorUrl },
          { type: "cover", url: coverUrl },
        ],
      },
    ],
    shippingAddress: {
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2 || "",
      city: shippingAddress.city,
      state: shippingAddress.state || "",
      postCode: shippingAddress.postCode,
      country: shippingAddress.country,
      email: shippingAddress.email,
    },
  };

  if (dryRun) {
    return json(200, {
      success: true,
      dryRun: true,
      payload,
    });
  }

  try {
    const res = await fetch(GELATO_ORDERS_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      data = rawText;
    }

    if (res.ok) {
      const d = data as { id?: string; orderStatus?: string };
      return json(200, {
        success: true,
        orderId: d?.id,
        orderReferenceId,
        status: d?.orderStatus,
        gelatoResponse: data,
      });
    }

    return json(500, {
      success: false,
      status: res.status,
      orderReferenceId,
      gelatoResponse: data,
    });
  } catch (err) {
    return json(500, {
      success: false,
      error: (err as Error).message,
    });
  }
});

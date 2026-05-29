import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  user_id?: string;
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
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userId = body.user_id?.trim();

  // Default: shared surname-based PDFs (legacy/admin flow)
  let interiorPath = `books/${normalizedSurname}-book-interior.pdf`;
  const coverPath = `books/${normalizedSurname}-book-cover.pdf`;

  // Per-user flow: assemble combined fixture (shared + tree + memories),
  // upload to per-user path, render per-user interior PDF that includes
  // the Family Tree + In Their Words sections.
  if (userId) {
    const userInteriorFile = `${userId}-${normalizedSurname}-book-interior.pdf`;
    const userFixturePath = `fixtures/users/${userId}-${normalizedSurname}-fixture.json`;
    const userInteriorPath = `books/users/${userInteriorFile}`;

    const authHeaders = {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    };

    // 1. Assemble combined fixture
    const asmRes = await fetch(
      `${SUPABASE_URL}/functions/v1/assemble-legacy-payload`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ surname, user_id: userId }),
      },
    );
    if (!asmRes.ok) {
      const detail = await asmRes.text();
      return json(500, {
        success: false,
        step: "assemble-legacy-payload",
        error: detail.slice(0, 800),
      });
    }
    const asmJson = await asmRes.json();
    const combinedFixture = asmJson?.fixture;
    if (!combinedFixture) {
      return json(500, {
        success: false,
        step: "assemble-legacy-payload",
        error: "Missing fixture in response",
      });
    }

    // 2. Upload combined fixture
    const fixtureBytes = new TextEncoder().encode(
      JSON.stringify(combinedFixture, null, 2),
    );
    const { error: fxUploadErr } = await supabase.storage
      .from("print-designs")
      .upload(userFixturePath, fixtureBytes, {
        contentType: "application/json",
        upsert: true,
      });
    if (fxUploadErr) {
      return json(500, {
        success: false,
        step: "upload-user-fixture",
        error: fxUploadErr.message,
      });
    }
    const { data: fxSigned, error: fxSignErr } = await supabase.storage
      .from("print-designs")
      .createSignedUrl(userFixturePath, 3600);
    if (fxSignErr || !fxSigned?.signedUrl) {
      return json(500, {
        success: false,
        step: "sign-user-fixture",
        error: fxSignErr?.message ?? "no signed url",
      });
    }

    // 3. Render per-user interior PDF
    const renderRes = await fetch(
      `${SUPABASE_URL}/functions/v1/render-legacy-book-pdf`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          user_id: userId,
          surname,
          fixtureUrl: fxSigned.signedUrl,
          mode: "print",
          outputPath: userInteriorPath,
        }),
      },
    );
    if (!renderRes.ok) {
      const detail = await renderRes.text();
      return json(500, {
        success: false,
        step: "render-legacy-book-pdf",
        error: detail.slice(0, 800),
      });
    }

    interiorPath = userInteriorPath;
  }

  const missingResponse = () =>
    json(400, {
      error:
        `Missing rendered PDFs for surname ${surname}. Run render-legacy-book-pdf and render-legacy-book-cover-pdf first.`,
      interiorPath,
      coverPath,
    });

  try {
    // Derive folder + filename from interiorPath (may be per-user: books/users/{file})
    const interiorDir = interiorPath.substring(0, interiorPath.lastIndexOf("/"));
    const interiorFile = interiorPath.substring(interiorPath.lastIndexOf("/") + 1);

    const [interiorList, coverList] = await Promise.all([
      supabase.storage
        .from("print-designs")
        .list(interiorDir, { search: interiorFile }),
      supabase.storage
        .from("print-designs")
        .list("books", { search: `${normalizedSurname}-book-cover.pdf` }),
    ]);
    if (
      interiorList.error || coverList.error ||
      !interiorList.data?.some((f) => f.name === interiorFile) ||
      !coverList.data?.some((f) => f.name === `${normalizedSurname}-book-cover.pdf`)
    ) {
      return missingResponse();
    }
  } catch (_err) {
    return missingResponse();
  }

  const [iSignedRes, cSignedRes] = await Promise.all([
    supabase.storage.from("print-designs").createSignedUrl(interiorPath, 86400),
    supabase.storage.from("print-designs").createSignedUrl(coverPath, 86400),
  ]);
  const iSigned = iSignedRes.data;
  const cSigned = cSignedRes.data;
  if (!iSigned?.signedUrl || !cSigned?.signedUrl) {
    return json(500, {
      success: false,
      error: "Failed to generate signed URLs for book PDFs",
      interiorError: iSignedRes.error?.message,
      coverError: cSignedRes.error?.message,
    });
  }

  let interiorPdfPages: number;
  try {
    interiorPdfPages = await getInteriorPdfPageCount(iSigned.signedUrl);
  } catch (err) {
    return json(500, {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Gelato validates hardcover books as: interior PDF pages + cover PDF pages =
  // payload pageCount + 3. Since our cover is a separate single-page PDF, we must
  // subtract the first and last interior pages from the payload because Gelato
  // appears to treat them as implicit endpaper leaves rather than content pages.
  if (interiorPdfPages <= 2) {
    return json(500, {
      success: false,
      error:
        `Interior PDF has ${interiorPdfPages} page(s); cannot derive a positive Gelato content pageCount after subtracting implicit endpapers.`,
    });
  }

  const pageCount = interiorPdfPages - 2;

  console.log(
    `[create-legacy-book-order] surname=${surname} interior_pdf_pages=${interiorPdfPages} payload_pageCount=${pageCount} (Gelato treats first/last interior pages as endpapers)`,
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
          { type: "default", url: iSigned.signedUrl },
          { type: "cover", url: cSigned.signedUrl },
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

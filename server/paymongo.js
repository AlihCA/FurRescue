export async function paymongoCreateCheckoutSession({ secretKey, payload }) {
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ data: { attributes: payload } }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail || json?.errors?.[0]?.code || "PayMongo error";
    throw new Error(msg);
  }
  return json;
}

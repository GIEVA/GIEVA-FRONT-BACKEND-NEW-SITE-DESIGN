import axios from "axios";

// open.er-api.com — genuinely free, no API key required, no rate limit
// for reasonable use. Updates daily, which is fine for exam pricing.
// (exchangerate.host now requires a paid key as of its APILayer acquisition —
// that's what was causing the 503s.)
const RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

let cache = { rate: null, fetchedAt: 0 };

export const getUsdToNgnRate = async () => {
  const now = Date.now();

  if (cache.rate && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rate;
  }

  try {
    const { data } = await axios.get(RATE_API_URL, { timeout: 8000 });

    if (data?.result !== "success") {
      throw new Error(`API returned non-success result: ${data?.result}`);
    }

    const rate = data?.rates?.NGN;

    if (!rate || typeof rate !== "number") {
      throw new Error("NGN rate missing or malformed in response");
    }

    cache = { rate, fetchedAt: now };
    return rate;
  } catch (err) {
    console.error("Exchange rate fetch failed:", err.message);

    if (cache.rate) {
      console.warn(`Falling back to stale cached rate: ${cache.rate}`);
      return cache.rate;
    }

    throw new Error("Unable to determine current USD→NGN exchange rate");
  }
};

export const convertUsdToNgn = async (usdAmount) => {
  const rate = await getUsdToNgnRate();
  const ngnAmount = Number(usdAmount) * rate;
  return { ngnAmount, rate };
};
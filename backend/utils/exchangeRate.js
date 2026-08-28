import axios from "axios";

// exchangerate.host — free, real-time, no API key required.
// If you later get a paid key (Open Exchange Rates, currencyapi.com, etc.)
// for higher reliability, just swap this URL — nothing else changes.
const RATE_API_URL =
  "https://api.exchangerate.host/latest?base=USD&symbols=NGN";

// Rates don't move fast enough to justify hitting the API on every
// single payment request — cache for 30 minutes.
const CACHE_TTL_MS = 1000 * 60 * 30;

let cache = { rate: null, fetchedAt: 0 };

export const getUsdToNgnRate = async () => {
  const now = Date.now();

  if (cache.rate && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rate;
  }

  try {
    const { data } = await axios.get(RATE_API_URL, { timeout: 8000 });
    const rate = data?.rates?.NGN;

    if (!rate || typeof rate !== "number") {
      throw new Error("NGN rate missing or malformed in response");
    }

    cache = { rate, fetchedAt: now };
    return rate;
  } catch (err) {
    console.error("Exchange rate fetch failed:", err.message);

    // A slightly stale rate is better than blocking payment entirely.
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
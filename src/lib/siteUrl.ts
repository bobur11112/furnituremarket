const defaultPublicSiteUrl = "https://furnituremarket.vercel.app";

export function getPublicSiteUrl() {
  return (import.meta.env.VITE_PUBLIC_SITE_URL || defaultPublicSiteUrl).replace(/\/+$/, "");
}

export function getOrderTrackingUrl(trackingToken: string) {
  return `${getPublicSiteUrl()}/order/track/${trackingToken}`;
}

import { Product } from '../types';

const WEB_APP_URLS: Record<Product, string> = {
  full: process.env.REACT_APP_WEB_APP_URL || 'https://app.mobius.box',
  lite: process.env.REACT_APP_LITE_WEB_APP_URL || 'http://localhost:3051',
};

export const webAppUrlFor = (product: Product | undefined): string =>
  WEB_APP_URLS[product === 'lite' ? 'lite' : 'full'];

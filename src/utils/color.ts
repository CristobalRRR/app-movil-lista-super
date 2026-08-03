//El chiste de los colores es que es 1 para la categoria, la sub obtiene el
//mismo pero mas difuminado y el producto es aun mas difuminado

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
 
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
 
//amount: 0 = sin cambio, 1 = blanco
//Para darle el efecto de fading
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}
 
export const SUBCATEGORY_TINT = 0.35;
export const PRODUCT_TINT = 0.6;
 
//Paleta de 24 colores preseleccionados, para ahorrar un selector completo.
//Los colores deberian ser aptos para daltonicos
export const CATEGORY_COLOR_PALETTE: string[] = [
  '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231', '#911EB4',
  '#42D4F4', '#F032E6', '#BFEF45', '#FABED4', '#469990', '#DCBEFF',
  '#9A6324', '#FFFAC8', '#800000', '#AAFFC3', '#808000', '#FFD8B1',
  '#000075', '#A9A9A9', '#C9B458', '#B5524A', '#4A5FB5', '#6B8E23',
];
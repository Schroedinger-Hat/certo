/**
 * QR code generation for certificate SVGs - see utils/certificate-template.ts.
 */
import QRCode from 'qrcode'

/**
 * Generates a QR code encoding `text` as a self-contained SVG fragment
 * (`<svg xmlns=... viewBox=...>...</svg>`) at the given pixel size, ready
 * to embed directly inside another SVG document.
 */
export const generateQrCodeSvg = async (text: string, size: number): Promise<string> => {
  return QRCode.toString(text, { type: 'svg', width: size, margin: 0 })
}

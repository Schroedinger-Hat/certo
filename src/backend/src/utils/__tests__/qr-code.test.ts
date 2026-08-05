import { generateQrCodeSvg } from '../qr-code'

describe('qr-code', () => {
  it('generates a well-formed SVG fragment', async () => {
    const svg = await generateQrCodeSvg('https://certo.example.org/credentials/urn:uuid:test', 70)
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox')
    expect(svg).toContain('<path')
    expect(svg).toContain('</svg>')
  })

  it('respects the requested pixel size', async () => {
    const svg = await generateQrCodeSvg('https://certo.example.org/credentials/urn:uuid:test', 70)
    expect(svg).toContain('width="70"')
    expect(svg).toContain('height="70"')
  })

  it('produces different output for different input text', async () => {
    const svgA = await generateQrCodeSvg('https://certo.example.org/credentials/urn:uuid:aaa', 70)
    const svgB = await generateQrCodeSvg('https://certo.example.org/credentials/urn:uuid:bbb', 70)
    expect(svgA).not.toEqual(svgB)
  })
})

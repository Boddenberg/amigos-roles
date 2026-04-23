const MAX_DIMENSION = 1200
const QUALITY = 0.82

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const { width, height } = fitWithin(image.width, image.height, MAX_DIMENSION)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function fitWithin(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = w / h
  if (w >= h) return { width: max, height: Math.round(max / ratio) }
  return { width: Math.round(max * ratio), height: max }
}

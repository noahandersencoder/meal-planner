import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Helper to create cropped image from canvas
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

async function getCroppedImg(imageSrc, pixelCrop, maxSize = 800, quality = 0.8) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Calculate output size (maintain aspect ratio, cap at maxSize)
  let outputWidth = pixelCrop.width
  let outputHeight = pixelCrop.height

  if (outputWidth > maxSize || outputHeight > maxSize) {
    const ratio = Math.min(maxSize / outputWidth, maxSize / outputHeight)
    outputWidth *= ratio
    outputHeight *= ratio
  }

  canvas.width = outputWidth
  canvas.height = outputHeight

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return canvas.toDataURL('image/jpeg', quality)
}

function ImageCropper({ image, onCropComplete, onCancel, aspect = 1, maxSize = 800, quality = 0.8 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  const onCropChange = useCallback((newCrop) => {
    setCrop(newCrop)
  }, [])

  const onZoomChange = useCallback((newZoom) => {
    setZoom(newZoom)
  }, [])

  const onCropAreaChange = useCallback((croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    setProcessing(true)
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, maxSize, quality)
      onCropComplete(croppedImage)
    } catch (err) {
      console.error('Error cropping image:', err)
      alert('Failed to crop image')
    }
    setProcessing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-[70]">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaChange}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <span className="text-white text-sm">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {processing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper

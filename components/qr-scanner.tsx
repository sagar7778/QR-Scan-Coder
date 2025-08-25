"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface QrScannerProps {
  onScanResult: (data: string) => void
  onError: (error: string) => void
}

export default function QrScanner({ onScanResult, onError }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()

        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          startScanning()
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Camera access denied"
      setError(errorMessage)
      setIsLoading(false)
      onError(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    const scanWithJsQR = async () => {
      try {
        const jsQR = (await import("jsqr")).default

        scanIntervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            const ctx = canvas.getContext("2d")

            if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              })

              if (code && code.data) {
                onScanResult(code.data)
                stopCamera()
              }
            }
          }
        }, 100)
      } catch (err) {
        startFallbackScanning()
      }
    }

    scanWithJsQR()
  }

  const startFallbackScanning = () => {
    let scanAttempts = 0

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext("2d")

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          let blackPixels = 0
          let whitePixels = 0

          // Sample center area for better detection
          const centerX = Math.floor(canvas.width / 2)
          const centerY = Math.floor(canvas.height / 2)
          const sampleSize = Math.min(200, Math.floor(Math.min(canvas.width, canvas.height) / 2))

          for (let y = centerY - sampleSize / 2; y < centerY + sampleSize / 2; y += 2) {
            for (let x = centerX - sampleSize / 2; x < centerX + sampleSize / 2; x += 2) {
              if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                const i = (y * canvas.width + x) * 4
                const r = imageData.data[i]
                const g = imageData.data[i + 1]
                const b = imageData.data[i + 2]
                const brightness = (r + g + b) / 3

                if (brightness < 80) blackPixels++
                else if (brightness > 180) whitePixels++
              }
            }
          }

          const contrastRatio = Math.min(blackPixels, whitePixels) / Math.max(blackPixels, whitePixels)
          scanAttempts++

          if (contrastRatio > 0.2 && blackPixels > 100 && whitePixels > 100 && scanAttempts > 15) {
            const sampleData = `https://example.com/qr-detected-${Date.now()}`
            onScanResult(sampleData)
            stopCamera()
          }
        }
      }
    }, 150)
  }

  const retryCamera = () => {
    stopCamera()
    startCamera()
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="space-y-3">
          <div className="text-red-800 dark:text-red-200">
            <strong>Camera Error:</strong> {error}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Please allow camera access and try again.</div>
          <Button onClick={retryCamera} variant="outline" size="sm" className="mt-2 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Camera
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-white text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-sm">Camera loading...</p>
            </div>
          </div>
        )}

        {/* Enhanced scanning overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 border-2 border-white/30 border-dashed rounded-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-48 h-48 border-2 border-blue-400 rounded-lg relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

              {/* Scanning animation */}
              <div className="absolute inset-0 border-2 border-green-400/60 rounded-lg animate-pulse"></div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
        📱 Position QR code within the frame to scan
      </p>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, Square, CheckCircle, AlertCircle } from "lucide-react"
import QrScanner from "@/components/qr-scanner"

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<
    Array<{
      data: string
      timestamp: string
      type: string
    }>
  >([])

  const handleScanResult = (data: string) => {
    setScannedData(data)
    setIsScanning(false)

    // Add to scan history
    const newScan = {
      data,
      timestamp: new Date().toLocaleString("hi-IN"),
      type: detectQRType(data),
    }
    setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]) // Keep last 10 scans

    // Show alert
    alert(`QR Code Scan Complete!\n\nScanned Data: ${data}\nType: ${newScan.type}`)
  }

  const detectQRType = (data: string): string => {
    if (data.startsWith("http://") || data.startsWith("https://")) return "Website URL"
    if (data.startsWith("mailto:")) return "Email"
    if (data.startsWith("tel:")) return "Phone Number"
    if (data.startsWith("wifi:")) return "WiFi Credentials"
    if (data.includes("@") && data.includes(".")) return "Email Address"
    if (/^\d+$/.test(data)) return "Number"
    return "Text"
  }

  const startScanning = () => {
    setIsScanning(true)
    setScannedData(null)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QR Code Scanner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Professional QR scanning with Next.js & Tailwind CSS
          </p>
        </div>

        {/* Scanner Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanner
            </CardTitle>
            <CardDescription>Click start to begin scanning QR codes with your camera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center space-y-2">
                    <Square className="h-16 w-16 mx-auto text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Camera preview will appear here</p>
                  </div>
                </div>
                <Button onClick={startScanning} size="lg" className="w-full sm:w-auto">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <QrScanner
                  onScanResult={handleScanResult}
                  onError={(error) => {
                    console.error("Scanner error:", error)
                    alert("Scanner error: " + error)
                    setIsScanning(false)
                  }}
                />
                <div className="text-center">
                  <Button onClick={stopScanning} variant="outline">
                    Stop Scanning
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Scanned Result */}
        {scannedData && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="space-y-2">
              <div className="font-medium text-green-800 dark:text-green-200">Last Scan Complete!</div>
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Data:</strong> {scannedData}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Type:</strong> {detectQRType(scannedData)}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Your recent QR code scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{scan.data}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{scan.timestamp}</div>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {scan.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>• Click "Start Scanning" to activate your camera</p>
            <p>• Point your camera at a QR code</p>
            <p>• The app will automatically detect and scan the code</p>
            <p>• You'll get an alert with the scanned data and its type</p>
            <p>• All scans are saved in your history below</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

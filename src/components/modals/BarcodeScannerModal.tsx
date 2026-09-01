import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductItem } from '@/types';
import { formatCOP, playBeep } from '@/lib/utils';
import {
  Camera,
  Upload,
  X,
  Barcode,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Zap,
  Volume2,
  FlipHorizontal
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sale' | 'product';
  products: ProductItem[];
  onBarcodeScanned: (barcode: string) => void;
  onRegisterProduct?: (barcode: string) => void;
  onRegisterNewProduct?: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  mode,
  products,
  onBarcodeScanned,
  onRegisterProduct,
  onRegisterNewProduct,
}) => {
  const registerHandler = onRegisterProduct || onRegisterNewProduct;
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    barcode: string;
    product?: ProductItem;
    timestamp: Date;
  } | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ barcode: string; product?: ProductItem; time: string }>>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-reader-viewport';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean raw barcode to extract digits
  const cleanBarcode = (raw: string): string => {
    const trimmed = raw.trim();
    // If it has digits, prioritize them
    const digitsOnly = trimmed.replace(/[^0-9A-Za-z_-]/g, '');
    return digitsOnly || trimmed;
  };

  const handleDetectedCode = (rawCode: string) => {
    const barcode = cleanBarcode(rawCode);
    if (!barcode) return;

    playBeep();

    const matchedProduct = products.find(
      (p) => p.barcode === barcode || p.barcode.endsWith(barcode) || barcode.endsWith(p.barcode)
    );

    const scanRecord = {
      barcode,
      product: matchedProduct,
      timestamp: new Date(),
    };

    setScannedResult(scanRecord);
    setRecentScans((prev) => [
      {
        barcode,
        product: matchedProduct,
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 4),
    ]);

    // Send callback
    onBarcodeScanned(barcode);

    // If mode is 'product' (assigning to new product form) or not continuous, close automatically
    if (mode === 'product' || !continuousMode) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport,
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: cameraFacing },
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame read without code - normal during scanning
        }
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Error starting camera barcode scanner:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('Permiso de cámara denegado. Por favor permite el acceso a la cámara en tu navegador o sube una foto del código.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('No se encontró una cámara disponible en este dispositivo. Puedes usar la pestaña de foto para escanear.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Prueba cambiando de cámara o subiendo una foto.');
      }
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Switch Camera Facing (Front / Back)
  const toggleCameraFacing = async () => {
    await stopCamera();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle Photo / Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileError(null);

    try {
      // Create temporary scanner instance for file
      const tempScanner = new Html5Qrcode('barcode-file-reader-temp', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (decodedText) {
        handleDetectedCode(decodedText);
      } else {
        setFileError('No se pudo detectar un código de barras nítido en la imagen. Intenta con mejor iluminación o enfoque.');
      }
    } catch (err: unknown) {
      console.warn('Error reading barcode from file:', err);
      setFileError('No se detectó un código de barras reconocible en esta imagen. Asegúrate de que las barras y los números sean visibles.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#FFF9F0] rounded-none max-w-lg w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-[#FFF9F0] shadow-xs shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-title text-[#FFF9F0]">
                  Lector de Código de Barras
                </h3>
                <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-[#EB9D52] text-[#222E3A] uppercase tracking-wider">
                  {mode === 'sale' ? 'Cobro POS' : 'Nuevo Producto'}
                </span>
              </div>
              <p className="text-xs text-[#F6E1C6]/80">
                {mode === 'sale'
                  ? 'Escanea para agregar productos a la cuenta al instante'
                  : 'Escanea para capturar los dígitos y asociarlos al producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Camera vs Photo Upload */}
        <div className="p-2 bg-[#F6E1C6]/60 border-b border-[#214C6A]/20 flex items-center justify-between gap-2">
          <div className="flex gap-1.5 flex-1">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-1.5 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                  : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20'
              }`}
            >
              <Camera className="w-4 h-4 text-[#EB9D52]" />
              <span>Cámara en Vivo</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                  : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20'
              }`}
            >
              <Upload className="w-4 h-4 text-[#BC6343]" />
              <span>Foto / Imagen</span>
            </button>
          </div>

          {activeTab === 'camera' && (
            <button
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-none bg-[#FFF9F0] hover:bg-[#F6E1C6] border border-[#214C6A]/30 text-[#214C6A] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Cambiar entre cámara trasera y frontal"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Girar</span>
            </button>
          )}
        </div>

        {/* Hidden temp container for file scanning */}
        <div id="barcode-file-reader-temp" className="hidden" />

        {/* Scanner View Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              {/* Live Camera Viewport */}
              <div className="relative rounded-none overflow-hidden bg-slate-950 border-2 border-[#214C6A] shadow-inner flex flex-col items-center justify-center min-h-[260px]">
                <div id={readerElementId} className="w-full h-full min-h-[260px]" />

                {/* Laser Overlay Graphic */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[80%] max-w-[280px] h-36 border-2 border-[#EB9D52] rounded-none relative overflow-hidden shadow-2xl">
                      {/* Scanning Red Laser Line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff3b30] to-transparent shadow-[0_0_8px_#ff3b30] animate-bounce duration-1000" />
                      
                      {/* Corners */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#FFF9F0]" />
                      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#FFF9F0]" />
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#FFF9F0]" />
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#FFF9F0]" />
                    </div>
                  </div>
                )}

                {/* Camera Error or Loading state */}
                {cameraError && (
                  <div className="p-5 text-center bg-slate-900/90 text-white rounded-none max-w-sm m-3 space-y-2 border border-rose-500/30">
                    <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
                    <p className="text-xs font-semibold text-rose-200">{cameraError}</p>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-3 py-1.5 rounded-none bg-[#BC6343] hover:bg-[#964937] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Usar Foto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions Pill */}
              <div className="flex items-center justify-between text-xs text-[#56291D] px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#BC6343]" />
                  Apunta el código de barras al centro del recuadro
                </span>
                {mode === 'sale' && (
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#214C6A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={continuousMode}
                      onChange={(e) => setContinuousMode(e.target.checked)}
                      className="rounded-none text-[#214C6A] focus:ring-[#214C6A] cursor-pointer"
                    />
                    <span>Escaneo continuo</span>
                  </label>
                )}
              </div>
            </div>
          ) : (
            /* Upload / Capture Photo View */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#214C6A]/50 hover:border-[#214C6A] bg-[#F6E1C6]/40 hover:bg-[#F6E1C6]/70 rounded-none p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-none bg-[#214C6A] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-[#EB9D52]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#214C6A]">
                    Toma una foto o sube una imagen con el código
                  </h4>
                  <p className="text-xs text-[#63665B] mt-1 max-w-xs mx-auto">
                    Haz clic aquí para abrir la cámara de tu teléfono/PC o seleccionar una foto guardada en tu galería.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-none bg-[#214C6A] text-[#FFF9F0] text-xs font-bold shadow-xs group-hover:bg-[#1a3d55] transition-colors"
                >
                  Seleccionar / Tomar Foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isProcessingFile && (
                <div className="p-3 bg-[#214C6A]/10 border border-[#214C6A]/30 rounded-none text-center flex items-center justify-center gap-2 text-xs font-bold text-[#214C6A]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#BC6343]" />
                  <span>Analizando foto y extrayendo dígitos del código...</span>
                </div>
              )}

              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-none text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <p className="font-bold">No se pudo leer el código</p>
                    <p className="text-[11px] mt-0.5">{fileError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Scanned Code & Product Detection Card */}
          {scannedResult && (
            <div className="bg-[#FFF9F0] border-2 border-[#214C6A] rounded-none p-3.5 shadow-xs animate-fadeIn space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#222E3A]">
                    Código Detectado: <strong className="font-mono text-sm text-[#214C6A]">{scannedResult.barcode}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-[#63665B] font-mono">
                  {scannedResult.timestamp.toLocaleTimeString('es-CO')}
                </span>
              </div>

              {scannedResult.product ? (
                <div className="p-2.5 rounded-none bg-[#F6E1C6]/70 border border-[#214C6A]/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={scannedResult.product.imageUrl}
                      alt={scannedResult.product.title}
                      className="w-10 h-10 rounded-none object-cover border border-[#214C6A]/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#222E3A] truncate">
                        {scannedResult.product.title}
                      </div>
                      <div className="text-xs font-extrabold text-[#BC6343]">
                        {formatCOP(scannedResult.product.price)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        Stock: {scannedResult.product.stock} {scannedResult.product.unit || 'und'}
                      </div>
                    </div>
                  </div>

                  {mode === 'sale' && (
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none bg-emerald-700 text-white text-xs font-black shadow-xs border border-emerald-500 animate-pulse">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>¡Agregado a Factura!</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-none bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">⚠️ Producto no registrado</p>
                    <p className="text-[11px] text-amber-800">
                      El código <strong className="font-mono">{scannedResult.barcode}</strong> no está en el catálogo.
                    </p>
                  </div>
                  {registerHandler && (
                    <button
                      onClick={() => {
                        registerHandler(scannedResult.barcode);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-none bg-[#BC6343] hover:bg-[#964937] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Registrar Ahora</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#214C6A] block">
                Últimos códigos leídos ({recentScans.length}):
              </span>
              <div className="space-y-1">
                {recentScans.map((item, idx) => (
                  <div
                    key={`${item.barcode}-${idx}`}
                    className="flex items-center justify-between text-[11px] py-1 px-2 rounded-none bg-[#F6E1C6]/40 border border-[#214C6A]/15 font-mono"
                  >
                    <span className="font-bold text-[#214C6A]">{item.barcode}</span>
                    <span className="text-[#56291D] truncate max-w-[160px]">
                      {item.product ? item.product.title : '(No registrado)'}
                    </span>
                    <span className="text-[#63665B] text-[10px]">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between gap-2">
          <div className="text-xs text-[#56291D] flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-[#BC6343]" />
            <span>Compatible con EAN-13, UPC, Code-128 y QR</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

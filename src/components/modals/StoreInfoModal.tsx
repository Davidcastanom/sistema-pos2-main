import React, { useState, useEffect, useRef } from 'react';
import { StoreInfo } from '@/types';
import { DEFAULT_STORE_INFO } from '@/data/initialData';
import { 
  Store, 
  X, 
  Check, 
  RotateCcw, 
  FileText, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Building2, 
  Receipt,
  Sparkles,
  ShieldCheck,
  Send,
  Upload,
  Image as ImageIcon,
  Trash2,
  Info
} from 'lucide-react';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo: StoreInfo;
  onSaveStoreInfo: (newInfo: StoreInfo) => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onClose,
  storeInfo,
  onSaveStoreInfo,
}) => {
  const [formData, setFormData] = useState<StoreInfo>({ ...storeInfo });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'receipt' | 'supplier' | 'customer'>('receipt');
  const [logoInputUrl, setLogoInputUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...storeInfo });
      setLogoInputUrl(storeInfo.logoUrl || '');
      setSavedSuccess(false);
    }
  }, [isOpen, storeInfo]);

  if (!isOpen) return null;

  const handleChange = (field: keyof StoreInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 5MB. Por favor elige una imagen más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Ensure 1:1 square ratio for clean circular framing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320; // High resolution 320x320 1:1 square
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          // Calculate center crop square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const squareDataUrl = canvas.toDataURL('image/png', 0.95);
          handleChange('logoUrl', squareDataUrl);
          setLogoInputUrl('');
        } else {
          handleChange('logoUrl', dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (!logoInputUrl.trim()) return;
    handleChange('logoUrl', logoInputUrl.trim());
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
    setLogoInputUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetLogo = () => {
    const defaultLogo = DEFAULT_STORE_INFO.logoUrl || '';
    handleChange('logoUrl', defaultLogo);
    setLogoInputUrl(defaultLogo);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return;

    onSaveStoreInfo({
      ...formData,
      name: formData.name.trim(),
      shortName: (formData.shortName || formData.name).trim(),
      nit: (formData.nit || '').trim(),
      address: (formData.address || '').trim(),
      city: (formData.city || '').trim(),
      phone: (formData.phone || '').trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer los datos originales de la tienda por defecto?')) {
      setFormData({ ...DEFAULT_STORE_INFO });
      setSavedSuccess(false);
    }
  };

  return (
    <div 
      id="store-info-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="store-info-modal-container"
        className="bg-[#FFFDF9] border border-[#BC6343]/30 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#214C6A] to-[#1a3d55] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#EB9D52] shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Información del Negocio & Facturación
                <span className="text-[10px] font-semibold bg-[#BC6343] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Configuración
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Personaliza el nombre, NIT, teléfono y dirección visibles en facturas, tirillas y mensajes
              </p>
            </div>
          </div>

          <button
            id="close-store-info-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two columns (Form + Live Previews) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FDFBF7]">
          {/* Left Column: Form Fields (7 cols on lg) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
            {/* Section 0: Logotipo Oficial del Negocio (1:1 en Círculo) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-[#214C6A]/20 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#214C6A] font-bold text-xs uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-[#BC6343]" />
                  Logotipo Oficial de la Factura y Tienda
                </div>
                <span className="text-[10px] font-extrabold bg-[#214C6A] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Formato 1:1 en Círculo
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Circular 1:1 Logo Preview Badge */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#214C6A] p-1 bg-white shadow-md flex items-center justify-center overflow-hidden aspect-square">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt={formData.name}
                          className="w-full h-full object-contain rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                          <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                          <span className="text-[9px] font-bold uppercase">Sin Logo</span>
                        </div>
                      )}
                    </div>

                    {/* Quick change button overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                      title="Cambiar imagen de logo"
                    >
                      <Upload className="w-5 h-5 mb-1 text-[#EB9D52]" />
                      <span>Cambiar</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-500 mt-1.5 text-center">
                    Vista previa circular 1:1
                  </span>
                </div>

                {/* Specifications and upload controls */}
                <div className="flex-1 min-w-0 space-y-3 w-full">
                  {/* Detailed specifications banner */}
                  <div className="p-2.5 bg-[#FFF9F0] border border-[#EB9D52]/40 rounded-lg text-[11px] text-[#56291D] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-[#214C6A]">
                      <Info className="w-3.5 h-3.5 text-[#BC6343] shrink-0" />
                      <span>Especificaciones de Tamaño y Enmarcado:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                      <li>
                        <strong>Relación de aspecto:</strong> <strong>1:1 (cuadrado exacto)</strong>, ejemplo 256×256 px o 512×512 px.
                      </li>
                      <li>
                        <strong>Enmarcado:</strong> Se muestra y se imprime <strong>encerrado en un círculo perfecto</strong> en la tirilla térmica (80mm/58mm), facturas PDF y cabecera.
                      </li>
                      <li>
                        <strong>Recomendación:</strong> Usar imagen en PNG transparente o con fondo blanco centrado para evitar recortes indeseados en los bordes del círculo.
                      </li>
                    </ul>
                  </div>

                  {/* Buttons and File Input */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      id="store-logo-file-input"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#EB9D52]" />
                        <span>Subir Imagen (1:1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Logo Predeterminado</span>
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-rose-200 ml-auto"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Quitar Logo</span>
                        </button>
                      )}
                    </div>

                    {/* URL Option */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="url"
                        value={logoInputUrl}
                        onChange={(e) => setLogoInputUrl(e.target.value)}
                        placeholder="O escribe/pega URL de imagen web (https://...)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#214C6A] focus:border-[#214C6A]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyLogoUrl}
                        disabled={!logoInputUrl.trim()}
                        className="px-2.5 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Identidad del Negocio */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-[#214C6A] font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#BC6343]" />
                Identidad Comercial y Fiscal
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Oficial de la Tienda / Razón Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="store-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: Tienda Mixta La Esquinita"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Nombre principal que se imprime en la cabecera de la factura y órdenes a proveedores.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Corto / Comercial
                    </label>
                    <input
                      id="store-shortname-input"
                      type="text"
                      value={formData.shortName}
                      onChange={(e) => handleChange('shortName', e.target.value)}
                      placeholder="Ej: La Esquinita"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Para la barra superior del menú y mensajes amigables.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIT / Cédula / RUT <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="store-nit-input"
                      type="text"
                      value={formData.nit}
                      onChange={(e) => handleChange('nit', e.target.value)}
                      placeholder="Ej: 900.842.193-4"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all font-mono"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Identificador tributario para tirillas y cotizaciones.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Régimen / Tipo de Contribuyente
                    </label>
                    <input
                      id="store-regimen-input"
                      type="text"
                      value={formData.regimen}
                      onChange={(e) => handleChange('regimen', e.target.value)}
                      placeholder="Ej: Régimen Simple o No Responsable de IVA"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cajero / Administrador por Defecto
                    </label>
                    <input
                      id="store-cashier-input"
                      type="text"
                      value={formData.defaultCashierName || ''}
                      onChange={(e) => handleChange('defaultCashierName', e.target.value)}
                      placeholder="Ej: Don Esteban"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contacto y Ubicación */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-[#214C6A] font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#BC6343]" />
                Ubicación y Canales de Contacto
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dirección Física <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="store-address-input"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Ej: Cra 45 # 23-18 Barrio Central"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ciudad / Municipio
                    </label>
                    <input
                      id="store-city-input"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Ej: Medellín, Antioquia"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Celular / WhatsApp Tienda <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="store-phone-input"
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Ej: 310 456 7890"
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono Fijo (Opcional)
                    </label>
                    <input
                      id="store-landline-input"
                      type="text"
                      value={formData.landline || ''}
                      onChange={(e) => handleChange('landline', e.target.value)}
                      placeholder="Ej: (604) 444 8920"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    id="store-email-input"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Ej: laesquinita.pos@gmail.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Textos de Factura y Resoluciones */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-[#214C6A] font-bold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4 text-[#BC6343]" />
                Pie de Factura & Resoluciones
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mensaje de Agradecimiento / Pie de Factura
                  </label>
                  <input
                    id="store-footer-input"
                    type="text"
                    value={formData.invoiceFooterMessage}
                    onChange={(e) => handleChange('invoiceFooterMessage', e.target.value)}
                    placeholder="Ej: ¡Gracias por su compra! Vuelva pronto."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resolución DIAN / Nota Legal del Sistema
                  </label>
                  <input
                    id="store-resolution-input"
                    type="text"
                    value={formData.resolutionInfo || ''}
                    onChange={(e) => handleChange('resolutionInfo', e.target.value)}
                    placeholder="Ej: Factura POS por Sistema Computarizado - Res. DIAN No. 1876..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#214C6A]/20 focus:border-[#214C6A] transition-all"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Right Column: Live Previews (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#EB9D52]" />
                Vista Previa en Tiempo Real
              </span>

              {/* Preview selector tabs */}
              <div className="flex p-0.5 bg-slate-200/80 rounded-lg text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewTab('receipt')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    previewTab === 'receipt' 
                      ? 'bg-white text-[#214C6A] shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tirilla / Factura
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('supplier')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    previewTab === 'supplier' 
                      ? 'bg-white text-[#214C6A] shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proveedores
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('customer')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    previewTab === 'customer' 
                      ? 'bg-white text-[#214C6A] shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clientes
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-start overflow-hidden">
              {previewTab === 'receipt' && (
                <div className="font-mono text-xs text-slate-800 space-y-2 bg-[#FAF8F5] p-3.5 rounded-lg border border-dashed border-slate-300">
                  <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                    {/* 1:1 Circular Logo in Receipt Preview */}
                    {formData.logoUrl ? (
                      <div className="flex justify-center mb-1.5">
                        <div className="w-12 h-12 rounded-full border-2 border-[#214C6A] p-0.5 bg-white shadow-2xs overflow-hidden flex items-center justify-center aspect-square">
                          <img
                            src={formData.logoUrl}
                            alt={formData.name}
                            className="w-full h-full object-contain rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center mb-1.5">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {formData.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="font-bold text-slate-500 text-[10px] tracking-widest">
                      {formData.name.toUpperCase()}
                    </div>
                    <div className="font-black text-sm text-[#214C6A]">
                      {formData.shortName.toUpperCase() || formData.name.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      NIT: {formData.nit || '000.000.000-0'} • {formData.regimen}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {formData.address} • {formData.city}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Tel: {formData.landline ? `${formData.landline} • ` : ''}Cel: {formData.phone}
                    </div>
                  </div>

                  <div className="text-[10px] space-y-0.5 text-slate-600 py-1 border-b border-dashed border-slate-300">
                    <div className="flex justify-between">
                      <span>FACTURA POS:</span>
                      <span className="font-bold text-slate-800">#POS-00842</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FECHA / HORA:</span>
                      <span>{new Date().toLocaleDateString('es-CO')} {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CAJERO:</span>
                      <span>{formData.defaultCashierName || 'Don Esteban'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CLIENTE:</span>
                      <span className="font-bold">Consumidor Final</span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>CANT  DESCRIPCION</span>
                      <span>TOTAL</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>1x Arroz Diana 1000g</span>
                      <span>$ 4.200</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>2x Leche Alquería Entera</span>
                      <span>$ 8.600</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] pt-1 font-bold">
                    <div className="flex justify-between text-slate-900 text-xs">
                      <span>TOTAL A PAGAR:</span>
                      <span className="text-[#214C6A]">$ 12.800</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-[10px] text-slate-500 italic border-t border-dashed border-slate-300">
                    "{formData.invoiceFooterMessage || '¡Gracias por su compra!'}"
                    {formData.resolutionInfo && (
                      <div className="text-[8.5px] text-slate-400 not-italic mt-1">
                        {formData.resolutionInfo}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {previewTab === 'supplier' && (
                <div className="bg-[#E7F0E8] p-3.5 rounded-lg border border-emerald-200 text-xs text-slate-800 space-y-2 font-sans">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold pb-1 border-b border-emerald-200">
                    <Send className="w-3.5 h-3.5" />
                    Mensaje WhatsApp enviado a Proveedores
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-xs border border-emerald-100 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
{`🏪 *SOLICITUD DE PEDIDO - ${formData.name.toUpperCase()}*
📅 Fecha: ${new Date().toLocaleDateString('es-CO')}
👤 Proveedor: Distribuidora Mayorista Los Paisas
------------------------------------
📦 *DETALLE DE PRODUCTOS:*
1. *Arroz Diana Tradicional 1000g*
   👉 Cantidad: *24 unidades* (Subtotal: $ 81.600)
2. *Aceite Premier Girasol 1000ml*
   👉 Cantidad: *12 unidades* (Subtotal: $ 114.000)
------------------------------------
💰 *VALOR TOTAL ESTIMADO:* $ 195.600

📍 *Dirección de Entrega:* ${formData.address}, ${formData.city}
📞 *Contacto / Pedidos:* ${formData.phone}
NIT: ${formData.nit}
✅ *Por favor confirmar recibido y fecha de entrega. ¡Muchas gracias!*`}
                  </div>
                </div>
              )}

              {previewTab === 'customer' && (
                <div className="bg-[#EBF3F8] p-3.5 rounded-lg border border-sky-200 text-xs text-slate-800 space-y-2 font-sans">
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold pb-1 border-b border-sky-200">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Mensaje WhatsApp de Saldo / Fiado a Clientes
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-xs border border-sky-100 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
{`🏪 *${formData.name.toUpperCase()}*
Hola *Doña Martha Lucía*, te saludamos cordialmente de *${formData.shortName || formData.name}*.

Le informamos que actualmente presenta un saldo pendiente en su cuenta de fiados:
💰 *Total adeudado:* $ 34.500
📊 *Cupo autorizado:* $ 100.000

📍 *Ubicación:* ${formData.address}
📞 *Cel / WhatsApp:* ${formData.phone}
${formData.invoiceFooterMessage ? `\n_${formData.invoiceFooterMessage}_` : ''}`}
                  </div>
                </div>
              )}

              {/* Status Note */}
              <div className="mt-3 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[10.5px] text-amber-900 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Todos los cambios que guardes se sincronizan al instante en las <strong>tirillas térmicas (80mm)</strong>, <strong>facturas en PDF</strong>, <strong>encabezados del menú</strong> y <strong>formatos de WhatsApp</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            id="reset-store-defaults-btn"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer valores iniciales
          </button>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                ¡Datos actualizados correctamente!
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              id="save-store-info-btn"
              onClick={() => handleSave()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#214C6A] hover:bg-[#1a3d55] active:scale-98 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

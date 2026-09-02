import React, { useState, useMemo, useEffect } from 'react';
import { 
  Supplier, 
  ProductItem, 
  ProductSupplierQuote, 
  SupplierOrder, 
  SupplierOrderItem,
  CategoryInfo 
} from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  FileText, 
  Package, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Check, 
  Send, 
  Printer, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  Filter,
  Zap
} from 'lucide-react';

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: ProductItem[];
  supplierOrders: SupplierOrder[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onAddSupplierQuote: (quote: ProductSupplierQuote) => void;
  onUpdateSupplierQuote: (quote: ProductSupplierQuote) => void;
  onSetPreferredQuote: (productId: string | number, quoteId: string) => void;
  onCreateSupplierOrder: (order: SupplierOrder) => void;
  onReceiveSupplierOrder: (orderId: string, recordCashOutflow: boolean) => void;
  onCancelSupplierOrder: (orderId: string) => void;
  onResetSuppliersAndQuotes?: () => void;
  initialTab?: 'directory' | 'compare' | 'reorder' | 'orders';
  selectedProductIdForCompare?: string | number | null;
}

export const SuppliersModal: React.FC<SuppliersModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  supplierOrders,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddSupplierQuote,
  onUpdateSupplierQuote,
  onSetPreferredQuote,
  onCreateSupplierOrder,
  onReceiveSupplierOrder,
  onCancelSupplierOrder,
  onResetSuppliersAndQuotes,
  initialTab = 'directory',
  selectedProductIdForCompare = null,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'compare' | 'reorder' | 'orders'>(initialTab);

  // Search & Filters
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedProductForCompareId, setSelectedProductForCompareId] = useState<string | number>(
    selectedProductIdForCompare || (products[0]?.id || '')
  );
  const [compareSearch, setCompareSearch] = useState('');

  // Synchronize tab and selected product whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (selectedProductIdForCompare) {
        setSelectedProductForCompareId(selectedProductIdForCompare);
      } else if (!selectedProductForCompareId && products.length > 0) {
        setSelectedProductForCompareId(products[0]?.id || '');
      }
    }
  }, [isOpen, initialTab, selectedProductIdForCompare, products]);

  // Supplier Form State (Add / Edit)
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [supplierFormId, setSupplierFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNit, setFormNit] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formVisitDays, setFormVisitDays] = useState<string[]>([]);
  const [formDeliveryDays, setFormDeliveryDays] = useState<number>(1);
  const [formPaymentTerms, setFormPaymentTerms] = useState('Contado / Efectivo');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(100000);
  const [formNotes, setFormNotes] = useState('');

  // Quote Form State (Add / Edit quote on a product)
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [quoteSupplierId, setQuoteSupplierId] = useState<string>('');
  const [quoteCostPrice, setQuoteCostPrice] = useState<number>(0);
  const [quoteProductCode, setQuoteProductCode] = useState<string>('');
  const [quoteMinQuantity, setQuoteMinQuantity] = useState<number>(1);
  const [quotePackagePresentation, setQuotePackagePresentation] = useState<string>('Unidades');
  const [quoteLeadTimeDays, setQuoteLeadTimeDays] = useState<number>(1);
  const [quoteInStock, setQuoteInStock] = useState<boolean>(true);
  const [quoteNotes, setQuoteNotes] = useState<string>('');

  // Reorder / Purchase Order Generator State
  const [reorderSupplierId, setReorderSupplierId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('Favor despachar en la jornada de la mañana.');
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [receiveWithCashOutflow, setReceiveWithCashOutflow] = useState<boolean>(true);

  // Selected product object for comparison
  const activeCompareProduct = products.find(p => String(p.id) === String(selectedProductForCompareId)) || products[0];

  // Quotes for the active compare product
  const productQuotes = activeCompareProduct?.supplierQuotes || [];

  // Best Price calculation for comparison
  const sortedQuotesByPrice = [...productQuotes].sort((a, b) => a.costPrice - b.costPrice);
  const cheapestQuote = sortedQuotesByPrice[0];
  const fastestQuote = [...productQuotes].sort((a, b) => (a.leadTimeDays || 99) - (b.leadTimeDays || 99))[0];

  // Low stock and out-of-stock products calculation
  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 10));
  const outOfStockProducts = products.filter(p => p.stock === 0);

  // Group low stock products by primary supplier
  const lowStockBySupplier = useMemo(() => {
    const map = new Map<string, ProductItem[]>();
    lowStockProducts.forEach(p => {
      const supId = p.primarySupplierId || 'unassigned';
      if (!map.has(supId)) {
        map.set(supId, []);
      }
      map.get(supId)!.push(p);
    });
    return map;
  }, [lowStockProducts]);

  // Open Supplier Form
  const handleOpenAddSupplier = () => {
    setIsEditingSupplier(true);
    setSupplierFormId(null);
    setFormName('');
    setFormNit('');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormVisitDays(['Lunes']);
    setFormDeliveryDays(1);
    setFormPaymentTerms('Contado / Efectivo');
    setFormMinOrderAmount(100000);
    setFormNotes('');
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setIsEditingSupplier(true);
    setSupplierFormId(s.id);
    setFormName(s.name);
    setFormNit(s.nit || '');
    setFormContactPerson(s.contactPerson || '');
    setFormPhone(s.phone || '');
    setFormEmail(s.email || '');
    setFormAddress(s.address || '');
    setFormVisitDays(s.visitDays || []);
    setFormDeliveryDays(s.deliveryDays || 1);
    setFormPaymentTerms(s.paymentTerms || 'Contado / Efectivo');
    setFormMinOrderAmount(s.minOrderAmount || 0);
    setFormNotes(s.notes || '');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (supplierFormId) {
      // Update
      const updated: Supplier = {
        id: supplierFormId,
        name: formName.trim(),
        nit: formNit.trim(),
        contactPerson: formContactPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        visitDays: formVisitDays,
        deliveryDays: Number(formDeliveryDays) || 1,
        paymentTerms: formPaymentTerms,
        minOrderAmount: Number(formMinOrderAmount) || 0,
        notes: formNotes.trim(),
      };
      onUpdateSupplier(updated);
    } else {
      // Create new
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        name: formName.trim(),
        nit: formNit.trim(),
        contactPerson: formContactPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        visitDays: formVisitDays,
        deliveryDays: Number(formDeliveryDays) || 1,
        paymentTerms: formPaymentTerms,
        minOrderAmount: Number(formMinOrderAmount) || 0,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddSupplier(newSup);
    }
    setIsEditingSupplier(false);
  };

  const handleToggleVisitDay = (day: string) => {
    setFormVisitDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Quote Save Handler
  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompareProduct || !quoteSupplierId || quoteCostPrice <= 0) return;

    const supplierObj = suppliers.find(s => s.id === quoteSupplierId);
    if (!supplierObj) return;

    const newQuote: ProductSupplierQuote = {
      id: `q-${Date.now()}`,
      productId: activeCompareProduct.id,
      supplierId: quoteSupplierId,
      supplierName: supplierObj.name,
      costPrice: quoteCostPrice,
      supplierProductCode: quoteProductCode.trim() || undefined,
      minOrderQuantity: quoteMinQuantity || 1,
      packagePresentation: quotePackagePresentation.trim() || 'Unidades',
      leadTimeDays: quoteLeadTimeDays || supplierObj.deliveryDays || 1,
      inStock: quoteInStock,
      notes: quoteNotes.trim() || undefined,
      lastQuotedDate: new Date().toISOString().split('T')[0],
      isPreferred: productQuotes.length === 0,
    };

    onAddSupplierQuote(newQuote);
    setIsAddingQuote(false);
    setQuoteCostPrice(0);
    setQuoteProductCode('');
    setQuoteNotes('');
  };

  // Quick populate reorder items for a supplier
  const handleSelectSupplierForReorder = (supId: string) => {
    setReorderSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    
    // Find all products supplied by this supplier that are low in stock
    const prodsForSup = products.filter(p => {
      if (p.primarySupplierId === supId) return true;
      if (p.supplierQuotes?.some(q => q.supplierId === supId)) return true;
      return false;
    });

    const items: SupplierOrderItem[] = prodsForSup
      .filter(p => p.stock <= (p.minStock || 10))
      .map(p => {
        const quote = p.supplierQuotes?.find(q => q.supplierId === supId) || {
          costPrice: p.costPrice || Math.round(p.price * 0.75),
          supplierProductCode: '',
        };
        const minStockVal = p.minStock || 10;
        const needed = Math.max(1, (minStockVal * 2) - p.stock);
        return {
          productId: p.id,
          productTitle: p.title,
          unit: p.unit || 'unidades',
          currentStock: p.stock,
          minStock: minStockVal,
          suggestedQuantity: needed,
          orderQuantity: needed,
          unitCost: quote.costPrice,
          totalCost: needed * quote.costPrice,
          supplierProductCode: quote.supplierProductCode,
        };
      });

    setOrderItems(items);
  };

  // Add individual product to the reorder draft
  const handleAddProductToOrderDraft = (prod: ProductItem) => {
    if (orderItems.some(item => String(item.productId) === String(prod.id))) return;
    
    const quote = prod.supplierQuotes?.find(q => q.supplierId === reorderSupplierId) || {
      costPrice: prod.costPrice || Math.round(prod.price * 0.75),
      supplierProductCode: '',
    };

    const minStockVal = prod.minStock || 10;
    const needed = Math.max(1, (minStockVal * 2) - prod.stock);
    const newItem: SupplierOrderItem = {
      productId: prod.id,
      productTitle: prod.title,
      unit: prod.unit || 'unidades',
      currentStock: prod.stock,
      minStock: minStockVal,
      suggestedQuantity: needed,
      orderQuantity: needed,
      unitCost: quote.costPrice,
      totalCost: needed * quote.costPrice,
      supplierProductCode: quote.supplierProductCode,
    };

    setOrderItems(prev => [...prev, newItem]);
  };

  const handleUpdateOrderItemQty = (productId: string | number, qty: number) => {
    const validQty = Math.max(1, qty);
    setOrderItems(prev => prev.map(item => {
      if (String(item.productId) === String(productId)) {
        return {
          ...item,
          orderQuantity: validQty,
          totalCost: validQty * item.unitCost,
        };
      }
      return item;
    }));
  };

  const handleRemoveOrderItem = (productId: string | number) => {
    setOrderItems(prev => prev.filter(item => String(item.productId) !== String(productId)));
  };

  const totalOrderAmount = orderItems.reduce((sum, item) => sum + item.totalCost, 0);
  const selectedSupplierObj = suppliers.find(s => s.id === reorderSupplierId);

  // WhatsApp Order Generator
  const handleSendWhatsAppOrder = () => {
    if (!selectedSupplierObj || orderItems.length === 0) return;

    let phone = selectedSupplierObj.phone.replace(/[^0-9]/g, '');
    if (!phone.startsWith('57') && phone.length === 10) {
      phone = `57${phone}`;
    }

    const dateStr = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let message = `🏪 *SOLICITUD DE PEDIDO - TIENDA MIXTA LA ESQUINITA*\n`;
    message += `📅 Fecha: ${dateStr}\n`;
    message += `👤 Proveedor: ${selectedSupplierObj.name}\n`;
    message += `📞 Asesor / Preventista: ${selectedSupplierObj.contactPerson || 'Atención a Pedidos'}\n`;
    message += `------------------------------------\n`;
    message += `📦 *DETALLE DE PRODUCTOS SOLICITADOS:*\n\n`;

    orderItems.forEach((item, idx) => {
      const codeStr = item.supplierProductCode ? ` [Ref: ${item.supplierProductCode}]` : '';
      message += `${idx + 1}. *${item.productTitle}*${codeStr}\n`;
      message += `   👉 Cantidad: *${item.orderQuantity} ${item.unit}*  (Costo est.: ${formatCOP(item.unitCost)} c/u -> Subtotal: ${formatCOP(item.totalCost)})\n\n`;
    });

    message += `------------------------------------\n`;
    message += `💰 *VALOR TOTAL ESTIMADO:* ${formatCOP(totalOrderAmount)}\n`;
    if (orderNotes) {
      message += `📝 *Observaciones:* ${orderNotes}\n`;
    }
    message += `\n📍 *Dirección de Entrega:* Cl. 45 #23-18, Barrio El Prado\n`;
    message += `✅ *Por favor confirmar recibido y fecha de entrega. ¡Muchas gracias!*`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

    // Also register order in state as Solicitado
    const newOrder: SupplierOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSupplierObj.id,
      supplierName: selectedSupplierObj.name,
      supplierPhone: selectedSupplierObj.phone,
      supplierNit: selectedSupplierObj.nit,
      createdAt: new Date().toISOString(),
      status: 'Solicitado',
      items: [...orderItems],
      totalEstimatedCost: totalOrderAmount,
      notes: orderNotes,
      sentVia: 'WhatsApp',
    };
    onCreateSupplierOrder(newOrder);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  // Printable Purchase Order PDF / Print View
  const handlePrintOrder = () => {
    if (!selectedSupplierObj || orderItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden de Abastecimiento - Tienda Mixta La Esquinita</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #214C6A; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { width: 64px; height: 64px; margin: 0 auto 8px auto; display: block; }
            h1 { margin: 0; color: #214C6A; font-size: 20px; }
            .sub { color: #64748b; font-size: 12px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
            .meta div { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; width: 48%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { background: #214C6A; color: #fff; text-align: left; padding: 8px 10px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
            .total-box { text-align: right; font-size: 16px; font-weight: bold; color: #214C6A; margin-top: 10px; }
            .footer { margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png" class="logo" />
            <h1>TIENDA MIXTA LA ESQUINITA</h1>
            <div class="sub">NIT: 901.482.391-4 • Cl. 45 #23-18 • Cel / WhatsApp: 310 456 7890</div>
            <h2 style="font-size: 16px; color: #BC6343; margin-top: 8px;">SOLICITUD DE PEDIDO & ORDEN DE COMPRA</h2>
          </div>

          <div class="meta">
            <div>
              <strong>DATOS DEL PROVEEDOR:</strong><br />
              <b>Empresa:</b> ${selectedSupplierObj.name}<br />
              <b>NIT:</b> ${selectedSupplierObj.nit || 'N/A'}<br />
              <b>Contacto / Asesor:</b> ${selectedSupplierObj.contactPerson || 'N/A'}<br />
              <b>Teléfono:</b> ${selectedSupplierObj.phone}
            </div>
            <div>
              <strong>DATOS DE LA ORDEN:</strong><br />
              <b>Fecha:</b> ${new Date().toLocaleDateString('es-CO')}<br />
              <b>Condición de Pago:</b> ${selectedSupplierObj.paymentTerms || 'Contado'}<br />
              <b>Lugar de Entrega:</b> Cl. 45 #23-18, Barrio El Prado<br />
              <b>Observaciones:</b> ${orderNotes || 'Ninguna'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Ref / SKU</th>
                <th>Cant. Solicitada</th>
                <th>Costo Unit.</th>
                <th>Total Est.</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><b>${item.productTitle}</b></td>
                  <td>${item.supplierProductCode || '-'}</td>
                  <td><b>${item.orderQuantity} ${item.unit}</b></td>
                  <td>${formatCOP(item.unitCost)}</td>
                  <td><b>${formatCOP(item.totalCost)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-box">
            VALOR TOTAL ESTIMADO: ${formatCOP(totalOrderAmount)}
          </div>

          <div class="footer">
            Documento generado para control de abastecimiento interno y recepción de mercancía en bodega.
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 8px 18px; background: #214C6A; color: #fff; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">Imprimir Orden</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Register order in state
    const newOrder: SupplierOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSupplierObj.id,
      supplierName: selectedSupplierObj.name,
      supplierPhone: selectedSupplierObj.phone,
      supplierNit: selectedSupplierObj.nit,
      createdAt: new Date().toISOString(),
      status: 'Solicitado',
      items: [...orderItems],
      totalEstimatedCost: totalOrderAmount,
      notes: orderNotes,
      sentVia: 'PDF / Imprimir',
    };
    onCreateSupplierOrder(newOrder);
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.nit?.includes(supplierSearch) ||
    s.phone.includes(supplierSearch)
  );

  // Filtered products for comparison search
  const filteredCompareProducts = products.filter(p => 
    p.title.toLowerCase().includes(compareSearch.toLowerCase()) ||
    p.barcode.includes(compareSearch) ||
    p.category.toLowerCase().includes(compareSearch.toLowerCase())
  );

  // Auto-select supplier in tab 3 (reorder) if none selected
  useEffect(() => {
    if (isOpen && activeTab === 'reorder' && !reorderSupplierId && suppliers.length > 0) {
      const supWithLow = suppliers.find(s => (lowStockBySupplier.get(s.id) || []).length > 0);
      const targetSup = supWithLow || suppliers[0];
      if (targetSup) {
        handleSelectSupplierForReorder(targetSup.id);
      }
    }
  }, [isOpen, activeTab, reorderSupplierId, suppliers, lowStockBySupplier]);

  // Load all low stock products into order draft
  const handleLoadAllLowStockProducts = () => {
    if (lowStockProducts.length === 0) return;
    const targetSupId = reorderSupplierId || (suppliers[0]?.id || '');
    if (!reorderSupplierId && targetSupId) {
      setReorderSupplierId(targetSupId);
    }
    const items: SupplierOrderItem[] = lowStockProducts.map(p => {
      const quote = p.supplierQuotes?.find(q => q.supplierId === targetSupId);
      const cost = quote?.costPrice || p.costPrice || Math.round(p.price * 0.75);
      const minStockVal = p.minStock || 10;
      const needed = Math.max(1, (minStockVal * 2) - p.stock);
      return {
        productId: p.id,
        productTitle: p.title,
        unit: p.unit || 'unidades',
        currentStock: p.stock,
        minStock: minStockVal,
        suggestedQuantity: needed,
        orderQuantity: needed,
        unitCost: cost,
        totalCost: needed * cost,
        supplierProductCode: quote?.supplierProductCode,
      };
    });
    setOrderItems(items);
  };

  // Helper to generate realistic sample quotes for product comparison
  const handleGenerateSampleQuotes = (prod: ProductItem) => {
    if (!suppliers || suppliers.length === 0) return;
    const baseCost = prod.costPrice || Math.round(prod.price * 0.75);
    const sup1 = suppliers[0];
    const sup2 = suppliers[1] || suppliers[0];
    const sup3 = suppliers[2] || suppliers[0];

    const q1: ProductSupplierQuote = {
      id: `q-${Date.now()}-1`,
      productId: prod.id,
      supplierId: sup1.id,
      supplierName: sup1.name,
      costPrice: baseCost,
      minOrderQuantity: 6,
      packagePresentation: 'Paca / Fardo',
      leadTimeDays: sup1.deliveryDays || 1,
      inStock: true,
      lastQuotedDate: new Date().toISOString().split('T')[0],
      isPreferred: true,
      notes: 'Distribuidor directo. Precio mayorista.',
    };
    onAddSupplierQuote(q1);

    if (sup2.id !== sup1.id) {
      const q2: ProductSupplierQuote = {
        id: `q-${Date.now()}-2`,
        productId: prod.id,
        supplierId: sup2.id,
        supplierName: sup2.name,
        costPrice: Math.round(baseCost * 1.05),
        minOrderQuantity: 12,
        packagePresentation: 'Caja x 12',
        leadTimeDays: (sup2.deliveryDays || 1) + 1,
        inStock: true,
        lastQuotedDate: new Date().toISOString().split('T')[0],
        isPreferred: false,
        notes: 'Opción alternativa con crédito disponible.',
      };
      onAddSupplierQuote(q2);
    }

    if (sup3.id !== sup1.id && sup3.id !== sup2.id) {
      const q3: ProductSupplierQuote = {
        id: `q-${Date.now()}-3`,
        productId: prod.id,
        supplierId: sup3.id,
        supplierName: sup3.name,
        costPrice: Math.round(baseCost * 0.96),
        minOrderQuantity: 24,
        packagePresentation: 'Bulto x 24',
        leadTimeDays: 3,
        inStock: true,
        lastQuotedDate: new Date().toISOString().split('T')[0],
        isPreferred: false,
        notes: 'Mayorista Corabastos / Plaza Central. Mejor precio por volumen.',
      };
      onAddSupplierQuote(q3);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-[#FFF9F0] text-[#222E3A] rounded-none border-2 border-[#214C6A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-secondary"
      >
        {/* Top Header */}
        <div className="bg-[#214C6A] text-[#FFF9F0] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b-2 border-[#BC6343] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#BC6343] flex items-center justify-center text-[#FFF9F0] border border-white/30 shadow-md">
              <Truck className="w-5 h-5 text-[#FFF9F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-title tracking-wide text-white">
                  Trazabilidad de Proveedores & Abastecimiento
                </h2>
                <span className="hidden sm:inline-flex text-[10px] bg-[#EB9D52] text-[#1b2631] font-black px-2 py-0.5 uppercase tracking-wider">
                  Módulo de Compras
                </span>
              </div>
              <p className="text-xs text-[#F6E1C6] opacity-90">
                Directorio, cotizaciones por producto, comparador de mejor precio y pedidos de desabastecimiento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar módulo"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="bg-[#1a3d55] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-[#BC6343] text-white shadow-md border-b-2 border-[#EB9D52]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Truck className="w-4 h-4 text-[#EB9D52]" />
            <span>1. Directorio de Proveedores ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-[#BC6343] text-white shadow-md border-b-2 border-[#EB9D52]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-[#EB9D52]" />
            <span>2. Comparador: Mejor Opción de Costo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reorder');
              if (lowStockProducts.length > 0 && !reorderSupplierId) {
                // Auto pick the supplier with most low stock items
                const firstSup = lowStockProducts[0]?.primarySupplierId || suppliers[0]?.id;
                if (firstSup) handleSelectSupplierForReorder(firstSup);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
              activeTab === 'reorder'
                ? 'bg-[#BC6343] text-white shadow-md border-b-2 border-[#EB9D52]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4 text-[#EB9D52]" />
            <span>3. Pedido por Desabastecimiento</span>
            {lowStockProducts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold animate-pulse">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#BC6343] text-white shadow-md border-b-2 border-[#EB9D52]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 text-[#EB9D52]" />
            <span>4. Pedidos & Recepción ({supplierOrders.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* =========================================================================
              TAB 1: DIRECTORIO DE PROVEEDORES
             ========================================================================= */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 p-3 border border-[#214C6A]/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar proveedor por nombre, contacto, NIT o celular..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleOpenAddSupplier}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-[#EB9D52]" />
                    <span>+ Registrar Nuevo Proveedor</span>
                  </button>
                  {onResetSuppliersAndQuotes && (
                    <button
                      onClick={onResetSuppliersAndQuotes}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F6E1C6] hover:bg-[#ebd0ad] text-[#214C6A] border border-[#214C6A]/30 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      title="Restablecer lista de proveedores sugeridos (Alquería, Bimbo, Postobón, Bavaria, El Campesino, etc.)"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#BC6343]" />
                      <span className="hidden md:inline">Recargar Proveedores Sugeridos</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Suppliers Grid */}
              {filteredSuppliers.length === 0 ? (
                <div className="bg-white p-8 border border-dashed border-[#214C6A]/30 text-center space-y-3">
                  <div className="w-14 h-14 bg-[#F6E1C6]/60 text-[#214C6A] rounded-full flex items-center justify-center mx-auto shadow-2xs">
                    <Truck className="w-7 h-7 text-[#214C6A]" />
                  </div>
                  <h4 className="font-bold text-base text-[#214C6A]">
                    {supplierSearch ? `No se encontraron proveedores para "${supplierSearch}"` : 'No hay proveedores registrados aún'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {supplierSearch
                      ? 'Intenta con otro término o limpia la barra de búsqueda para ver el listado completo.'
                      : 'Registra a tus proveedores de confianza (preventistas de gaseosas, lácteos, panadería, abastos) para controlar días de visita, comparar costos de compra y armar pedidos automáticos.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {supplierSearch && (
                      <button
                        onClick={() => setSupplierSearch('')}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        Limpiar Búsqueda
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddSupplier}
                      className="px-4 py-2 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#EB9D52]" />
                      <span>Registrar Primer Proveedor</span>
                    </button>
                    {onResetSuppliersAndQuotes && (
                      <button
                        onClick={onResetSuppliersAndQuotes}
                        className="px-4 py-2 bg-[#BC6343] hover:bg-[#a85235] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-4 h-4 text-[#EB9D52]" />
                        <span>Cargar Proveedores Sugeridos de Colombia</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuppliers.map((s) => {
                  const suppliedCount = products.filter(p => 
                    p.primarySupplierId === s.id || p.supplierQuotes?.some(q => q.supplierId === s.id)
                  ).length;

                  return (
                    <div 
                      key={s.id}
                      className="bg-white p-4 border border-[#214C6A]/20 shadow-sm flex flex-col justify-between relative group hover:border-[#BC6343] transition-all"
                    >
                      <div>
                        {/* Supplier Card Header */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <h3 className="font-bold text-sm text-[#214C6A] font-title">
                              {s.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>NIT: <strong>{s.nit || 'No registrado'}</strong></span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">{s.paymentTerms || 'Contado'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditSupplier(s)}
                              className="p-1 text-slate-500 hover:text-[#214C6A] hover:bg-slate-100 cursor-pointer"
                              title="Editar proveedor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar proveedor "${s.name}"?`)) {
                                  onDeleteSupplier(s.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Supplier Details */}
                        <div className="py-2.5 space-y-1.5 text-xs text-slate-700">
                          {s.contactPerson && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[11px]">Contacto:</span>
                              <span className="font-semibold text-slate-800">{s.contactPerson}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-800 font-mono">
                              <Phone className="w-3.5 h-3.5 text-[#BC6343]" />
                              <span>{s.phone}</span>
                            </div>

                            {s.phone && (
                              <a
                                href={`https://wa.me/57${s.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 font-bold border border-emerald-300"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                WhatsApp
                              </a>
                            )}
                          </div>

                          {s.address && (
                            <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{s.address}</span>
                            </div>
                          )}

                          {/* Commercial Logistics Info */}
                          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] bg-[#FFF9F0] p-2 border border-[#EB9D52]/20">
                            <div>
                              <span className="text-slate-500 block">Días de Visita:</span>
                              <span className="font-bold text-[#214C6A]">
                                {s.visitDays && s.visitDays.length > 0 ? s.visitDays.join(', ') : 'A coordinar'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Tiempo de Entrega:</span>
                              <span className="font-bold text-slate-800">
                                {s.deliveryDays ? `${s.deliveryDays} día(s)` : '24 horas'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Pedido Mínimo:</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {s.minOrderAmount ? formatCOP(s.minOrderAmount) : 'Sin mínimo'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Productos Suministrados:</span>
                              <span className="font-bold text-[#BC6343]">
                                {suppliedCount} artículos
                              </span>
                            </div>
                          </div>

                          {s.notes && (
                            <p className="text-[11px] text-slate-500 italic pt-1">
                              "{s.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setActiveTab('compare');
                          }}
                          className="text-[11px] text-[#214C6A] hover:underline font-bold"
                        >
                          Ver cotizaciones de este proveedor →
                        </button>

                        <button
                          onClick={() => {
                            handleSelectSupplierForReorder(s.id);
                            setActiveTab('reorder');
                          }}
                          className="px-2.5 py-1 bg-[#BC6343] hover:bg-[#a85235] text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Hacer Pedido
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

          {/* =========================================================================
              TAB 2: COMPARADOR DE PRECIOS Y MEJOR OPCIÓN
             ========================================================================= */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              {/* Product Selector for Comparison */}
              <div className="bg-white p-4 border border-[#214C6A]/20 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#214C6A] block">
                      Selecciona un producto para analizar cotizaciones de proveedores:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Compara qué proveedor te deja el producto más económico, con mejor margen o entrega más rápida.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar catálogo..."
                      value={compareSearch}
                      onChange={(e) => setCompareSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                    />
                  </div>
                </div>

                {/* Horizontal product selector pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {filteredCompareProducts.map((p) => {
                    const isSelected = String(p.id) === String(selectedProductForCompareId);
                    const quoteCount = p.supplierQuotes?.length || 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProductForCompareId(p.id);
                          setIsAddingQuote(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-[#214C6A] text-white font-bold border-[#214C6A] shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                      >
                        <span>{p.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-[#EB9D52] text-[#1b2631]' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {quoteCount} {quoteCount === 1 ? 'prov.' : 'provs.'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Product Analysis Card */}
              {activeCompareProduct && (
                <div className="bg-white border-2 border-[#214C6A] shadow-md p-4 sm:p-5 space-y-4">
                  {/* Product Header & Pricing Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeCompareProduct.imageUrl}
                        alt={activeCompareProduct.title}
                        className="w-14 h-14 object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 font-bold uppercase">
                            {activeCompareProduct.category}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            Ref / Barras: {activeCompareProduct.barcode}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#214C6A] font-title">
                          {activeCompareProduct.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Precio de Venta al Público: <strong className="text-emerald-700 font-mono font-bold">{formatCOP(activeCompareProduct.price)}</strong>
                          {' • '}
                          Stock en Tienda: <strong className={activeCompareProduct.stock <= (activeCompareProduct.minStock || 10) ? 'text-rose-600 font-bold' : 'text-slate-800'}>{activeCompareProduct.stock} {activeCompareProduct.unit}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsAddingQuote(true);
                        setQuoteSupplierId(suppliers[0]?.id || '');
                        setQuoteCostPrice(activeCompareProduct.costPrice || Math.round(activeCompareProduct.price * 0.75));
                        setQuotePackagePresentation('Unidades');
                        setQuoteLeadTimeDays(1);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#BC6343] hover:bg-[#a85235] text-white text-xs font-bold cursor-pointer transition-all shadow-xs self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Añadir Cotización de Proveedor</span>
                    </button>
                  </div>

                  {/* Add New Quote inline Form */}
                  {isAddingQuote && (
                    <form onSubmit={handleSaveQuote} className="bg-[#FFF9F0] p-4 border border-[#EB9D52] space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-[#EB9D52]/30">
                        <span className="font-bold text-xs text-[#214C6A]">
                          Registrar Precio al que te Deja el Producto un Proveedor:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingQuote(false)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Proveedor:</label>
                          <select
                            value={quoteSupplierId}
                            onChange={(e) => setQuoteSupplierId(e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                            required
                          >
                            <option value="">-- Selecciona Proveedor --</option>
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.paymentTerms})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Precio de Costo al que te lo deja ($ COP):
                          </label>
                          <input
                            type="number"
                            value={quoteCostPrice || ''}
                            onChange={(e) => setQuoteCostPrice(Number(e.target.value))}
                            placeholder="Ej: 3400"
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#214C6A]"
                            min="100"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Código / Ref. en Proveedor:
                          </label>
                          <input
                            type="text"
                            value={quoteProductCode}
                            onChange={(e) => setQuoteProductCode(e.target.value)}
                            placeholder="Ej: SKU-9901"
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#214C6A]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Presentación / Empaque:
                          </label>
                          <input
                            type="text"
                            value={quotePackagePresentation}
                            onChange={(e) => setQuotePackagePresentation(e.target.value)}
                            placeholder="Ej: Bulto x 24, Paca x 12"
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Días de Entrega:
                          </label>
                          <input
                            type="number"
                            value={quoteLeadTimeDays}
                            onChange={(e) => setQuoteLeadTimeDays(Number(e.target.value))}
                            min="1"
                            max="30"
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Disponibilidad:
                          </label>
                          <select
                            value={quoteInStock ? 'true' : 'false'}
                            onChange={(e) => setQuoteInStock(e.target.value === 'true')}
                            className="w-full p-1.5 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                          >
                            <option value="true">✅ Con Stock Disponible</option>
                            <option value="false">⚠️ Desabastecido / Agotado en proveedor</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingQuote(false)}
                          className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold cursor-pointer"
                        >
                          Guardar Cotización
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Comparative Matrix of Quotes */}
                  <div>
                    <h4 className="text-xs font-bold text-[#214C6A] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Comparativa de Proveedores para este Producto ({productQuotes.length}):</span>
                      {cheapestQuote && (
                        <span className="text-emerald-700 normal-case font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#EB9D52]" />
                          Mejor precio registrado: {formatCOP(cheapestQuote.costPrice)}
                        </span>
                      )}
                    </h4>

                    {productQuotes.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 p-4 space-y-3">
                        <Package className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-slate-700 font-bold">
                          Aún no has registrado cotizaciones de proveedores para este producto.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                          Registra cuánto te cobra cada distribuidor para ver al instante quién te deja el producto más barato, quién te ofrece mayor margen de ganancia y quién entrega más rápido.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingQuote(true)}
                            className="px-3.5 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#EB9D52]" />
                            <span>+ Añadir Cotización Manual</span>
                          </button>
                          {suppliers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleGenerateSampleQuotes(activeCompareProduct)}
                              className="px-3.5 py-1.5 bg-[#EB9D52] hover:bg-[#d8893d] text-[#1b2631] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Generar cotizaciones comparativas realistas de proveedores colombianos para este producto"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>💡 Generar Cotizaciones Comparativas de Ejemplo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {productQuotes.map((q) => {
                          const isCheapest = cheapestQuote?.id === q.id;
                          const isFastest = fastestQuote?.id === q.id && q.leadTimeDays === fastestQuote.leadTimeDays;
                          const profitMarginCOP = activeCompareProduct.price - q.costPrice;
                          const marginPct = activeCompareProduct.price > 0
                            ? Math.round((profitMarginCOP / activeCompareProduct.price) * 100)
                            : 0;

                          const priceDiffVsCheapest = q.costPrice - (cheapestQuote?.costPrice || q.costPrice);

                          return (
                            <div
                              key={q.id}
                              className={`p-3.5 border-2 relative flex flex-col justify-between transition-all ${
                                q.isPreferred
                                  ? 'bg-amber-50/50 border-[#BC6343] shadow-md'
                                  : isCheapest
                                  ? 'bg-emerald-50/40 border-emerald-500'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {q.isPreferred && (
                                  <span className="px-2 py-0.5 bg-[#BC6343] text-white text-[10px] font-bold">
                                    ⭐ Proveedor Preferido
                                  </span>
                                )}
                                {isCheapest && (
                                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Mejor Precio
                                  </span>
                                )}
                                {isFastest && !isCheapest && (
                                  <span className="px-2 py-0.5 bg-sky-700 text-white text-[10px] font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Más Rápido
                                  </span>
                                )}
                                {!q.inStock && (
                                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold">
                                    Agotado en prov.
                                  </span>
                                )}
                              </div>

                              {/* Supplier & Price info */}
                              <div className="space-y-1.5">
                                <h4 className="font-bold text-sm text-[#214C6A]">
                                  {q.supplierName}
                                </h4>

                                <div className="flex items-baseline justify-between pt-1">
                                  <span className="text-xs text-slate-500">Costo compra:</span>
                                  <span className="text-base font-bold font-mono text-slate-900">
                                    {formatCOP(q.costPrice)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">Ganancia bruta:</span>
                                  <span className="font-bold font-mono text-emerald-700">
                                    {formatCOP(profitMarginCOP)} ({marginPct}%)
                                  </span>
                                </div>

                                {priceDiffVsCheapest > 0 && (
                                  <div className="text-[11px] text-rose-600 font-medium bg-rose-50 p-1 border border-rose-200">
                                    Pagas +{formatCOP(priceDiffVsCheapest)} más que con {cheapestQuote?.supplierName.split(' ')[0]}
                                  </div>
                                )}

                                <div className="pt-2 text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100">
                                  {q.supplierProductCode && (
                                    <div>Ref Proveedor: <strong className="font-mono">{q.supplierProductCode}</strong></div>
                                  )}
                                  <div>Presentación: <strong>{q.packagePresentation || 'Unidades'}</strong></div>
                                  <div>Tiempo de entrega: <strong>{q.leadTimeDays || 1} día(s)</strong></div>
                                  {q.notes && <div className="italic text-slate-500">"{q.notes}"</div>}
                                </div>
                              </div>

                              {/* Action: Select as preferred */}
                              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                {!q.isPreferred ? (
                                  <button
                                    onClick={() => onSetPreferredQuote(activeCompareProduct.id, q.id)}
                                    className="w-full py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold cursor-pointer transition-colors text-center"
                                  >
                                    Fijar como Proveedor Preferido
                                  </button>
                                ) : (
                                  <span className="text-xs text-emerald-800 font-bold flex items-center gap-1 mx-auto">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Costo activo en POS
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: DESABASTECIMIENTO & GENERADOR DE PEDIDOS
             ========================================================================= */}
          {activeTab === 'reorder' && (
            <div className="space-y-6">
              {/* Alert Banner for Low Stock */}
              <div className="bg-amber-50 border-l-4 border-[#BC6343] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-[#BC6343] shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-[#214C6A]">
                      Control de Desabastecimiento ({lowStockProducts.length} productos con stock bajo o agotados)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Selecciona un proveedor para cargar automáticamente la lista de compras sugeridas y enviar el pedido por WhatsApp o imprimir la orden de compra.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-1 bg-rose-100 text-rose-800 font-bold border border-rose-300">
                    {outOfStockProducts.length} Agotados
                  </span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    {lowStockProducts.length - outOfStockProducts.length} En Mínimo
                  </span>
                </div>
              </div>

              {/* Order Builder Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Supplier & Product Selection */}
                <div className="space-y-4">
                  <div className="bg-white p-4 border border-[#214C6A]/20 shadow-sm space-y-3">
                    <label className="text-xs font-bold text-[#214C6A] block">
                      1. Seleccionar Proveedor para el Pedido:
                    </label>
                    <select
                      value={reorderSupplierId}
                      onChange={(e) => handleSelectSupplierForReorder(e.target.value)}
                      className="w-full p-2 bg-white border-2 border-[#214C6A] text-xs font-bold focus:outline-none"
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {suppliers.map(s => {
                        const lowCount = (lowStockBySupplier.get(s.id) || []).length;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} {lowCount > 0 ? `(${lowCount} con stock bajo)` : ''}
                          </option>
                        );
                      })}
                    </select>

                    {selectedSupplierObj && (
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 border border-slate-200">
                        <div><strong>Preventista / Asesor:</strong> {selectedSupplierObj.contactPerson || 'No asignado'}</div>
                        <div><strong>Teléfono / WhatsApp:</strong> {selectedSupplierObj.phone}</div>
                        <div><strong>Términos:</strong> {selectedSupplierObj.paymentTerms}</div>
                        <div><strong>Pedido Mínimo:</strong> {selectedSupplierObj.minOrderAmount ? formatCOP(selectedSupplierObj.minOrderAmount) : 'Sin mínimo'}</div>
                      </div>
                    )}
                  </div>

                  {/* Quick Add other products to this order draft */}
                  {selectedSupplierObj && (
                    <div className="bg-white p-4 border border-[#214C6A]/20 shadow-sm space-y-2">
                      <label className="text-xs font-bold text-[#214C6A] block">
                        Agregar otros productos a esta orden:
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {products.map(p => {
                          const isAlreadyInOrder = orderItems.some(i => String(i.productId) === String(p.id));
                          return (
                            <div key={p.id} className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100 text-xs border border-slate-200">
                              <div className="truncate pr-2">
                                <span className="font-semibold block truncate">{p.title}</span>
                                <span className="text-[10px] text-slate-500">Stock: {p.stock} | Costo: {formatCOP(p.costPrice || 0)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddProductToOrderDraft(p)}
                                disabled={isAlreadyInOrder}
                                className={`px-2 py-0.5 text-[11px] font-bold ${
                                  isAlreadyInOrder
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#214C6A] hover:bg-[#1a3d55] text-white cursor-pointer'
                                }`}
                              >
                                {isAlreadyInOrder ? 'Agregado' : '+ Agregar'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Order Draft & Dispatch Tools */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-4 sm:p-5 border-2 border-[#214C6A] shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="font-bold text-sm text-[#214C6A] font-title">
                          Borrador de Solicitud de Abastecimiento
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedSupplierObj ? `Para: ${selectedSupplierObj.name}` : 'Selecciona un proveedor'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {lowStockProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={handleLoadAllLowStockProducts}
                            className="px-2.5 py-1.5 bg-[#EB9D52] hover:bg-[#d8893d] text-[#1b2631] text-[11px] font-black shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Añadir todos los productos con stock bajo o desabastecimiento al pedido"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#1b2631]" />
                            <span>Cargar Stock Bajo ({lowStockProducts.length})</span>
                          </button>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Estimado:</span>
                          <span className="text-lg font-mono font-black text-[#214C6A]">
                            {formatCOP(totalOrderAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    {orderItems.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 p-4 space-y-3">
                        <Package className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-slate-700 font-bold">
                          No hay productos en esta orden de solicitud.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                          {selectedSupplierObj
                            ? `Puedes cargar los productos con bajo stock o añadir ítems del catálogo de la izquierda para ${selectedSupplierObj.name}.`
                            : 'Selecciona un proveedor a la izquierda para cargar los productos con bajo stock o carga los productos desabastecidos de toda la tienda.'}
                        </p>
                        {lowStockProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={handleLoadAllLowStockProducts}
                            className="px-4 py-2 bg-[#EB9D52] hover:bg-[#d8893d] text-[#1b2631] text-xs font-black shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 text-[#1b2631]" />
                            <span>⚡ Cargar Automáticamente {lowStockProducts.length} Productos con Bajo Stock</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#214C6A] text-white uppercase text-[10px]">
                            <tr>
                              <th className="p-2">Producto</th>
                              <th className="p-2 text-center">Stock Actual</th>
                              <th className="p-2 text-center">Cant. a Pedir</th>
                              <th className="p-2 text-right">Costo Unit.</th>
                              <th className="p-2 text-right">Subtotal</th>
                              <th className="p-2 text-center">Quitar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orderItems.map((item) => (
                              <tr key={item.productId} className="hover:bg-slate-50">
                                <td className="p-2">
                                  <div className="font-bold text-slate-900">{item.productTitle}</div>
                                  {item.supplierProductCode && (
                                    <span className="text-[10px] text-slate-400 font-mono">Ref: {item.supplierProductCode}</span>
                                  )}
                                </td>
                                <td className="p-2 text-center font-mono font-bold">
                                  <span className={item.currentStock <= item.minStock ? 'text-rose-600' : 'text-slate-700'}>
                                    {item.currentStock} {item.unit}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.orderQuantity}
                                    onChange={(e) => handleUpdateOrderItemQty(item.productId, Number(e.target.value))}
                                    className="w-16 p-1 text-center font-mono font-bold bg-white border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                                  />
                                </td>
                                <td className="p-2 text-right font-mono text-slate-700">
                                  {formatCOP(item.unitCost)}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-[#214C6A]">
                                  {formatCOP(item.totalCost)}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOrderItem(item.productId)}
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Order Notes */}
                    {orderItems.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Instrucciones u Observaciones para el Proveedor:
                        </label>
                        <input
                          type="text"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Ej: Entregar antes del mediodía. Enviar factura electrónica..."
                          className="w-full p-2 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#214C6A]"
                        />
                      </div>
                    )}

                    {/* Dispatch Action Buttons */}
                    {orderItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={handlePrintOrder}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-[#214C6A] border border-[#214C6A] text-xs font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Generar / Imprimir Orden (PDF)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSendWhatsAppOrder}
                          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer transition-all shadow-md active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Enviar Solicitud por WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: HISTORIAL DE PEDIDOS Y RECEPCIÓN
             ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#214C6A] font-title">
                    Historial de Solicitudes y Recepción de Mercancía
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controla qué pedidos están pendientes y da ingreso automático al inventario cuando llegue el camión.
                  </p>
                </div>
              </div>

              {supplierOrders.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-slate-300 p-6">
                  <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-700 font-bold">
                    No se han registrado órdenes de compra aún.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ve a la pestaña "3. Pedido por Desabastecimiento" para armar y despachar tu primer pedido.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplierOrders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="bg-white p-4 border border-[#214C6A]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#214C6A]">
                            {ord.id}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                            ord.status === 'Recibido'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : ord.status === 'Solicitado'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ord.status}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString('es-CO', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900">
                          {ord.supplierName}
                        </h4>

                        <div className="text-xs text-slate-600">
                          {ord.items.length} productos solicitados • Valor: <strong className="font-mono text-[#214C6A] font-bold">{formatCOP(ord.totalEstimatedCost)}</strong>
                          {ord.sentVia && <span className="text-slate-400"> (Vía {ord.sentVia})</span>}
                        </div>

                        {ord.receivedAt && (
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            ✅ Ingresado al inventario el {new Date(ord.receivedAt).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </div>

                      {/* Order Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {ord.status === 'Solicitado' && (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(`¿Confirmar recepción de la orden ${ord.id} de ${ord.supplierName}?\nSe sumarán las cantidades automáticamente al stock de la tienda.`)) {
                                  onReceiveSupplierOrder(ord.id, true);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                              <span>Recibir Pedido (Ingresar a Stock)</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`¿Cancelar la orden ${ord.id}?`)) {
                                  onCancelSupplierOrder(ord.id);
                                }
                              }}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {ord.status === 'Recibido' && (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4" />
                            Stock Actualizado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#214C6A]">Tienda Mixta La Esquinita</span>
            <span>•</span>
            <span>Gestión Comercial y Cadena de Suministro</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Supplier Create / Edit Sub-Modal */}
      {isEditingSupplier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs">
          <form 
            onSubmit={handleSaveSupplier}
            className="bg-white max-w-lg w-full p-5 border-2 border-[#214C6A] shadow-2xl space-y-3 font-secondary"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#214C6A] font-title">
                {supplierFormId ? 'Editar Datos del Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingSupplier(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Nombre Comercial / Razón Social *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Distribuidora Mayorista Los Paisas SAS"
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NIT / Cédula</label>
                <input
                  type="text"
                  value={formNit}
                  onChange={(e) => setFormNit(e.target.value)}
                  placeholder="Ej: 900.842.119-1"
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contacto / Asesor Comercial</label>
                <input
                  type="text"
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                  placeholder="Ej: Carlos Mario (Preventista)"
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Celular / WhatsApp *</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej: 3124567890"
                  className="w-full p-2 border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#214C6A]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="pedidos@proveedor.com"
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Dirección / Punto de Despacho</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ej: Central Mayorista Bloque 12 Local 104"
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Términos de Pago</label>
                <select
                  value={formPaymentTerms}
                  onChange={(e) => setFormPaymentTerms(e.target.value)}
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                >
                  <option value="Contado / Efectivo">Contado / Efectivo</option>
                  <option value="Contado / Transferencia">Contado / Transferencia</option>
                  <option value="Crédito 8 días">Crédito 8 días</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pedido Mínimo ($ COP)</label>
                <input
                  type="number"
                  value={formMinOrderAmount}
                  onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 font-mono focus:outline-none focus:border-[#214C6A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Días de Visita / Ruta:</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleToggleVisitDay(day)}
                      className={`px-2.5 py-1 text-xs border font-bold cursor-pointer ${
                        formVisitDays.includes(day)
                          ? 'bg-[#214C6A] text-white border-[#214C6A]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Notas / Políticas Comerciales</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Despacho gratis por compras superiores a $150.000..."
                  rows={2}
                  className="w-full p-2 border border-slate-300 focus:outline-none focus:border-[#214C6A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingSupplier(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Guardar Proveedor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

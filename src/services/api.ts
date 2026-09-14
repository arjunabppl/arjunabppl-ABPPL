import {
  User, Party, PartyType, Customer, Supplier, Product, StockMovement,
  Transporter, FreightRecord, PurchaseOrder, SalesOrder, Invoice, InvoiceStatus, PaymentRecord, LedgerEntry, CompanySettings,
  DueReminder, GlobalSearchResult, DashboardSummary, Warehouse, StockTransfer,
  StockAdjustment, StockReservation, InventorySummary, DeliveryChallan, PaymentReceipt,
  CustomerPriceList, AuditLog, OrderStats, OrderStatusHistoryEntry,
  PurchaseRequisition, SupplierQuotationComparison, GoodsReceiptNote, ThreeWayMatch,
  PurchaseReturn, ImportShipment, LandedCostCalculation, SupplierPayment, PurchaseStats,
  PaperCategoryDefinition, PaperSizePreset
} from '../types/index.js';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('abppl_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `API Error ${res.status}${res.statusText ? ': ' + res.statusText : ''}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const errData = JSON.parse(text);
          if (errData && errData.error) {
            errorMessage = errData.error;
          } else if (errData && errData.message) {
            errorMessage = errData.message;
          } else {
            errorMessage = text;
          }
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (loginIdOrEmail: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
    return fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginIdOrEmail, password })
    });
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    return fetchJson('/api/auth/me');
  },

  logout: async (): Promise<{ success: boolean }> => {
    return fetchJson('/api/auth/logout', { method: 'POST' });
  },

  // User Management (Admin Only)
  getUsers: () => fetchJson<User[]>('/api/users'),
  createUser: (data: Partial<User> & { password?: string }) => fetchJson<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUser: (id: string, data: Partial<User> & { password?: string }) => fetchJson<User>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateUserStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => fetchJson<User>(`/api/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  updateUserRole: (id: string, role: string) => fetchJson<User>(`/api/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  }),
  resetUserPassword: (id: string, password: string) => fetchJson<{ success: boolean; message: string; user: User }>(`/api/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password })
  }),
  deleteUser: (id: string) => fetchJson<{ success: boolean; message: string }>(`/api/users/${id}`, {
    method: 'DELETE'
  }),

  // Settings
  getSettings: () => fetchJson<CompanySettings>('/api/settings'),
  updateSettings: (data: Partial<CompanySettings>) => fetchJson<CompanySettings>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Unified Party Management
  getParties: (type?: PartyType) => fetchJson<Party[]>(`/api/parties${type ? `?type=${type}` : ''}`),
  getPartyById: (id: string) => fetchJson<Party>(`/api/parties/${id}`),
  createParty: (data: Partial<Party>) => fetchJson<Party>('/api/parties', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateParty: (id: string, data: Partial<Party>) => fetchJson<Party>(`/api/parties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteParty: (id: string) => fetchJson<{ success: boolean }>(`/api/parties/${id}`, {
    method: 'DELETE'
  }),
  getPartyLedger: (id: string) => fetchJson<LedgerEntry[]>(`/api/parties/${id}/ledger`),

  // Legacy Customers & Suppliers
  getCustomers: () => fetchJson<Customer[]>('/api/customers'),
  getCustomerById: (id: string) => fetchJson<Customer>(`/api/customers/${id}`),
  createCustomer: (data: Partial<Customer>) => fetchJson<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCustomer: (id: string, data: Partial<Customer>) => fetchJson<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCustomer: (id: string) => fetchJson<{ success: boolean }>(`/api/customers/${id}`, {
    method: 'DELETE'
  }),
  getCustomerLedger: (id: string) => fetchJson<LedgerEntry[]>(`/api/customers/${id}/ledger`),

  getSuppliers: () => fetchJson<Supplier[]>('/api/suppliers'),
  getSupplierById: (id: string) => fetchJson<Supplier>(`/api/suppliers/${id}`),
  createSupplier: (data: Partial<Supplier>) => fetchJson<Supplier>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSupplier: (id: string, data: Partial<Supplier>) => fetchJson<Supplier>(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSupplier: (id: string) => fetchJson<{ success: boolean }>(`/api/suppliers/${id}`, {
    method: 'DELETE'
  }),
  getSupplierLedger: (id: string) => fetchJson<LedgerEntry[]>(`/api/suppliers/${id}/ledger`),

  // Transporters
  getTransporters: () => fetchJson<Transporter[]>('/api/transporters'),
  createTransporter: (data: Partial<Transporter>) => fetchJson<Transporter>('/api/transporters', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTransporter: (id: string, data: Partial<Transporter>) => fetchJson<Transporter>(`/api/transporters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteTransporter: (id: string) => fetchJson<{ success: boolean }>(`/api/transporters/${id}`, {
    method: 'DELETE'
  }),

  // Freight Records & Bills
  getFreights: () => fetchJson<FreightRecord[]>('/api/freight'),
  createFreight: (data: Partial<FreightRecord>) => fetchJson<FreightRecord>('/api/freight', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateFreight: (id: string, data: Partial<FreightRecord>) => fetchJson<FreightRecord>(`/api/freight/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteFreight: (id: string) => fetchJson<{ success: boolean }>(`/api/freight/${id}`, {
    method: 'DELETE'
  }),

  // Paper Categories Master
  getPaperCategories: () => fetchJson<PaperCategoryDefinition[]>('/api/paper-categories'),
  createPaperCategory: (data: Partial<PaperCategoryDefinition>) => fetchJson<PaperCategoryDefinition>('/api/paper-categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deletePaperCategory: (id: string) => fetchJson<{ success: boolean }>(`/api/paper-categories/${id}`, {
    method: 'DELETE'
  }),

  // Paper Size Presets Master
  getPaperSizes: () => fetchJson<PaperSizePreset[]>('/api/paper-sizes'),
  createPaperSize: (data: Partial<PaperSizePreset>) => fetchJson<PaperSizePreset>('/api/paper-sizes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deletePaperSize: (id: string) => fetchJson<{ success: boolean }>(`/api/paper-sizes/${id}`, {
    method: 'DELETE'
  }),

  // Products
  getProducts: () => fetchJson<Product[]>('/api/products'),
  createProduct: (data: Partial<Product>) => fetchJson<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id: string, data: Partial<Product>) => fetchJson<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id: string) => fetchJson<{ success: boolean }>(`/api/products/${id}`, {
    method: 'DELETE'
  }),

  // Inventory & Warehouse Control
  getInventorySummary: () => fetchJson<InventorySummary>('/api/inventory/summary'),
  getWarehouses: () => fetchJson<Warehouse[]>('/api/inventory/warehouses'),
  saveWarehouse: (data: Partial<Warehouse>) => fetchJson<Warehouse>(data.id ? `/api/inventory/warehouses/${data.id}` : '/api/inventory/warehouses', {
    method: data.id ? 'PUT' : 'POST',
    body: JSON.stringify(data)
  }),
  deleteWarehouse: (id: string) => fetchJson<{ success: boolean }>(`/api/inventory/warehouses/${id}`, {
    method: 'DELETE'
  }),
  getStockMovements: (params?: { productId?: string; warehouseId?: string; type?: string; startDate?: string; endDate?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<StockMovement[]>(`/api/inventory/movements${query}`);
  },
  recordStockMovement: (data: Partial<StockMovement>) => fetchJson<StockMovement>('/api/inventory/movements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getStockTransfers: () => fetchJson<StockTransfer[]>('/api/inventory/transfers'),
  createStockTransfer: (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    referenceDocNo?: string;
    reason: string;
    transporterName?: string;
    vehicleNo?: string;
    notes?: string;
  }) => fetchJson<StockTransfer>('/api/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getStockAdjustments: () => fetchJson<StockAdjustment[]>('/api/inventory/adjustments'),
  createStockAdjustment: (data: {
    warehouseId: string;
    productId: string;
    adjustmentType: 'ADD' | 'DEDUCT';
    quantity: number;
    reasonCode: StockAdjustment['reasonCode'];
    referenceDocNo: string;
    remarks: string;
    physicalCountedQty?: number;
  }) => fetchJson<StockAdjustment>('/api/inventory/adjustments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getStockReservations: () => fetchJson<StockReservation[]>('/api/inventory/reservations'),
  createStockReservation: (data: {
    productId: string;
    warehouseId?: string;
    quantity: number;
    salesOrderRef: string;
    customerName: string;
    notes?: string;
  }) => fetchJson<StockReservation>('/api/inventory/reservations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  releaseStockReservation: (id: string, action: 'FULFILLED' | 'CANCELLED', reason?: string) => fetchJson<{ success: boolean; message: string }>(`/api/inventory/reservations/${id}/release`, {
    method: 'PATCH',
    body: JSON.stringify({ action, reason })
  }),
  updateOpeningStock: (data: {
    productId: string;
    openingStock: number;
    warehouseId?: string;
    referenceNo?: string;
    remarks?: string;
  }) => fetchJson<Product>('/api/inventory/opening-stock', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Sales Orders & B2B Order Lifecycle
  getSalesOrders: (params?: { customerId?: string; distributorId?: string; status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<SalesOrder[]>(`/api/sales-orders${query}`);
  },
  getOrderStats: (params?: { customerId?: string; distributorId?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<OrderStats>(`/api/sales-orders/stats${query}`);
  },
  getSalesOrderById: (id: string) => fetchJson<SalesOrder>(`/api/sales-orders/${id}`),
  getOrderTimeline: (id: string) => fetchJson<OrderStatusHistoryEntry[]>(`/api/sales-orders/${id}/timeline`),
  createSalesOrder: (data: Partial<SalesOrder>) => fetchJson<SalesOrder>('/api/sales-orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSalesOrder: (id: string, data: Partial<SalesOrder>) => fetchJson<SalesOrder>(`/api/sales-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSalesOrder: (id: string) => fetchJson<{ success: boolean }>(`/api/sales-orders/${id}`, {
    method: 'DELETE'
  }),
  approveSalesOrder: (id: string) => fetchJson<SalesOrder>(`/api/sales-orders/${id}/approve`, {
    method: 'POST'
  }),
  rejectSalesOrder: (id: string, reason: string) => fetchJson<SalesOrder>(`/api/sales-orders/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  packSalesOrder: (id: string, data: { totalPackages: number; packageType?: string; packedBy?: string; notes?: string }) => fetchJson<SalesOrder>(`/api/sales-orders/${id}/pack`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  dispatchSalesOrder: (id: string, data: {
    transporterName: string;
    transporterId?: string;
    vehicleNumber: string;
    lrGrNo: string;
    lrGrDate?: string;
    driverPhone?: string;
    warehouseId?: string;
    totalPackages?: number;
    packageType?: string;
    totalWeightKgs?: number;
    deliveryRemarks?: string;
    itemDispatches?: { productId: string; dispatchedQty: number }[];
  }) => fetchJson<{ order: SalesOrder; deliveryChallan: DeliveryChallan }>(`/api/sales-orders/${id}/dispatch`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  markOrderDelivered: (id: string, data: {
    actualDeliveryDate?: string;
    receivedBy?: string;
    deliveryRemarks?: string;
    receiverSignatureNote?: string;
  }) => fetchJson<SalesOrder>(`/api/sales-orders/${id}/deliver`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  recordOrderPayment: (id: string, data: {
    amount: number;
    paymentDate?: string;
    paymentMode: string;
    referenceNo?: string;
    bankName?: string;
    notes?: string;
  }) => fetchJson<{ order: SalesOrder; receipt: PaymentReceipt }>(`/api/sales-orders/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createInvoiceFromSalesOrder: (salesOrderId: string, customData?: Partial<Invoice>) => fetchJson<Invoice>(`/api/sales-orders/${salesOrderId}/create-invoice`, {
    method: 'POST',
    body: JSON.stringify(customData || {})
  }),

  // Deliveries & Packing Slips
  getDeliveries: (params?: { orderId?: string; customerId?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<DeliveryChallan[]>(`/api/deliveries${query}`);
  },
  getDeliveryById: (id: string) => fetchJson<DeliveryChallan>(`/api/deliveries/${id}`),

  // Receipts
  getReceipts: (params?: { orderId?: string; customerId?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<PaymentReceipt[]>(`/api/receipts${query}`);
  },
  getReceiptById: (id: string) => fetchJson<PaymentReceipt>(`/api/receipts/${id}`),

  // Price Lists
  getPriceLists: (partyId?: string) => fetchJson<CustomerPriceList[]>(`/api/price-lists${partyId ? `?partyId=${partyId}` : ''}`),
  savePriceList: (data: Partial<CustomerPriceList>) => fetchJson<CustomerPriceList>('/api/price-lists', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deletePriceList: (id: string) => fetchJson<{ success: boolean }>(`/api/price-lists/${id}`, {
    method: 'DELETE'
  }),

  // Audit Logs
  getAuditLogs: (params?: { entityType?: string; action?: string; userId?: string; limit?: number; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<AuditLog[]>(`/api/audit-logs${query}`);
  },

  // Invoices & Quotations
  getInvoices: (type?: 'INVOICE' | 'QUOTATION') => fetchJson<Invoice[]>(`/api/invoices${type ? `?type=${type}` : ''}`),
  getInvoiceById: (id: string) => fetchJson<Invoice>(`/api/invoices/${id}`),
  createInvoice: (data: Partial<Invoice>) => fetchJson<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateInvoice: (id: string, data: Partial<Invoice>) => fetchJson<Invoice>(`/api/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateInvoiceStatus: (id: string, invoiceStatus: InvoiceStatus, details?: { trackingNo?: string; lrGrNo?: string; vehicleNumber?: string; deliveryNotes?: string; dispatchDate?: string }) => fetchJson<Invoice>(`/api/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ invoiceStatus, details })
  }),
  deleteInvoice: (id: string) => fetchJson<{ success: boolean }>(`/api/invoices/${id}`, {
    method: 'DELETE'
  }),

  // Purchase & Import Management Module
  getPurchaseStats: () => fetchJson<PurchaseStats>('/api/purchase/stats'),

  // 1. Purchase Requisitions
  getPurchaseRequisitions: (params?: { status?: string; priority?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<PurchaseRequisition[]>(`/api/purchase-requisitions${query}`);
  },
  getPurchaseRequisitionById: (id: string) => fetchJson<PurchaseRequisition>(`/api/purchase-requisitions/${id}`),
  savePurchaseRequisition: (data: Partial<PurchaseRequisition>) => fetchJson<PurchaseRequisition>('/api/purchase-requisitions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  approvePurchaseRequisition: (id: string) => fetchJson<PurchaseRequisition>(`/api/purchase-requisitions/${id}/approve`, {
    method: 'POST'
  }),
  rejectPurchaseRequisition: (id: string, reason: string = 'Rejected by Authority') => fetchJson<PurchaseRequisition>(`/api/purchase-requisitions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),

  // 2. Quotation Comparisons (RFQ)
  getSupplierQuotations: (params?: { status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<SupplierQuotationComparison[]>(`/api/supplier-quotations${query}`);
  },
  saveSupplierQuotation: (data: Partial<SupplierQuotationComparison>) => fetchJson<SupplierQuotationComparison>('/api/supplier-quotations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  selectSupplierQuote: (comparisonId: string, supplierId: string, decisionNotes: string) => fetchJson<SupplierQuotationComparison>(`/api/supplier-quotations/${comparisonId}/select`, {
    method: 'POST',
    body: JSON.stringify({ supplierId, decisionNotes })
  }),

  // 3. Purchase Orders
  getPurchases: (params?: { supplierId?: string; status?: string; isImport?: boolean; approvalStatus?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]).toString() : '';
    return fetchJson<PurchaseOrder[]>(`/api/purchases${query}`);
  },
  getPurchaseById: (id: string) => fetchJson<PurchaseOrder>(`/api/purchases/${id}`),
  createPurchase: (data: Partial<PurchaseOrder>) => fetchJson<PurchaseOrder>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  savePurchase: (data: Partial<PurchaseOrder>) => fetchJson<PurchaseOrder>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  approvePurchaseOrder: (id: string) => fetchJson<PurchaseOrder>(`/api/purchases/${id}/approve`, {
    method: 'POST'
  }),
  rejectPurchaseOrder: (id: string, reason: string = 'Rejected by Authority') => fetchJson<PurchaseOrder>(`/api/purchases/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  cancelPurchase: (id: string) => fetchJson<{ success: boolean }>(`/api/purchases/${id}`, {
    method: 'DELETE'
  }),

  // 4. Goods Receipt Notes (GRN)
  getGoodsReceiptNotes: (params?: { poId?: string; status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<GoodsReceiptNote[]>(`/api/goods-receipt-notes${query}`);
  },
  getGoodsReceiptNoteById: (id: string) => fetchJson<GoodsReceiptNote>(`/api/goods-receipt-notes/${id}`),
  saveGoodsReceiptNote: (data: Partial<GoodsReceiptNote>) => fetchJson<GoodsReceiptNote>('/api/goods-receipt-notes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  confirmGoodsReceiptNote: (id: string) => fetchJson<GoodsReceiptNote>(`/api/goods-receipt-notes/${id}/confirm`, {
    method: 'POST'
  }),

  // 5. 3-Way Matching
  getThreeWayMatches: (params?: { status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<ThreeWayMatch[]>(`/api/three-way-matches${query}`);
  },
  performThreeWayMatch: (data: Partial<ThreeWayMatch>) => fetchJson<ThreeWayMatch>('/api/three-way-matches', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  approveThreeWayMatch: (id: string, notes: string) => fetchJson<ThreeWayMatch>(`/api/three-way-matches/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  }),

  // 6. Purchase Returns & Debit Notes
  getPurchaseReturns: (params?: { status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<PurchaseReturn[]>(`/api/purchase-returns${query}`);
  },
  savePurchaseReturn: (data: Partial<PurchaseReturn>) => fetchJson<PurchaseReturn>('/api/purchase-returns', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 7. Import Shipments
  getImportShipments: (params?: { status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<ImportShipment[]>(`/api/import-shipments${query}`);
  },
  getImportShipmentById: (id: string) => fetchJson<ImportShipment>(`/api/import-shipments/${id}`),
  saveImportShipment: (data: Partial<ImportShipment>) => fetchJson<ImportShipment>('/api/import-shipments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateShipmentTimeline: (id: string, status: string, location: string, description: string) => fetchJson<ImportShipment>(`/api/import-shipments/${id}/timeline`, {
    method: 'POST',
    body: JSON.stringify({ status, location, description })
  }),

  // 8. Landed Cost Engine
  getLandedCostCalculations: (params?: { shipmentId?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<LandedCostCalculation[]>(`/api/landed-cost${query}`);
  },
  getLandedCostById: (id: string) => fetchJson<LandedCostCalculation>(`/api/landed-cost/${id}`),
  getLandedCostByShipmentId: (shipmentId: string) => fetchJson<LandedCostCalculation | null>(`/api/landed-cost/by-shipment/${shipmentId}`),
  saveLandedCostCalculation: (data: Partial<LandedCostCalculation>) => fetchJson<LandedCostCalculation>('/api/landed-cost', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  finalizeLandedCost: (id: string) => fetchJson<LandedCostCalculation>(`/api/landed-cost/${id}/finalize`, {
    method: 'POST'
  }),

  // 9. Supplier Payments
  getSupplierPayments: (params?: { supplierId?: string; poId?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : '';
    return fetchJson<SupplierPayment[]>(`/api/supplier-payments${query}`);
  },
  saveSupplierPayment: (data: Partial<SupplierPayment>) => fetchJson<SupplierPayment>('/api/supplier-payments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createSupplierPayment: (data: Partial<SupplierPayment>) => fetchJson<SupplierPayment>('/api/supplier-payments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Purchase Audit Logs Alias
  getPurchaseAuditLogs: () => fetchJson<AuditLog[]>('/api/audit-logs'),

  // Aliases for Purchase Methods
  getPurchaseOrders: (params?: { supplierId?: string; status?: string; isImport?: boolean; approvalStatus?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]).toString() : '';
    return fetchJson<PurchaseOrder[]>(`/api/purchases${query}`);
  },
  createPurchaseOrder: (data: Partial<PurchaseOrder>) => fetchJson<PurchaseOrder>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  cancelPurchaseOrder: (id: string) => fetchJson<{ success: boolean }>(`/api/purchases/${id}`, {
    method: 'DELETE'
  }),
  createPurchaseRequisition: (data: Partial<PurchaseRequisition>) => fetchJson<PurchaseRequisition>('/api/purchase-requisitions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createSupplierQuotation: (data: Partial<SupplierQuotationComparison>) => fetchJson<SupplierQuotationComparison>('/api/supplier-quotations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  awardSupplierQuotation: (id: string, supplierId?: string, decisionNotes?: string) => fetchJson<SupplierQuotationComparison>(`/api/supplier-quotations/${id}/select`, {
    method: 'POST',
    body: JSON.stringify({ supplierId: supplierId || 'selected', decisionNotes: decisionNotes || 'Awarded' })
  }),
  createImportShipment: (data: Partial<ImportShipment>) => fetchJson<ImportShipment>('/api/import-shipments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateImportShipment: (id: string, data: Partial<ImportShipment>) => fetchJson<ImportShipment>('/api/import-shipments', {
    method: 'POST',
    body: JSON.stringify({ ...data, id })
  }),
  createLandedCostCalculation: (data: Partial<LandedCostCalculation>) => fetchJson<LandedCostCalculation>('/api/landed-cost', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  finalizeLandedCostCalculation: (id: string) => fetchJson<LandedCostCalculation>(`/api/landed-cost/${id}/finalize`, {
    method: 'POST'
  }),
  createGoodsReceiptNote: (data: Partial<GoodsReceiptNote>) => fetchJson<GoodsReceiptNote>('/api/goods-receipt-notes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createThreeWayMatch: (data: Partial<ThreeWayMatch>) => fetchJson<ThreeWayMatch>('/api/three-way-matches', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createPurchaseReturn: (data: Partial<PurchaseReturn>) => fetchJson<PurchaseReturn>('/api/purchase-returns', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Payments
  getPayments: () => fetchJson<PaymentRecord[]>('/api/payments'),
  recordPayment: (data: Partial<PaymentRecord>) => fetchJson<PaymentRecord>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Due Reminders
  getDueReminders: () => fetchJson<DueReminder[]>('/api/due-reminders'),

  // Global Search
  globalSearch: (query: string) => fetchJson<GlobalSearchResult[]>(`/api/global-search?q=${encodeURIComponent(query)}`),

  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummary>('/api/dashboard/summary'),
};

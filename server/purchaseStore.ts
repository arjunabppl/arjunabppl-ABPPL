import {
  PurchaseOrder,
  PurchaseRequisition,
  SupplierQuotationComparison,
  GoodsReceiptNote,
  ThreeWayMatch,
  PurchaseReturn,
  ImportShipment,
  LandedCostCalculation,
  SupplierPayment,
  PurchaseStats,
  Party,
  Product,
  StockMovement,
  AuditLog
} from '../src/types/index.js';
import {
  DEFAULT_PURCHASE_SUPPLIERS,
  DEFAULT_PURCHASE_REQUISITIONS,
  DEFAULT_SUPPLIER_QUOTATIONS,
  DEFAULT_PURCHASE_ORDERS,
  DEFAULT_IMPORT_SHIPMENTS,
  DEFAULT_LANDED_COST_CALCULATIONS,
  DEFAULT_GOODS_RECEIPT_NOTES,
  DEFAULT_THREE_WAY_MATCHES,
  DEFAULT_PURCHASE_RETURNS,
  DEFAULT_SUPPLIER_PAYMENTS
} from './purchaseSeedData.js';

export class PurchaseStore {
  private dbRef: any;
  private saveCallback: () => void;

  constructor(db: any, saveCallback: () => void) {
    this.dbRef = db;
    this.saveCallback = saveCallback;
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!this.dbRef.purchaseRequisitions || !Array.isArray(this.dbRef.purchaseRequisitions) || this.dbRef.purchaseRequisitions.length === 0) {
      this.dbRef.purchaseRequisitions = [...DEFAULT_PURCHASE_REQUISITIONS];
    }
    if (!this.dbRef.supplierQuotations || !Array.isArray(this.dbRef.supplierQuotations) || this.dbRef.supplierQuotations.length === 0) {
      this.dbRef.supplierQuotations = [...DEFAULT_SUPPLIER_QUOTATIONS];
    }
    if (!this.dbRef.purchases || !Array.isArray(this.dbRef.purchases) || this.dbRef.purchases.length === 0) {
      this.dbRef.purchases = [...DEFAULT_PURCHASE_ORDERS];
    }
    if (!this.dbRef.importShipments || !Array.isArray(this.dbRef.importShipments) || this.dbRef.importShipments.length === 0) {
      this.dbRef.importShipments = [...DEFAULT_IMPORT_SHIPMENTS];
    }
    if (!this.dbRef.landedCostCalculations || !Array.isArray(this.dbRef.landedCostCalculations) || this.dbRef.landedCostCalculations.length === 0) {
      this.dbRef.landedCostCalculations = [...DEFAULT_LANDED_COST_CALCULATIONS];
    }
    if (!this.dbRef.goodsReceiptNotes || !Array.isArray(this.dbRef.goodsReceiptNotes) || this.dbRef.goodsReceiptNotes.length === 0) {
      this.dbRef.goodsReceiptNotes = [...DEFAULT_GOODS_RECEIPT_NOTES];
    }
    if (!this.dbRef.threeWayMatches || !Array.isArray(this.dbRef.threeWayMatches) || this.dbRef.threeWayMatches.length === 0) {
      this.dbRef.threeWayMatches = [...DEFAULT_THREE_WAY_MATCHES];
    }
    if (!this.dbRef.purchaseReturns || !Array.isArray(this.dbRef.purchaseReturns) || this.dbRef.purchaseReturns.length === 0) {
      this.dbRef.purchaseReturns = [...DEFAULT_PURCHASE_RETURNS];
    }
    if (!this.dbRef.supplierPayments || !Array.isArray(this.dbRef.supplierPayments) || this.dbRef.supplierPayments.length === 0) {
      this.dbRef.supplierPayments = [...DEFAULT_SUPPLIER_PAYMENTS];
    }

    // Ensure suppliers exist in parties
    if (this.dbRef.parties && Array.isArray(this.dbRef.parties)) {
      DEFAULT_PURCHASE_SUPPLIERS.forEach(supp => {
        if (!this.dbRef.parties.find((p: Party) => p.id === supp.id || p.companyName.toLowerCase() === supp.companyName.toLowerCase())) {
          this.dbRef.parties.push(supp);
        }
      });
    }
  }

  private logAudit(
    entityType: 'PURCHASE_ORDER' | 'PURCHASE_REQUISITION' | 'GOODS_RECEIPT_NOTE' | 'IMPORT_SHIPMENT' | 'LANDED_COST' | 'PURCHASE_RETURN' | 'SUPPLIER_PAYMENT' | 'PARTY' | 'PRODUCT',
    entityId: string,
    action: AuditLog['action'],
    description: string,
    user: any,
    metadata?: any
  ) {
    if (!this.dbRef.auditLogs) this.dbRef.auditLogs = [];
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys-user',
      userName: user?.name || 'System User',
      userRole: user?.role || 'admin',
      entityType: entityType as any,
      entityId,
      action,
      description,
      metadata
    };
    this.dbRef.auditLogs.unshift(audit);
  }

  // ==========================================
  // 1. PURCHASE REQUISITIONS
  // ==========================================
  getPurchaseRequisitions(filter?: { status?: string; priority?: string; search?: string }): PurchaseRequisition[] {
    let reqs = (this.dbRef.purchaseRequisitions || []) as PurchaseRequisition[];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        reqs = reqs.filter(r => r.status === filter.status);
      }
      if (filter.priority && filter.priority !== 'ALL') {
        reqs = reqs.filter(r => r.priority === filter.priority);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        reqs = reqs.filter(r =>
          r.reqNo.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.items.some(it => it.productName.toLowerCase().includes(q))
        );
      }
    }
    return reqs;
  }

  getPurchaseRequisitionById(id: string): PurchaseRequisition | undefined {
    return (this.dbRef.purchaseRequisitions || []).find((r: PurchaseRequisition) => r.id === id || r.reqNo === id);
  }

  savePurchaseRequisition(data: Partial<PurchaseRequisition>, user: any): PurchaseRequisition {
    const now = new Date().toISOString();
    const count = (this.dbRef.purchaseRequisitions || []).length + 1;
    const reqNo = data.reqNo || `ABPPL/PR/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;

    const items = (data.items || []).map(it => ({
      ...it,
      requiredQuantity: Number(it.requiredQuantity || 0),
      targetRate: Number(it.targetRate || 0),
      estimatedTotal: Number((Number(it.requiredQuantity || 0) * Number(it.targetRate || 0)).toFixed(2))
    }));

    const estimatedTotalAmount = items.reduce((sum, it) => sum + it.estimatedTotal, 0);

    const newReq: PurchaseRequisition = {
      id: data.id || `pr-${Date.now()}`,
      reqNo,
      reqDate: data.reqDate || now.split('T')[0],
      requiredByDate: data.requiredByDate || now.split('T')[0],
      requestedBy: data.requestedBy || user?.name || 'Purchase Incharge',
      requestedByRole: data.requestedByRole || user?.role || 'purchase',
      department: data.department || 'Procurement & Warehouse',
      priority: data.priority || 'MEDIUM',
      warehouseId: data.warehouseId || 'wh-1',
      warehouseName: data.warehouseName || 'Bhiwandi Central Godown',
      items,
      estimatedTotalAmount,
      purpose: data.purpose || 'Stock replenishment',
      status: data.status || 'DRAFT',
      notes: data.notes || '',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    if (data.id) {
      const idx = this.dbRef.purchaseRequisitions.findIndex((r: PurchaseRequisition) => r.id === data.id);
      if (idx !== -1) {
        this.dbRef.purchaseRequisitions[idx] = newReq;
        this.logAudit('PURCHASE_REQUISITION', newReq.id, 'REQUISITION_UPDATED', `Updated Purchase Requisition #${newReq.reqNo}`, user);
        this.saveCallback();
        return newReq;
      }
    }

    this.dbRef.purchaseRequisitions.unshift(newReq);
    this.logAudit('PURCHASE_REQUISITION', newReq.id, 'REQUISITION_CREATED', `Created Purchase Requisition #${newReq.reqNo} for total ₹${estimatedTotalAmount.toLocaleString('en-IN')}`, user);
    this.saveCallback();
    return newReq;
  }

  approvePurchaseRequisition(id: string, user: any): PurchaseRequisition {
    const req = this.getPurchaseRequisitionById(id);
    if (!req) throw new Error('Purchase Requisition not found');

    req.status = 'APPROVED';
    req.approvedBy = user?.name || 'Super Admin';
    req.approvedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    const idx = this.dbRef.purchaseRequisitions.findIndex((r: PurchaseRequisition) => r.id === id);
    if (idx !== -1) this.dbRef.purchaseRequisitions[idx] = req;

    this.logAudit('PURCHASE_REQUISITION', req.id, 'REQUISITION_APPROVED', `Approved Purchase Requisition #${req.reqNo}`, user);
    this.saveCallback();
    return req;
  }

  rejectPurchaseRequisition(id: string, reason: string, user: any): PurchaseRequisition {
    const req = this.getPurchaseRequisitionById(id);
    if (!req) throw new Error('Purchase Requisition not found');

    req.status = 'REJECTED';
    req.rejectionReason = reason;
    req.updatedAt = new Date().toISOString();

    const idx = this.dbRef.purchaseRequisitions.findIndex((r: PurchaseRequisition) => r.id === id);
    if (idx !== -1) this.dbRef.purchaseRequisitions[idx] = req;

    this.logAudit('PURCHASE_REQUISITION', req.id, 'REQUISITION_REJECTED', `Rejected Requisition #${req.reqNo}. Reason: ${reason}`, user);
    this.saveCallback();
    return req;
  }

  // ==========================================
  // 2. SUPPLIER QUOTATION COMPARISON (RFQ)
  // ==========================================
  getSupplierQuotations(filter?: { status?: string; search?: string }): SupplierQuotationComparison[] {
    let quotes = (this.dbRef.supplierQuotations || []) as SupplierQuotationComparison[];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        quotes = quotes.filter(q => q.status === filter.status);
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        quotes = quotes.filter(q =>
          q.comparisonNo.toLowerCase().includes(s) ||
          q.productName.toLowerCase().includes(s) ||
          q.quotes.some(sub => sub.supplierName.toLowerCase().includes(s))
        );
      }
    }
    return quotes;
  }

  saveSupplierQuotation(data: Partial<SupplierQuotationComparison>, user: any): SupplierQuotationComparison {
    const now = new Date().toISOString();
    const count = (this.dbRef.supplierQuotations || []).length + 1;
    const comparisonNo = data.comparisonNo || `ABPPL/RFQ/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;

    const newQuotation: SupplierQuotationComparison = {
      id: data.id || `rfq-${Date.now()}`,
      comparisonNo,
      requisitionId: data.requisitionId,
      requisitionNo: data.requisitionNo,
      date: data.date || now.split('T')[0],
      productName: data.productName || 'Paper Grade',
      gsm: Number(data.gsm || 0),
      sizeInches: data.sizeInches || '',
      requiredQuantity: Number(data.requiredQuantity || 0),
      unit: data.unit || 'Ream',
      quotes: (data.quotes || []).map(q => {
        const rateFor = Number(q.unitRateForeign || q.unitRateInr || 0);
        const ex = Number(q.exchangeRate || 1.0);
        const rateInr = q.unitRateInr || Number((rateFor * ex).toFixed(2));
        const freight = Number(q.freightInr || 0);
        const totalInr = Number((rateInr * Number(data.requiredQuantity || 1) + freight).toFixed(2));
        return {
          ...q,
          unitRateForeign: rateFor,
          exchangeRate: ex,
          unitRateInr: rateInr,
          freightInr: freight,
          totalInr
        };
      }),
      selectedSupplierId: data.selectedSupplierId,
      selectedSupplierName: data.selectedSupplierName,
      decisionNotes: data.decisionNotes || '',
      status: data.status || 'DRAFT',
      evaluatedBy: data.evaluatedBy || user?.name || 'Purchase Manager',
      evaluatedAt: data.evaluatedAt || now,
      createdAt: data.createdAt || now
    };

    if (data.id) {
      const idx = this.dbRef.supplierQuotations.findIndex((q: SupplierQuotationComparison) => q.id === data.id);
      if (idx !== -1) {
        this.dbRef.supplierQuotations[idx] = newQuotation;
        this.saveCallback();
        return newQuotation;
      }
    }

    this.dbRef.supplierQuotations.unshift(newQuotation);
    this.saveCallback();
    return newQuotation;
  }

  selectSupplierQuote(comparisonId: string, supplierId: string, decisionNotes: string, user: any): SupplierQuotationComparison {
    const comp = (this.dbRef.supplierQuotations || []).find((q: SupplierQuotationComparison) => q.id === comparisonId);
    if (!comp) throw new Error('Quotation comparison not found');

    const selectedQuote = comp.quotes.find((q: any) => q.supplierId === supplierId);
    if (!selectedQuote) throw new Error('Supplier quote not found in comparison matrix');

    comp.quotes.forEach((q: any) => {
      q.isSelected = q.supplierId === supplierId;
    });

    comp.selectedSupplierId = selectedQuote.supplierId;
    comp.selectedSupplierName = selectedQuote.supplierName;
    comp.decisionNotes = decisionNotes;
    comp.status = 'AWARDED';
    comp.evaluatedBy = user?.name || 'Purchase Head';
    comp.evaluatedAt = new Date().toISOString();

    const idx = this.dbRef.supplierQuotations.findIndex((q: SupplierQuotationComparison) => q.id === comparisonId);
    if (idx !== -1) this.dbRef.supplierQuotations[idx] = comp;

    this.logAudit('PURCHASE_ORDER', comp.id, 'PURCHASE_ORDER_UPDATED', `Awarded RFQ #${comp.comparisonNo} to ${selectedQuote.supplierName}`, user);
    this.saveCallback();
    return comp;
  }

  // ==========================================
  // 3. PURCHASE ORDERS (IMPORT & DOMESTIC)
  // ==========================================
  getPurchases(filter?: {
    supplierId?: string;
    status?: string;
    isImport?: boolean;
    approvalStatus?: string;
    search?: string;
  }): PurchaseOrder[] {
    let pos = (this.dbRef.purchases || []) as PurchaseOrder[];
    if (filter) {
      if (filter.supplierId) {
        pos = pos.filter(p => p.supplierId === filter.supplierId);
      }
      if (filter.status && filter.status !== 'ALL') {
        pos = pos.filter(p => p.status === filter.status);
      }
      if (filter.approvalStatus && filter.approvalStatus !== 'ALL') {
        pos = pos.filter(p => p.approvalStatus === filter.approvalStatus);
      }
      if (filter.isImport !== undefined) {
        pos = pos.filter(p => Boolean(p.isImport) === Boolean(filter.isImport));
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        pos = pos.filter(p =>
          p.purchaseNo.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.supplierInvoiceNo && p.supplierInvoiceNo.toLowerCase().includes(q)) ||
          p.items.some(it => it.productName.toLowerCase().includes(q))
        );
      }
    }

    return pos.map(po => {
      const paid = Number(po.paidAmount || 0);
      const grand = Number(po.grandTotal || 0);
      const balanceDue = Math.max(0, grand - paid);
      let paymentStatus = po.paymentStatus;
      if (balanceDue === 0 && grand > 0) paymentStatus = 'PAID';
      else if (paid > 0) paymentStatus = 'PARTIAL';
      else paymentStatus = 'UNPAID';

      return {
        ...po,
        paidAmount: paid,
        balanceDue,
        paymentStatus
      };
    });
  }

  getPurchaseById(id: string): PurchaseOrder | undefined {
    return this.getPurchases().find(p => p.id === id || p.purchaseNo === id);
  }

  savePurchase(poData: Partial<PurchaseOrder>, user: any): PurchaseOrder {
    const now = new Date().toISOString();
    const count = (this.dbRef.purchases || []).length + 1;
    const purchaseNo = poData.purchaseNo || poData.poNo || `ABPPL/PO/25-26/${String(count).padStart(4, '0')}`;

    const isImport = Boolean(poData.isImport || (poData.currency && poData.currency !== 'INR'));
    const currency = poData.currency || (isImport ? 'USD' : 'INR');
    const exchangeRate = Number(poData.exchangeRate || (currency === 'INR' ? 1.0 : 86.80));

    const items = (poData.items || []).map(it => {
      const qty = Number(it.quantity || 0);
      const rateFor = Number(it.unitPriceForeign || it.rate || 0);
      const rateInr = Number(it.unitPriceInr || (rateFor * exchangeRate));
      const discountPct = Number(it.discountPct || 0);
      const baseFor = qty * rateFor;
      const baseInr = qty * rateInr;
      const discAmtInr = (baseInr * discountPct) / 100;
      const taxableAmount = Number((baseInr - discAmtInr).toFixed(2));
      const gstRate = it.gstRate !== undefined ? Number(it.gstRate) : 18;
      const gstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
      const isInterstate = isImport || poData.supplierCountry !== 'India';
      const igst = isInterstate ? gstAmount : 0;
      const cgst = isInterstate ? 0 : Number((gstAmount / 2).toFixed(2));
      const sgst = isInterstate ? 0 : Number((gstAmount / 2).toFixed(2));
      const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));

      // Calculate weight if GSM & dimensions available
      let qtyKgs = it.quantityKgs || 0;
      if (!qtyKgs && it.sizeInches && it.gsm) {
        const parts = it.sizeInches.toLowerCase().split('x').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const singleReamKg = (parts[0] * parts[1] * Number(it.gsm)) / 3100;
          qtyKgs = Math.round(singleReamKg * qty * 100) / 100;
        }
      }

      return {
        ...it,
        quantity: qty,
        quantityKgs: qtyKgs,
        rate: rateFor,
        unitPriceForeign: rateFor,
        unitPriceInr: rateInr,
        discountPct,
        taxableAmount,
        gstRate,
        cgst,
        sgst,
        igst,
        totalAmount,
        totalAmountForeign: Number(baseFor.toFixed(2)),
        totalAmountInr: totalAmount,
        receivedQty: it.receivedQty || 0,
        pendingQty: Math.max(0, qty - (it.receivedQty || 0)),
        damagedQty: it.damagedQty || 0,
        countryOfOrigin: it.countryOfOrigin || (isImport ? (poData.supplierCountry || 'Foreign') : 'India')
      };
    });

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPriceInr), 0);
    const subtotalForeign = items.reduce((sum, it) => sum + (it.quantity * it.unitPriceForeign), 0);
    const discountTotal = items.reduce((sum, it) => sum + ((it.quantity * it.unitPriceInr * it.discountPct) / 100), 0);
    const taxableAmount = items.reduce((sum, it) => sum + it.taxableAmount, 0);
    const cgst = items.reduce((sum, it) => sum + it.cgst, 0);
    const sgst = items.reduce((sum, it) => sum + it.sgst, 0);
    const igst = items.reduce((sum, it) => sum + it.igst, 0);
    const gstAmount = Number((cgst + sgst + igst).toFixed(2));
    const freightAmount = Number(poData.freightAmount || 0);
    const otherCharges = Number(poData.otherTransportCharges || 0);

    const calcGrand = Math.round(taxableAmount + gstAmount + freightAmount + otherCharges);
    const grandTotal = Number(poData.grandTotal !== undefined && poData.grandTotal > 0 ? poData.grandTotal : calcGrand);
    const grandTotalForeign = Number((subtotalForeign).toFixed(2));
    const paidAmount = Number(poData.paidAmount || 0);
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: PurchaseOrder['paymentStatus'] = 'UNPAID';
    if (balanceDue === 0 && grandTotal > 0) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';

    const newPO: PurchaseOrder = {
      id: poData.id || `po-${Date.now()}`,
      purchaseNo,
      poNo: purchaseNo,
      supplierId: poData.supplierId || '',
      supplierName: poData.supplierName || 'Paper Mill Supplier',
      supplierCountry: poData.supplierCountry || (isImport ? 'Foreign' : 'India'),
      isImport,
      currency,
      exchangeRate,
      requisitionId: poData.requisitionId,
      requisitionNo: poData.requisitionNo,
      warehouseId: poData.warehouseId || 'wh-1',
      warehouseName: poData.warehouseName || 'Bhiwandi Central Godown',
      date: poData.date || poData.poDate || now.split('T')[0],
      poDate: poData.poDate || poData.date || now.split('T')[0],
      dueDate: poData.dueDate || now.split('T')[0],
      expectedDeliveryDate: poData.expectedDeliveryDate || now.split('T')[0],
      actualDeliveryDate: poData.actualDeliveryDate,
      paymentTerms: poData.paymentTerms || 'Net 30 Days',
      incoterms: poData.incoterms || (isImport ? 'CIF' : 'FOR'),
      originPort: poData.originPort,
      destinationPort: poData.destinationPort,
      supplierInvoiceNo: poData.supplierInvoiceNo,
      supplierInvoiceDate: poData.supplierInvoiceDate,
      supplierInvoiceAmount: poData.supplierInvoiceAmount,
      transporterId: poData.transporterId,
      transporterName: poData.transporterName,
      vehicleNumber: poData.vehicleNumber,
      lrGrNo: poData.lrGrNo,
      lrGrDate: poData.lrGrDate,
      freightAmount,
      freightPaidBy: poData.freightPaidBy || (isImport ? 'SUPPLIER' : 'SELF'),
      loadingCharges: Number(poData.loadingCharges || 0),
      unloadingCharges: Number(poData.unloadingCharges || 0),
      otherTransportCharges: otherCharges,
      items,
      subtotal,
      subtotalForeign,
      discountTotal,
      taxableAmount,
      cgst,
      sgst,
      igst,
      gstAmount,
      roundOff: Number((grandTotal - (taxableAmount + gstAmount + freightAmount + otherCharges)).toFixed(2)),
      grandTotal,
      grandTotalForeign,
      paidAmount,
      balanceDue,
      paymentStatus,
      status: poData.status || 'DRAFT',
      approvalStatus: poData.approvalStatus || 'PENDING',
      approvedBy: poData.approvedBy,
      approvedAt: poData.approvedAt,
      totalReceivedQty: items.reduce((sum, it) => sum + (it.receivedQty || 0), 0),
      totalPendingQty: items.reduce((sum, it) => sum + (it.pendingQty || 0), 0),
      grnIds: poData.grnIds || [],
      grnNos: poData.grnNos || [],
      shipmentIds: poData.shipmentIds || [],
      shipmentNos: poData.shipmentNos || [],
      notes: poData.notes || '',
      createdAt: poData.createdAt || now,
      updatedAt: now
    };

    if (poData.id) {
      const idx = this.dbRef.purchases.findIndex((p: PurchaseOrder) => p.id === poData.id);
      if (idx !== -1) {
        this.dbRef.purchases[idx] = newPO;
        this.logAudit('PURCHASE_ORDER', newPO.id, 'PURCHASE_ORDER_UPDATED', `Updated Purchase Order #${newPO.purchaseNo}`, user);
        this.saveCallback();
        return newPO;
      }
    }

    this.dbRef.purchases.unshift(newPO);
    this.logAudit('PURCHASE_ORDER', newPO.id, 'PURCHASE_ORDER_CREATED', `Created Purchase Order #${newPO.purchaseNo} to ${newPO.supplierName} (Total ₹${newPO.grandTotal.toLocaleString('en-IN')})`, user);
    this.saveCallback();
    return newPO;
  }

  approvePurchaseOrder(id: string, user: any): PurchaseOrder {
    const po = this.getPurchaseById(id);
    if (!po) throw new Error('Purchase order not found');

    po.approvalStatus = 'APPROVED';
    po.status = po.status === 'DRAFT' ? 'APPROVED' : po.status;
    po.approvedBy = user?.name || 'Super Admin';
    po.approvedAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();

    const idx = this.dbRef.purchases.findIndex((p: PurchaseOrder) => p.id === id);
    if (idx !== -1) this.dbRef.purchases[idx] = po;

    this.logAudit('PURCHASE_ORDER', po.id, 'PURCHASE_ORDER_APPROVED', `Approved Purchase Order #${po.purchaseNo}`, user);
    this.saveCallback();
    return po;
  }

  rejectPurchaseOrder(id: string, reason: string, user: any): PurchaseOrder {
    const po = this.getPurchaseById(id);
    if (!po) throw new Error('Purchase order not found');

    po.approvalStatus = 'REJECTED';
    po.status = 'CANCELLED';
    po.notes = `${po.notes ? po.notes + ' | ' : ''}Rejection reason: ${reason}`;
    po.updatedAt = new Date().toISOString();

    const idx = this.dbRef.purchases.findIndex((p: PurchaseOrder) => p.id === id);
    if (idx !== -1) this.dbRef.purchases[idx] = po;

    this.logAudit('PURCHASE_ORDER', po.id, 'PURCHASE_ORDER_CANCELLED', `Rejected Purchase Order #${po.purchaseNo}. Reason: ${reason}`, user);
    this.saveCallback();
    return po;
  }

  // ==========================================
  // 4. GOODS RECEIPT NOTES (GRN) & WAREHOUSE STOCK UPDATES
  // ==========================================
  getGoodsReceiptNotes(filter?: { poId?: string; status?: string; search?: string }): GoodsReceiptNote[] {
    let grns = (this.dbRef.goodsReceiptNotes || []) as GoodsReceiptNote[];
    if (filter) {
      if (filter.poId) grns = grns.filter(g => g.poId === filter.poId);
      if (filter.status && filter.status !== 'ALL') grns = grns.filter(g => g.status === filter.status);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        grns = grns.filter(g =>
          g.grnNo.toLowerCase().includes(q) ||
          g.poNo.toLowerCase().includes(q) ||
          g.supplierName.toLowerCase().includes(q) ||
          (g.containerNo && g.containerNo.toLowerCase().includes(q)) ||
          g.items.some(it => it.productName.toLowerCase().includes(q))
        );
      }
    }
    return grns;
  }

  getGoodsReceiptNoteById(id: string): GoodsReceiptNote | undefined {
    return (this.dbRef.goodsReceiptNotes || []).find((g: GoodsReceiptNote) => g.id === id || g.grnNo === id);
  }

  saveGoodsReceiptNote(data: Partial<GoodsReceiptNote>, user: any): GoodsReceiptNote {
    const now = new Date().toISOString();
    const count = (this.dbRef.goodsReceiptNotes || []).length + 1;
    const grnNo = data.grnNo || `ABPPL/GRN/25-26/${String(count).padStart(4, '0')}`;

    const items = (data.items || []).map(it => ({
      ...it,
      orderedQty: Number(it.orderedQty || 0),
      receivedQty: Number(it.receivedQty || 0),
      acceptedQty: Number(it.acceptedQty !== undefined ? it.acceptedQty : it.receivedQty || 0),
      rejectedQty: Number(it.rejectedQty || 0),
      damagedQty: Number(it.damagedQty || 0),
      rate: Number(it.rate || 0),
      rateInr: Number(it.rateInr || it.rate || 0)
    }));

    const totalOrderedQty = items.reduce((sum, it) => sum + it.orderedQty, 0);
    const totalReceivedQty = items.reduce((sum, it) => sum + it.receivedQty, 0);
    const totalAcceptedQty = items.reduce((sum, it) => sum + it.acceptedQty, 0);
    const totalRejectedQty = items.reduce((sum, it) => sum + it.rejectedQty, 0);
    const totalDamagedQty = items.reduce((sum, it) => sum + it.damagedQty, 0);

    const newGRN: GoodsReceiptNote = {
      id: data.id || `grn-${Date.now()}`,
      grnNo,
      grnDate: data.grnDate || now.split('T')[0],
      poId: data.poId || '',
      poNo: data.poNo || '',
      shipmentId: data.shipmentId,
      shipmentNo: data.shipmentNo,
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || 'Paper Mill',
      warehouseId: data.warehouseId || 'wh-1',
      warehouseName: data.warehouseName || 'Bhiwandi Central Godown',
      challanNo: data.challanNo || '',
      challanDate: data.challanDate || now.split('T')[0],
      invoiceNo: data.invoiceNo || '',
      vehicleNumber: data.vehicleNumber || '',
      transporterName: data.transporterName || '',
      lrGrNo: data.lrGrNo || '',
      containerNo: data.containerNo,
      sealNo: data.sealNo,
      receivedBy: data.receivedBy || user?.name || 'Warehouse Incharge',
      inspectedBy: data.inspectedBy || user?.name || 'QC Team',
      qcStatus: data.qcStatus || 'PASSED',
      qcRemarks: data.qcRemarks || 'Physical count and moisture checks completed.',
      status: data.status || 'DRAFT',
      stockUpdated: false,
      items,
      totalOrderedQty,
      totalReceivedQty,
      totalAcceptedQty,
      totalRejectedQty,
      totalDamagedQty,
      totalWeightKgs: Number(data.totalWeightKgs || 0),
      notes: data.notes || '',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    if (data.id) {
      const idx = this.dbRef.goodsReceiptNotes.findIndex((g: GoodsReceiptNote) => g.id === data.id);
      if (idx !== -1) {
        this.dbRef.goodsReceiptNotes[idx] = newGRN;
        this.saveCallback();
        return newGRN;
      }
    }

    this.dbRef.goodsReceiptNotes.unshift(newGRN);
    this.logAudit('GOODS_RECEIPT_NOTE', newGRN.id, 'GRN_CREATED', `Created GRN #${newGRN.grnNo} for PO #${newGRN.poNo}`, user);
    this.saveCallback();
    return newGRN;
  }

  confirmGoodsReceiptNote(id: string, user: any): GoodsReceiptNote {
    const grn = this.getGoodsReceiptNoteById(id);
    if (!grn) throw new Error('Goods Receipt Note not found');
    if (grn.status === 'CONFIRMED' && grn.stockUpdated) {
      return grn; // Already confirmed and stock posted
    }

    const now = new Date().toISOString();

    // 1. UPDATE PHYSICAL PRODUCT STOCK AND INVENTORY VALUATION
    grn.items.forEach(item => {
      const prod = (this.dbRef.products || []).find((p: Product) => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase());
      if (prod) {
        const qtyToAdd = item.acceptedQty;
        const stockBefore = prod.currentStock;
        prod.currentStock += qtyToAdd;
        
        // Update batch / lot tracking
        if (item.batchLotNo) {
          prod.rackLocation = `${prod.rackLocation || 'Rack A-01'} [Batch: ${item.batchLotNo}]`;
        }

        // Record stock movement entry
        if (!this.dbRef.stockMovements) this.dbRef.stockMovements = [];
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'STOCK_IN',
          quantity: qtyToAdd,
          unit: item.unit || prod.unit,
          stockBefore,
          stockAfter: prod.currentStock,
          warehouseId: grn.warehouseId,
          warehouseName: grn.warehouseName,
          referenceDocType: 'PURCHASE_GRN',
          referenceNo: grn.grnNo,
          batchNumber: item.batchLotNo,
          reasonCode: 'PURCHASE_RECEIPT',
          reason: `GRN Receipt #${grn.grnNo} from ${grn.supplierName} (PO: ${grn.poNo})`,
          performedBy: user?.name || 'Warehouse Mgr',
          performedByRole: user?.role || 'inventory',
          date: now
        };
        this.dbRef.stockMovements.unshift(movement);
      }
    });

    // 2. UPDATE LINKED PURCHASE ORDER QUANTITIES & STATUS
    if (grn.poId) {
      const po = (this.dbRef.purchases || []).find((p: PurchaseOrder) => p.id === grn.poId);
      if (po) {
        if (!po.grnIds) po.grnIds = [];
        if (!po.grnNos) po.grnNos = [];
        if (!po.grnIds.includes(grn.id)) po.grnIds.push(grn.id);
        if (!po.grnNos.includes(grn.grnNo)) po.grnNos.push(grn.grnNo);

        grn.items.forEach(gItem => {
          const poItem = po.items.find(pi => pi.productId === gItem.productId || pi.productName === gItem.productName);
          if (poItem) {
            poItem.receivedQty = (poItem.receivedQty || 0) + gItem.acceptedQty;
            poItem.pendingQty = Math.max(0, poItem.quantity - poItem.receivedQty);
            poItem.damagedQty = (poItem.damagedQty || 0) + gItem.damagedQty;
            if (gItem.batchLotNo) poItem.batchLotNo = gItem.batchLotNo;
            if (gItem.containerNo) poItem.containerNo = gItem.containerNo;
          }
        });

        po.totalReceivedQty = po.items.reduce((sum, it) => sum + (it.receivedQty || 0), 0);
        po.totalPendingQty = po.items.reduce((sum, it) => sum + (it.pendingQty || 0), 0);

        if (po.totalPendingQty === 0) {
          po.status = 'RECEIVED';
        } else if (po.totalReceivedQty > 0) {
          po.status = 'PARTIALLY_RECEIVED';
        }
        po.actualDeliveryDate = now.split('T')[0];
        po.updatedAt = now;
      }
    }

    grn.status = 'CONFIRMED';
    grn.confirmedBy = user?.name || 'Warehouse Incharge';
    grn.confirmedAt = now;
    grn.stockUpdated = true;
    grn.updatedAt = now;

    const idx = this.dbRef.goodsReceiptNotes.findIndex((g: GoodsReceiptNote) => g.id === id);
    if (idx !== -1) this.dbRef.goodsReceiptNotes[idx] = grn;

    this.logAudit('GOODS_RECEIPT_NOTE', grn.id, 'GRN_CONFIRMED', `Confirmed GRN #${grn.grnNo}. Credited ${grn.totalAcceptedQty} units into ${grn.warehouseName}`, user);
    this.saveCallback();
    return grn;
  }

  // ==========================================
  // 5. IMPORT SHIPMENT MANAGEMENT
  // ==========================================
  getImportShipments(filter?: { status?: string; search?: string }): ImportShipment[] {
    let ships = (this.dbRef.importShipments || []) as ImportShipment[];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        ships = ships.filter(s => s.status === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        ships = ships.filter(s =>
          s.shipmentNo.toLowerCase().includes(q) ||
          s.supplierName.toLowerCase().includes(q) ||
          (s.containerNumber && s.containerNumber.toLowerCase().includes(q)) ||
          (s.blAwbNumber && s.blAwbNumber.toLowerCase().includes(q)) ||
          (s.billOfEntryNo && s.billOfEntryNo.toLowerCase().includes(q)) ||
          s.poNos.some(p => p.toLowerCase().includes(q))
        );
      }
    }
    return ships;
  }

  getImportShipmentById(id: string): ImportShipment | undefined {
    return (this.dbRef.importShipments || []).find((s: ImportShipment) => s.id === id || s.shipmentNo === id);
  }

  saveImportShipment(data: Partial<ImportShipment>, user: any): ImportShipment {
    const now = new Date().toISOString();
    const count = (this.dbRef.importShipments || []).length + 1;
    const shipmentNo = data.shipmentNo || `ABPPL/IMP/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;

    const newShip: ImportShipment = {
      id: data.id || `imp-${Date.now()}`,
      shipmentNo,
      poIds: data.poIds || [],
      poNos: data.poNos || [],
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || 'Foreign Mill',
      originCountry: data.originCountry || 'Finland',
      originPort: data.originPort || 'Helsinki Port',
      destinationPort: data.destinationPort || 'Nhava Sheva (JNPT), Mumbai',
      warehouseId: data.warehouseId || 'wh-1',
      warehouseName: data.warehouseName || 'Bhiwandi Central Godown',
      shippingLine: data.shippingLine || 'Maersk Line',
      freightForwarder: data.freightForwarder || 'Kuehne + Nagel Logistics',
      clearingAgent: data.clearingAgent || 'Om Freight CHA Pvt Ltd',
      transporterName: data.transporterName || '',
      containerNumber: data.containerNumber || 'MSKU-0000000',
      containerType: data.containerType || '40FT_HIGH_CUBE',
      sealNumber: data.sealNumber || '',
      blAwbNumber: data.blAwbNumber || '',
      blDate: data.blDate || now.split('T')[0],
      commercialInvoiceNumber: data.commercialInvoiceNumber || '',
      commercialInvoiceDate: data.commercialInvoiceDate || now.split('T')[0],
      commercialInvoiceAmountForeign: Number(data.commercialInvoiceAmountForeign || 0),
      commercialInvoiceCurrency: data.commercialInvoiceCurrency || 'USD',
      exchangeRate: Number(data.exchangeRate || 86.80),
      packingListNumber: data.packingListNumber || '',
      insurancePolicyNumber: data.insurancePolicyNumber || '',
      insuranceCompany: data.insuranceCompany || '',
      etd: data.etd || now.split('T')[0],
      eta: data.eta || now.split('T')[0],
      actualArrivalDate: data.actualArrivalDate,
      customsClearanceDate: data.customsClearanceDate,
      warehouseReceivingDate: data.warehouseReceivingDate,
      status: data.status || 'PLANNED',
      billOfEntryNo: data.billOfEntryNo || '',
      billOfEntryDate: data.billOfEntryDate,
      dutyChallanNo: data.dutyChallanNo || '',
      customsDutyAmountInr: Number(data.customsDutyAmountInr || 0),
      totalWeightKg: Number(data.totalWeightKg || 0),
      totalWeightMt: Number(data.totalWeightMt || (Number(data.totalWeightKg || 0) / 1000)),
      totalPackages: Number(data.totalPackages || 0),
      packageType: data.packageType || 'Wooden Pallets',
      documents: data.documents || [],
      timeline: data.timeline || [
        {
          id: `tl-${Date.now()}`,
          status: data.status || 'PLANNED',
          title: 'Shipment Created',
          description: `Import shipment created for PO ${data.poNos?.join(', ') || 'N/A'}`,
          location: data.originPort || 'Origin',
          timestamp: now,
          recordedBy: user?.name || 'Purchase Dept'
        }
      ],
      landedCostId: data.landedCostId,
      landedCostStatus: data.landedCostStatus || 'NOT_CALCULATED',
      finalLandedCostInr: Number(data.finalLandedCostInr || 0),
      notes: data.notes || '',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    if (data.id) {
      const idx = this.dbRef.importShipments.findIndex((s: ImportShipment) => s.id === data.id);
      if (idx !== -1) {
        this.dbRef.importShipments[idx] = newShip;
        this.logAudit('IMPORT_SHIPMENT', newShip.id, 'SHIPMENT_UPDATED', `Updated Import Shipment #${newShip.shipmentNo}`, user);
        this.saveCallback();
        return newShip;
      }
    }

    this.dbRef.importShipments.unshift(newShip);
    this.logAudit('IMPORT_SHIPMENT', newShip.id, 'SHIPMENT_CREATED', `Created Import Shipment #${newShip.shipmentNo} (${newShip.containerNumber})`, user);
    this.saveCallback();
    return newShip;
  }

  updateShipmentTimeline(id: string, newStatus: ImportShipment['status'], location: string, description: string, user: any): ImportShipment {
    const ship = this.getImportShipmentById(id);
    if (!ship) throw new Error('Shipment not found');

    const now = new Date().toISOString();
    ship.status = newStatus;
    if (newStatus === 'ARRIVED_AT_PORT' && !ship.actualArrivalDate) {
      ship.actualArrivalDate = now.split('T')[0];
    }
    if (newStatus === 'CUSTOMS_CLEARED' && !ship.customsClearanceDate) {
      ship.customsClearanceDate = now.split('T')[0];
    }
    if (newStatus === 'DELIVERED_TO_WAREHOUSE' && !ship.warehouseReceivingDate) {
      ship.warehouseReceivingDate = now.split('T')[0];
    }

    if (!ship.timeline) ship.timeline = [];
    ship.timeline.unshift({
      id: `tl-${Date.now()}`,
      status: newStatus,
      title: `Status: ${newStatus.replace(/_/g, ' ')}`,
      description,
      location,
      timestamp: now,
      recordedBy: user?.name || 'Import Operations'
    });

    ship.updatedAt = now;

    const idx = this.dbRef.importShipments.findIndex((s: ImportShipment) => s.id === id);
    if (idx !== -1) this.dbRef.importShipments[idx] = ship;

    this.logAudit('IMPORT_SHIPMENT', ship.id, 'SHIPMENT_STATUS_CHANGED', `Shipment #${ship.shipmentNo} moved to ${newStatus} at ${location}`, user);
    this.saveCallback();
    return ship;
  }

  // ==========================================
  // 6. LANDED COST ENGINE & VALUATION UPDATES
  // ==========================================
  getLandedCostCalculations(filter?: { shipmentId?: string; search?: string }): LandedCostCalculation[] {
    let lcs = (this.dbRef.landedCostCalculations || []) as LandedCostCalculation[];
    if (filter) {
      if (filter.shipmentId) lcs = lcs.filter(l => l.shipmentId === filter.shipmentId);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        lcs = lcs.filter(l =>
          l.calculationNo.toLowerCase().includes(q) ||
          l.shipmentNo.toLowerCase().includes(q) ||
          l.poNos.some(p => p.toLowerCase().includes(q))
        );
      }
    }
    return lcs;
  }

  getLandedCostById(id: string): LandedCostCalculation | undefined {
    return (this.dbRef.landedCostCalculations || []).find((l: LandedCostCalculation) => l.id === id || l.calculationNo === id);
  }

  getLandedCostByShipmentId(shipmentId: string): LandedCostCalculation | undefined {
    return (this.dbRef.landedCostCalculations || []).find((l: LandedCostCalculation) => l.shipmentId === shipmentId);
  }

  saveLandedCostCalculation(data: Partial<LandedCostCalculation>, user: any): LandedCostCalculation {
    const now = new Date().toISOString();
    const count = (this.dbRef.landedCostCalculations || []).length + 1;
    const calculationNo = data.calculationNo || `ABPPL/LC/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;

    const exRate = Number(data.exchangeRate || 86.80);
    const fobFor = Number(data.fobProductCostForeign || 0);
    const fobInr = Number(data.fobProductCostInr || (fobFor * exRate));

    const estFreight = Number(data.estimatedOceanAirFreightInr || 0);
    const actFreight = Number(data.actualOceanAirFreightInr || estFreight);

    const estIns = Number(data.estimatedMarineInsuranceInr || 0);
    const actIns = Number(data.actualMarineInsuranceInr || estIns);

    const cifInr = Number(fobInr + actFreight + actIns);

    const estDuty = Number(data.estimatedCustomsDutyInr || (cifInr * 0.10));
    const actDuty = Number(data.actualCustomsDutyInr !== undefined ? data.actualCustomsDutyInr : estDuty);

    const estSws = Number(data.estimatedSwsInr || (estDuty * 0.10));
    const actSws = Number(data.actualSwsInr !== undefined ? data.actualSwsInr : estSws);

    const estIgst = Number(data.estimatedIgstInr || ((cifInr + estDuty + estSws) * 0.18));
    const actIgst = Number(data.actualIgstInr !== undefined ? data.actualIgstInr : estIgst);

    const estPort = Number(data.estimatedPortHandlingInr || 0);
    const actPort = Number(data.actualPortHandlingInr !== undefined ? data.actualPortHandlingInr : estPort);

    const estCha = Number(data.estimatedChaFeesInr || 0);
    const actCha = Number(data.actualChaFeesInr !== undefined ? data.actualChaFeesInr : estCha);

    const estStorage = Number(data.estimatedStorageDemurrageInr || 0);
    const actStorage = Number(data.actualStorageDemurrageInr !== undefined ? data.actualStorageDemurrageInr : estStorage);

    const estBank = Number(data.estimatedBankChargesInr || 0);
    const actBank = Number(data.actualBankChargesInr !== undefined ? data.actualBankChargesInr : estBank);

    const estInsp = Number(data.estimatedInspectionFeesInr || 0);
    const actInsp = Number(data.actualInspectionFeesInr !== undefined ? data.actualInspectionFeesInr : estInsp);

    const estLocal = Number(data.estimatedLocalTransportInr || 0);
    const actLocal = Number(data.actualLocalTransportInr !== undefined ? data.actualLocalTransportInr : estLocal);

    const estMisc = Number(data.estimatedMiscellaneousInr || 0);
    const actMisc = Number(data.actualMiscellaneousInr !== undefined ? data.actualMiscellaneousInr : estMisc);

    // Landed Cost = FOB + Freight + Insurance + Duty + SWS + Port + CHA + Storage + Bank + Insp + Local + Misc (IGST is recoverable credit)
    const estTotal = Number((fobInr + estFreight + estIns + estDuty + estSws + estPort + estCha + estStorage + estBank + estInsp + estLocal + estMisc).toFixed(2));
    const actTotal = Number((fobInr + actFreight + actIns + actDuty + actSws + actPort + actCha + actStorage + actBank + actInsp + actLocal + actMisc).toFixed(2));
    const varianceAmt = Number((actTotal - estTotal).toFixed(2));
    const variancePct = estTotal > 0 ? Number(((varianceAmt / estTotal) * 100).toFixed(2)) : 0;

    // Allocate across items by weight or value
    const totalWeight = (data.items || []).reduce((sum, it) => sum + (it.weightKg || (it.quantity * 25)), 0);
    const totalFob = (data.items || []).reduce((sum, it) => sum + (it.fobTotalInr || (it.quantity * it.fobUnitForeign * exRate)), 0);
    const totalAddCost = actTotal - fobInr;

    const items = (data.items || []).map(it => {
      const itQty = Number(it.quantity || 1);
      const itWeight = Number(it.weightKg || (itQty * 25));
      const itFobFor = Number(it.fobTotalForeign || (itQty * (it.fobUnitForeign || 0)));
      const itFobInr = Number(it.fobTotalInr || (itFobFor * exRate));

      let allocationRatio = 1.0;
      if (data.allocationMethod === 'BY_VALUE' && totalFob > 0) {
        allocationRatio = itFobInr / totalFob;
      } else if (totalWeight > 0) {
        allocationRatio = itWeight / totalWeight;
      }

      const itAddCost = Number((totalAddCost * allocationRatio).toFixed(2));
      const itLandedTotal = Number((itFobInr + itAddCost).toFixed(2));
      const itLandedPerUnit = Number((itLandedTotal / itQty).toFixed(2));
      const itLandedPerKg = itWeight > 0 ? Number((itLandedTotal / itWeight).toFixed(2)) : 0;
      const marginPct = Number(it.suggestedMarginPct || 14);
      const suggestedSell = Number((itLandedPerUnit * (1 + marginPct / 100)).toFixed(2));

      return {
        ...it,
        fobTotalForeign: itFobFor,
        fobTotalInr: itFobInr,
        allocatedFreightInr: Number((actFreight * allocationRatio).toFixed(2)),
        allocatedInsuranceInr: Number((actIns * allocationRatio).toFixed(2)),
        cifTotalInr: Number((itFobInr + (actFreight + actIns) * allocationRatio).toFixed(2)),
        cifUnitInr: Number(((itFobInr + (actFreight + actIns) * allocationRatio) / itQty).toFixed(2)),
        allocatedCustomsDutyInr: Number((actDuty * allocationRatio).toFixed(2)),
        allocatedSwsInr: Number((actSws * allocationRatio).toFixed(2)),
        allocatedIgstInr: Number((actIgst * allocationRatio).toFixed(2)),
        allocatedPortHandlingInr: Number((actPort * allocationRatio).toFixed(2)),
        allocatedChaFeesInr: Number((actCha * allocationRatio).toFixed(2)),
        allocatedStorageDemurrageInr: Number((actStorage * allocationRatio).toFixed(2)),
        allocatedBankChargesInr: Number((actBank * allocationRatio).toFixed(2)),
        allocatedLocalTransportInr: Number((actLocal * allocationRatio).toFixed(2)),
        allocatedOtherChargesInr: Number(((actInsp + actMisc) * allocationRatio).toFixed(2)),
        totalAdditionalChargesInr: itAddCost,
        finalLandedCostTotalInr: itLandedTotal,
        finalLandedCostPerUnitInr: itLandedPerUnit,
        finalLandedCostPerKgInr: itLandedPerKg,
        suggestedMarginPct: marginPct,
        suggestedSellingPriceInr: suggestedSell
      };
    });

    const newLC: LandedCostCalculation = {
      id: data.id || `lc-${Date.now()}`,
      calculationNo,
      shipmentId: data.shipmentId || '',
      shipmentNo: data.shipmentNo || '',
      poIds: data.poIds || [],
      poNos: data.poNos || [],
      calculationDate: data.calculationDate || now.split('T')[0],
      currency: data.currency || 'USD',
      exchangeRate: exRate,
      allocationMethod: data.allocationMethod || 'BY_WEIGHT',
      fobProductCostForeign: fobFor,
      fobProductCostInr: fobInr,
      estimatedOceanAirFreightInr: estFreight,
      actualOceanAirFreightInr: actFreight,
      estimatedMarineInsuranceInr: estIns,
      actualMarineInsuranceInr: actIns,
      cifValueInr: cifInr,
      estimatedCustomsDutyInr: estDuty,
      actualCustomsDutyInr: actDuty,
      estimatedSwsInr: estSws,
      actualSwsInr: actSws,
      estimatedIgstInr: estIgst,
      actualIgstInr: actIgst,
      estimatedPortHandlingInr: estPort,
      actualPortHandlingInr: actPort,
      estimatedChaFeesInr: estCha,
      actualChaFeesInr: actCha,
      estimatedStorageDemurrageInr: estStorage,
      actualStorageDemurrageInr: actStorage,
      estimatedBankChargesInr: estBank,
      actualBankChargesInr: actBank,
      estimatedInspectionFeesInr: estInsp,
      actualInspectionFeesInr: actInsp,
      estimatedLocalTransportInr: estLocal,
      actualLocalTransportInr: actLocal,
      estimatedMiscellaneousInr: estMisc,
      actualMiscellaneousInr: actMisc,
      totalEstimatedLandedCostInr: estTotal,
      totalActualLandedCostInr: actTotal,
      varianceAmountInr: varianceAmt,
      variancePercentage: variancePct,
      isActualFinalized: Boolean(data.isActualFinalized),
      inventoryValuationUpdated: Boolean(data.inventoryValuationUpdated),
      inventoryUpdatedDate: data.inventoryUpdatedDate,
      items,
      formulaBreakdown: 'Final Landed Cost = FOB Purchase Cost + Ocean Freight + Transit Insurance + Basic Customs Duty (BCD 10%) + Social Welfare Surcharge (SWS 10%) + Port/Terminal Handling + CHA Clearing + CFS Storage + Bank/LC Fees + Local Inland Transport (Excluding recoverable input IGST)',
      calculatedBy: data.calculatedBy || user?.name || 'Accounts Head',
      calculatedAt: data.calculatedAt || now,
      finalizedBy: data.finalizedBy,
      finalizedAt: data.finalizedAt,
      auditHistory: data.auditHistory || [
        {
          id: `lca-${Date.now()}`,
          timestamp: now,
          performedBy: user?.name || 'Accounts Team',
          action: 'INITIAL_ESTIMATED_CALCULATION',
          previousLandedCostTotal: 0,
          newLandedCostTotal: estTotal,
          varianceNotes: 'Initial estimate recorded.'
        }
      ],
      notes: data.notes || ''
    };

    if (data.id) {
      const idx = this.dbRef.landedCostCalculations.findIndex((l: LandedCostCalculation) => l.id === data.id);
      if (idx !== -1) {
        this.dbRef.landedCostCalculations[idx] = newLC;
        this.saveCallback();
        return newLC;
      }
    }

    this.dbRef.landedCostCalculations.unshift(newLC);
    this.logAudit('LANDED_COST', newLC.id, 'LANDED_COST_CALCULATED', `Saved Landed Cost Calculation #${newLC.calculationNo} for Shipment #${newLC.shipmentNo}`, user);
    this.saveCallback();
    return newLC;
  }

  finalizeLandedCost(id: string, user: any): LandedCostCalculation {
    const lc = this.getLandedCostById(id);
    if (!lc) throw new Error('Landed Cost record not found');

    const now = new Date().toISOString();
    lc.isActualFinalized = true;
    lc.finalizedBy = user?.name || 'Super Admin';
    lc.finalizedAt = now;
    lc.inventoryValuationUpdated = true;
    lc.inventoryUpdatedDate = now;

    // 1. UPDATE PRODUCT INVENTORY COST VALUATION & SALE SUGGESTIONS
    lc.items.forEach(it => {
      const prod = (this.dbRef.products || []).find((p: Product) => p.id === it.productId || p.name.toLowerCase() === it.productName.toLowerCase());
      if (prod) {
        prod.purchaseRate = it.finalLandedCostPerUnitInr;
        if (it.suggestedSellingPriceInr && it.suggestedSellingPriceInr > 0) {
          prod.saleRate = it.suggestedSellingPriceInr;
          prod.ratePerUnit = it.suggestedSellingPriceInr;
        }
      }
    });

    // 2. UPDATE LINKED IMPORT SHIPMENT
    if (lc.shipmentId) {
      const ship = (this.dbRef.importShipments || []).find((s: ImportShipment) => s.id === lc.shipmentId);
      if (ship) {
        ship.landedCostStatus = 'ACTUAL_ALLOCATED';
        ship.finalLandedCostInr = lc.totalActualLandedCostInr;
        ship.updatedAt = now;
      }
    }

    if (!lc.auditHistory) lc.auditHistory = [];
    lc.auditHistory.unshift({
      id: `lca-${Date.now()}`,
      timestamp: now,
      performedBy: user?.name || 'Super Admin',
      action: 'FINAL_ACTUAL_COST_FINALIZED',
      previousLandedCostTotal: lc.totalEstimatedLandedCostInr,
      newLandedCostTotal: lc.totalActualLandedCostInr,
      varianceNotes: `Finalized actual landed cost. Variance: ₹${lc.varianceAmountInr.toLocaleString('en-IN')} (${lc.variancePercentage}%). Inventory valuation rates updated.`
    });

    const idx = this.dbRef.landedCostCalculations.findIndex((l: LandedCostCalculation) => l.id === id);
    if (idx !== -1) this.dbRef.landedCostCalculations[idx] = lc;

    this.logAudit('LANDED_COST', lc.id, 'LANDED_COST_FINALIZED', `Finalized Landed Cost #${lc.calculationNo} (Total: ₹${lc.totalActualLandedCostInr.toLocaleString('en-IN')})`, user);
    this.saveCallback();
    return lc;
  }

  // ==========================================
  // 7. 3-WAY MATCHING (PO vs GRN vs INVOICE)
  // ==========================================
  getThreeWayMatches(filter?: { status?: string; search?: string }): ThreeWayMatch[] {
    let matches = (this.dbRef.threeWayMatches || []) as ThreeWayMatch[];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        matches = matches.filter(m => m.matchStatus === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        matches = matches.filter(m =>
          m.matchNo.toLowerCase().includes(q) ||
          m.poNo.toLowerCase().includes(q) ||
          m.grnNo.toLowerCase().includes(q) ||
          m.supplierName.toLowerCase().includes(q) ||
          (m.supplierInvoiceNo && m.supplierInvoiceNo.toLowerCase().includes(q))
        );
      }
    }
    return matches;
  }

  performThreeWayMatch(data: Partial<ThreeWayMatch>, user: any): ThreeWayMatch {
    const now = new Date().toISOString();
    const count = (this.dbRef.threeWayMatches || []).length + 1;
    const matchNo = data.matchNo || `ABPPL/3WM/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;

    const po = (this.dbRef.purchases || []).find((p: PurchaseOrder) => p.id === data.poId || p.purchaseNo === data.poNo);
    const grn = (this.dbRef.goodsReceiptNotes || []).find((g: GoodsReceiptNote) => g.id === data.grnId || g.grnNo === data.grnNo);

    const poTotal = Number(data.poTotalAmount || po?.grandTotal || 0);
    const grnVal = Number(data.grnAcceptedValue || (grn ? grn.items.reduce((s, it) => s + (it.acceptedQty * it.rateInr), 0) : 0));
    const invTotal = Number(data.invoiceTotalAmount || poTotal);

    const qVariance = Number(data.quantityVariance || 0);
    const pVariance = Number(data.priceVariance || 0);
    const tVariance = Number((invTotal - grnVal).toFixed(2));

    let status: ThreeWayMatch['matchStatus'] = 'MATCHED';
    if (Math.abs(tVariance) > 50 || qVariance > 0 || pVariance > 0) {
      status = 'EXCEPTION_VARIANCE';
    }

    const newMatch: ThreeWayMatch = {
      id: data.id || `3wm-${Date.now()}`,
      matchNo,
      date: data.date || now.split('T')[0],
      poId: data.poId || po?.id || '',
      poNo: data.poNo || po?.purchaseNo || '',
      grnId: data.grnId || grn?.id || '',
      grnNo: data.grnNo || grn?.grnNo || '',
      supplierInvoiceNo: data.supplierInvoiceNo || po?.supplierInvoiceNo || '',
      supplierInvoiceDate: data.supplierInvoiceDate || po?.supplierInvoiceDate || now.split('T')[0],
      supplierId: data.supplierId || po?.supplierId || '',
      supplierName: data.supplierName || po?.supplierName || 'Paper Mill',
      poTotalAmount: poTotal,
      grnAcceptedValue: grnVal,
      invoiceTotalAmount: invTotal,
      quantityVariance: qVariance,
      priceVariance: pVariance,
      taxVariance: Number(data.taxVariance || 0),
      totalVariance: tVariance,
      matchStatus: data.matchStatus || status,
      varianceReason: data.varianceReason,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      payableAmount: Number(data.payableAmount || grnVal || invTotal),
      paymentScheduledDate: data.paymentScheduledDate || po?.dueDate || now.split('T')[0],
      createdAt: now
    };

    if (data.id) {
      const idx = this.dbRef.threeWayMatches.findIndex((m: ThreeWayMatch) => m.id === data.id);
      if (idx !== -1) {
        this.dbRef.threeWayMatches[idx] = newMatch;
        this.saveCallback();
        return newMatch;
      }
    }

    this.dbRef.threeWayMatches.unshift(newMatch);
    this.logAudit('GOODS_RECEIPT_NOTE', newMatch.id, 'PURCHASE_ORDER_UPDATED', `Executed 3-Way Match #${newMatch.matchNo} for PO #${newMatch.poNo}`, user);
    this.saveCallback();
    return newMatch;
  }

  approveThreeWayMatch(id: string, notes: string, user: any): ThreeWayMatch {
    const match = (this.dbRef.threeWayMatches || []).find((m: ThreeWayMatch) => m.id === id);
    if (!match) throw new Error('3-Way Match record not found');

    match.matchStatus = 'APPROVED_OVERRIDE';
    match.approvedBy = user?.name || 'Accounts Head';
    match.approvedAt = new Date().toISOString();
    match.varianceReason = `${match.varianceReason ? match.varianceReason + ' | ' : ''}Approved by Accounts: ${notes}`;

    const idx = this.dbRef.threeWayMatches.findIndex((m: ThreeWayMatch) => m.id === id);
    if (idx !== -1) this.dbRef.threeWayMatches[idx] = match;

    this.saveCallback();
    return match;
  }

  // ==========================================
  // 8. PURCHASE RETURNS & DEBIT NOTES
  // ==========================================
  getPurchaseReturns(filter?: { status?: string; search?: string }): PurchaseReturn[] {
    let rets = (this.dbRef.purchaseReturns || []) as PurchaseReturn[];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') rets = rets.filter(r => r.status === filter.status);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rets = rets.filter(r =>
          r.returnNo.toLowerCase().includes(q) ||
          r.debitNoteNo.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          r.poNo.toLowerCase().includes(q)
        );
      }
    }
    return rets;
  }

  savePurchaseReturn(data: Partial<PurchaseReturn>, user: any): PurchaseReturn {
    const now = new Date().toISOString();
    const count = (this.dbRef.purchaseReturns || []).length + 1;
    const returnNo = data.returnNo || `ABPPL/PRN/25-26/${String(count).padStart(4, '0')}`;
    const debitNoteNo = data.debitNoteNo || `ABPPL/DN/25-26/${String(count).padStart(4, '0')}`;

    const items = (data.items || []).map(it => {
      const qty = Number(it.returnQty || 0);
      const rate = Number(it.unitRate || 0);
      const taxable = Number((qty * rate).toFixed(2));
      const gstRate = Number(it.gstRate || 18);
      const gstAmt = Number(((taxable * gstRate) / 100).toFixed(2));
      const total = Number((taxable + gstAmt).toFixed(2));
      return {
        ...it,
        returnQty: qty,
        unitRate: rate,
        taxableAmount: taxable,
        gstRate,
        gstAmount: gstAmt,
        totalAmount: total
      };
    });

    const subtotal = items.reduce((s, it) => s + it.taxableAmount, 0);
    const gstAmount = items.reduce((s, it) => s + it.gstAmount, 0);
    const grandTotal = items.reduce((s, it) => s + it.totalAmount, 0);

    const newRet: PurchaseReturn = {
      id: data.id || `prn-${Date.now()}`,
      returnNo,
      debitNoteNo,
      returnDate: data.returnDate || now.split('T')[0],
      poId: data.poId || '',
      poNo: data.poNo || '',
      grnId: data.grnId,
      grnNo: data.grnNo,
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || 'Paper Mill',
      warehouseId: data.warehouseId || 'wh-1',
      warehouseName: data.warehouseName || 'Bhiwandi Central Godown',
      reasonCategory: data.reasonCategory || 'DAMAGED_PAPER',
      reasonDetails: data.reasonDetails || 'Damaged during transit / mill defect',
      items,
      subtotal,
      gstAmount,
      grandTotal,
      status: data.status || 'DRAFT',
      supplierCreditNoteNo: data.supplierCreditNoteNo,
      supplierCreditNoteDate: data.supplierCreditNoteDate,
      approvedBy: data.approvedBy || user?.name,
      approvedAt: data.approvedAt || now,
      stockAdjusted: true,
      notes: data.notes || '',
      createdAt: now
    };

    // Deduct damaged / returned stock from inventory
    items.forEach(it => {
      const prod = (this.dbRef.products || []).find((p: Product) => p.id === it.productId || p.name.toLowerCase() === it.productName.toLowerCase());
      if (prod) {
        const stockBefore = prod.currentStock;
        prod.currentStock = Math.max(0, prod.currentStock - it.returnQty);

        if (!this.dbRef.stockMovements) this.dbRef.stockMovements = [];
        this.dbRef.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'STOCK_OUT',
          quantity: it.returnQty,
          unit: it.unit || prod.unit,
          stockBefore,
          stockAfter: prod.currentStock,
          warehouseId: newRet.warehouseId,
          warehouseName: newRet.warehouseName,
          referenceDocType: 'PURCHASE_RETURN',
          referenceNo: newRet.debitNoteNo,
          batchNumber: it.batchLotNo,
          reasonCode: 'SUPPLIER_RETURN',
          reason: `Purchase Return #${newRet.returnNo} to ${newRet.supplierName} (${it.reason || 'Defect'})`,
          performedBy: user?.name || 'Warehouse QC',
          date: now
        });
      }
    });

    if (data.id) {
      const idx = this.dbRef.purchaseReturns.findIndex((r: PurchaseReturn) => r.id === data.id);
      if (idx !== -1) {
        this.dbRef.purchaseReturns[idx] = newRet;
        this.saveCallback();
        return newRet;
      }
    }

    this.dbRef.purchaseReturns.unshift(newRet);
    this.logAudit('PURCHASE_RETURN', newRet.id, 'PURCHASE_RETURN_CREATED', `Issued Debit Note #${newRet.debitNoteNo} to ${newRet.supplierName} (Total ₹${newRet.grandTotal.toLocaleString('en-IN')})`, user);
    this.saveCallback();
    return newRet;
  }

  // ==========================================
  // 9. SUPPLIER PAYMENTS
  // ==========================================
  getSupplierPayments(filter?: { supplierId?: string; poId?: string; search?: string }): SupplierPayment[] {
    let pays = (this.dbRef.supplierPayments || []) as SupplierPayment[];
    if (filter) {
      if (filter.supplierId) pays = pays.filter(p => p.supplierId === filter.supplierId);
      if (filter.poId) pays = pays.filter(p => p.poId === filter.poId);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        pays = pays.filter(p =>
          p.paymentNo.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
          (p.poNo && p.poNo.toLowerCase().includes(q))
        );
      }
    }
    return pays;
  }

  saveSupplierPayment(data: Partial<SupplierPayment>, user: any): SupplierPayment {
    const now = new Date().toISOString();
    const count = (this.dbRef.supplierPayments || []).length + 1;
    const paymentNo = data.paymentNo || `ABPPL/SPAY/25-26/${String(count).padStart(4, '0')}`;

    const amountInr = Number(data.amountInr || 0);
    const amountForeign = Number(data.amountForeign || 0);
    const exRate = Number(data.exchangeRate || 1.0);

    const newPayment: SupplierPayment = {
      id: data.id || `spay-${Date.now()}`,
      paymentNo,
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || 'Paper Mill',
      supplierCountry: data.supplierCountry || 'India',
      isInternational: Boolean(data.isInternational || (data.currency && data.currency !== 'INR')),
      currency: data.currency || 'INR',
      exchangeRate: exRate,
      amountForeign: amountForeign > 0 ? amountForeign : Number((amountInr / exRate).toFixed(2)),
      amountInr,
      paymentDate: data.paymentDate || now.split('T')[0],
      poId: data.poId,
      poNo: data.poNo,
      shipmentId: data.shipmentId,
      shipmentNo: data.shipmentNo,
      invoiceNo: data.invoiceNo,
      paymentMode: data.paymentMode || 'BANK_TRANSFER',
      paymentType: data.paymentType || 'PARTIAL',
      bankName: data.bankName || 'HDFC Bank Corporate',
      referenceNo: data.referenceNo || 'REF-UTR',
      swiftBic: data.swiftBic,
      taxDeductedTds: Number(data.taxDeductedTds || 0),
      status: data.status || 'COMPLETED',
      notes: data.notes || '',
      createdBy: data.createdBy || user?.name || 'Accounts Head',
      createdAt: now
    };

    // Update PO paid amount if linked
    if (newPayment.poId) {
      const po = (this.dbRef.purchases || []).find((p: PurchaseOrder) => p.id === newPayment.poId);
      if (po) {
        po.paidAmount = (po.paidAmount || 0) + newPayment.amountInr;
        po.balanceDue = Math.max(0, po.grandTotal - po.paidAmount);
        po.paymentStatus = po.balanceDue === 0 ? 'PAID' : 'PARTIAL';
        po.updatedAt = now;
      }
    }

    if (data.id) {
      const idx = this.dbRef.supplierPayments.findIndex((p: SupplierPayment) => p.id === data.id);
      if (idx !== -1) {
        this.dbRef.supplierPayments[idx] = newPayment;
        this.saveCallback();
        return newPayment;
      }
    }

    this.dbRef.supplierPayments.unshift(newPayment);
    this.logAudit('SUPPLIER_PAYMENT', newPayment.id, 'PAYMENT_RECORDED', `Disbursed supplier payment #${newPayment.paymentNo} of ₹${newPayment.amountInr.toLocaleString('en-IN')} to ${newPayment.supplierName}`, user);
    this.saveCallback();
    return newPayment;
  }

  // ==========================================
  // 10. PURCHASE & IMPORT ANALYTICS KPI STATS
  // ==========================================
  getPurchaseStats(): PurchaseStats {
    const pos = this.getPurchases();
    const ships = this.getImportShipments();
    const reqs = this.getPurchaseRequisitions();
    const grns = this.getGoodsReceiptNotes();
    const lcs = this.getLandedCostCalculations();

    const totalOrders = pos.length;
    const pendingApprovalOrders = pos.filter(p => p.approvalStatus === 'PENDING').length;
    const activeImportShipments = ships.filter(s => s.status !== 'DELIVERED_TO_WAREHOUSE' && s.status !== 'CLOSED').length;
    const customsClearedShipments = ships.filter(s => s.status === 'CUSTOMS_CLEARED' || s.status === 'DELIVERED_TO_WAREHOUSE').length;
    const pendingGrnCount = grns.filter(g => g.status === 'DRAFT' || !g.stockUpdated).length;
    const pendingRequisitions = reqs.filter(r => r.status === 'PENDING_APPROVAL').length;

    const totalPurchaseValueInr = pos.filter(p => p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const totalImportValueInr = pos.filter(p => p.isImport && p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const totalDomesticValueInr = pos.filter(p => !p.isImport && p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const totalPaidInr = pos.filter(p => p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstandingInr = Math.max(0, totalPurchaseValueInr - totalPaidInr);
    const totalCustomsDutyPaidInr = ships.reduce((sum, s) => sum + (s.customsDutyAmountInr || 0), 0);
    const totalLandedCostInr = lcs.reduce((sum, l) => sum + (l.totalActualLandedCostInr || 0), 0);
    const averageLandedCostVariancePct = lcs.length > 0 ? Number((lcs.reduce((sum, l) => sum + l.variancePercentage, 0) / lcs.length).toFixed(2)) : 0;

    return {
      totalOrders,
      pendingApprovalOrders,
      activeImportShipments,
      customsClearedShipments,
      pendingGrnCount,
      pendingRequisitions,
      totalPurchaseValueInr,
      totalImportValueInr,
      totalDomesticValueInr,
      totalPaidInr,
      totalOutstandingInr,
      totalCustomsDutyPaidInr,
      totalLandedCostInr,
      averageLandedCostVariancePct
    };
  }
}

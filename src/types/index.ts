export type UserRole = 
  | 'admin' 
  | 'superadmin'
  | 'manager' 
  | 'sales' 
  | 'purchase' 
  | 'accounts' 
  | 'inventory'
  | 'distributor'
  | 'customer';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  partyId?: string; // Linked customer or distributor Party ID
  partyName?: string; // Linked customer or distributor Company Name
  distributorTier?: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'GOLD' | 'PLATINUM';
  customDiscountPct?: number; // Special distributor/customer default discount %
  assignedPermissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
}

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export interface Party {
  id: string;
  partyType: PartyType;
  name: string; // Contact Person / Party Name
  companyName: string;
  contactPerson?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  paymentTerms: string; // e.g. "Net 30 Days", "Cash on Delivery", "15 Days"
  openingBalance: number;
  balanceType: 'RECEIVABLE' | 'PAYABLE';
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  outstandingBalance: number; // Calculated net balance
  country?: string;
  currency?: string;
  supplierType?: 'DOMESTIC_MILL' | 'INTERNATIONAL_MILL' | 'IMPORTER_TRADER' | 'CONVERTER';
  portOfLoading?: string;
  incoterms?: string;
  accountNumber?: string;
  ifscOrSwift?: string;
  leadTimeDays?: number;
  paperGradesSupplied?: string[];
  certifications?: string[];
  createdAt: string;
  updatedAt?: string;
}

// Backward compatibility interfaces
export type Customer = Party;
export type Supplier = Party;

export type PaperCategory = 
  | 'Kraft Paper' 
  | 'Art Paper / C2S' 
  | 'Duplex Board' 
  | 'Maplitho Paper' 
  | 'Newsprint' 
  | 'Copier Paper' 
  | 'Specialty Paper'
  | 'Chromic Paper'
  | 'Thermal Paper'
  | 'SBS / FBB Board'
  | 'Grey Board'
  | 'Packaging Paper'
  | 'Release / Sticker Paper'
  | 'Tissue / Butter Paper'
  | string;

export interface PaperCategoryDefinition {
  id: string;
  name: string;
  description?: string;
  defaultHsnCode: string;
  defaultGstRate: number;
  standardGsmRange?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface PaperSizePreset {
  id: string;
  name: string; // e.g. "Double Demy", "Crown", "A4"
  width: number; // in inches
  length: number; // in inches
  isStandard?: boolean;
}

export type ProductUnit = 'Ream' | 'Ton' | 'Kg' | 'Packet' | 'Roll' | 'Sheet' | 'Bundle' | 'Box';

export interface Warehouse {
  id: string;
  code: string;
  name: string; // e.g., "Bhiwandi Central Godown"
  location: string;
  city: string;
  state: string;
  isDefault?: boolean;
  capacityTon?: number;
  managerName?: string;
  contactPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number; // physicalStock - reservedStock
  rackLocation?: string;
  lastUpdated?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string; // SKU / Item Code
  category: PaperCategory;
  paperType?: string; // Kraft, Art, Duplex, etc.
  brand: string; // ITC, Century, JK Paper, BILT, Trident, West Coast, etc.
  millBrand?: string;
  gsm: number; // e.g., 58, 70, 80, 100, 120, 150, 200, 250, 300
  sizeName?: string; // e.g., "Double Demy", "Double Crown", "Crown", "A4", "Custom"
  sizeInches: string; // e.g., "23x36", "25x36", "20x30", "A4", "A3", "Custom"
  length?: number;
  width?: number;
  unit: ProductUnit;
  reamWeightKg?: number; // Calculated ream weight in kg
  purchaseRate: number;
  saleRate: number;
  ratePerUnit?: number; // Legacy alias
  openingStock: number;
  currentStock: number; // Physical stock alias
  physicalStock?: number;
  reservedStock?: number;
  availableStock?: number; // physicalStock - reservedStock
  warehouseStocks?: WarehouseStock[];
  totalPurchasedStock?: number;
  totalSoldStock?: number;
  totalAdjustedStock?: number;
  minStockLevel: number;
  hsnCode: string;
  gstRate: number; // 5, 12, 18
  warehouse: string; // Main Godown, Warehouse A, Unit 2, etc.
  rackLocation?: string;
  batchLotNo?: string;
  packagingDetails?: string; // Ream/Packet/Bundle/Roll specific details
  notes?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
}

export type StockMovementType = 
  | 'OPENING_STOCK'
  | 'STOCK_IN' 
  | 'STOCK_OUT' 
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_DEDUCT'
  | 'ADJUSTMENT' // Legacy alias
  | 'TRANSFER'   // Legacy alias
  | 'RESERVE'
  | 'UNRESERVE'
  | 'DISPATCH';

export type StockReferenceDocType = 
  | 'PURCHASE_RECEIPT'
  | 'PURCHASE_GRN'
  | 'PURCHASE_RETURN_DEBIT_NOTE'
  | 'LANDED_COST_REVALUATION'
  | 'SALES_INVOICE'
  | 'DELIVERY_CHALLAN'
  | 'WAREHOUSE_TRANSFER'
  | 'ADJUSTMENT_VOUCHER'
  | 'OPENING_BALANCE'
  | 'SALES_RESERVATION'
  | 'MANUAL_ENTRY'
  | 'MANUAL_ADJUSTMENT'
  | 'SALES_DISPATCH';

export interface StockMovement {
  id: string;
  movementNo?: string; // e.g., "STK-2026-0042"
  productId: string;
  productName: string;
  productCode?: string;
  category?: PaperCategory;
  gsm?: number;
  sizeInches?: string;
  type: StockMovementType;
  quantity: number;
  unit: ProductUnit;
  stockBefore?: number;
  stockAfter?: number;
  availableBefore?: number;
  availableAfter?: number;
  warehouseId?: string;
  warehouseName?: string;
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  referenceDocType?: StockReferenceDocType;
  referenceNo?: string;
  reasonCode?: string;
  reason: string; // Remarks / details
  performedBy: string;
  performedByRole?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  date: string;
  batchLotNo?: string;
  batchNumber?: string;
  unitRate?: number;
  totalValue?: number;
}

export interface StockTransfer {
  id: string;
  transferNo: string; // e.g., "TRF-2026-001"
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: ProductUnit;
  referenceDocNo: string;
  reason: string;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'CANCELLED';
  transporterName?: string;
  vehicleNo?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string; // e.g., "ADJ-2026-001"
  date: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productCode: string;
  adjustmentType: 'ADD' | 'DEDUCT';
  quantity: number;
  unit: ProductUnit;
  reasonCode: 'CYCLE_COUNT_SURPLUS' | 'CYCLE_COUNT_DEFICIT' | 'DAMAGED_PAPER' | 'SAMPLE_ISSUE' | 'MOISTURE_WEIGHT_DIFF' | 'CALIBRATION' | 'OTHER';
  referenceDocNo: string;
  remarks: string;
  physicalCountedQty?: number;
  systemQtyBefore?: number;
  systemQtyAfter?: number;
  performedBy: string;
  createdAt: string;
}

export interface StockReservation {
  id: string;
  reservationNo: string; // e.g., "RES-2026-001"
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unit: ProductUnit;
  salesOrderRef?: string;
  customerName?: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
  reservedBy: string;
  createdAt: string;
}

export interface InventorySummary {
  totalValuation: number;
  totalPhysicalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalReams: number;
  totalTons: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehousesCount: number;
  recentMovementsCount?: number;
  warehouseSummaries: {
    warehouseId: string;
    warehouseCode?: string;
    warehouseName: string;
    city?: string;
    capacityTon?: number;
    physicalStock: number;
    reservedStock: number;
    availableStock: number;
    valuation: number;
    totalValuation?: number;
    itemCount: number;
    occupancyPercent?: number;
  }[];
}

export interface Transporter {
  id: string;
  name: string; // Transporter Name
  companyName: string;
  contactPerson?: string;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  transporterId: string; // Govt Transporter ID / GST ID
  vehicleNumber?: string;
  freightTerms?: string;
  bankDetails?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type FreightRateType = 'PER_MT' | 'PER_KG' | 'FIXED_DELIVERY' | 'PER_PACKAGE';
export type GtaGstScheme = 'RCM_5_PERCENT' | 'FORWARD_12_PERCENT' | 'EXEMPT_NIL' | 'EXEMPT';
export type FreightPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type FreightDeliveryStatus = 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'POD_RECEIVED';
export type FreightPaidBy = 'BUYER' | 'SELLER' | 'SELF' | 'SUPPLIER' | 'SELF_ADVANCE';

export interface FreightRecord {
  id: string;
  billNo?: string; // e.g. "FB-2026-0042"
  freightType: 'INWARD' | 'OUTWARD' | 'TRANSFER';
  transporterId?: string;
  transporterName: string;
  transporterGstin?: string;
  transporterPhone?: string;
  invoiceNo?: string;
  purchaseNo?: string;
  deliveryChallanNo?: string;
  salesOrderNo?: string;
  
  // LR / GR Details
  lrGrNo: string; // LR/GR Number
  lrGrDate?: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  ewayBillNo?: string;
  
  // Route / Locations
  consignorName?: string; // Origin / Mill / Godown
  consignorCity?: string;
  consigneeName?: string; // Destination / Customer / Site
  consigneeCity?: string;
  cargoDescription?: string; // e.g. "120 GSM Virgin Kraft Paper - 250 Reams"

  // Quantity & Cargo specs
  weightMt?: number; // Weight in Metric Tons
  weightKg?: number; // Weight in Kilograms
  packagesCount?: number; // Number of Reams, Rolls, Bundles
  packageType?: 'Reams' | 'Rolls' | 'Bundles' | 'Pallets' | 'Boxes' | 'Loose Sheets' | string;

  // Rate & Charging Models
  rateType?: FreightRateType;
  ratePerMt?: number; // Rate per MT (₹/MT)
  ratePerKg?: number; // Rate per Kg (₹/Kg)
  fixedTripRate?: number; // Fixed Rate of Delivery (₹)
  ratePerPackage?: number; // Rate per Ream/Bundle (₹)
  baseFreightAmount?: number; // Base freight charge

  // Additional Charges & Accessorials
  loadingCharges?: number; // Hamali at source
  unloadingCharges?: number; // Hamali at destination
  tollCharges?: number; // Toll tax / border entry
  detentionCharges?: number; // Halting charges
  doorDeliveryCharge?: number; // Multi-drop / direct delivery charge
  insuranceCharges?: number; // Transit insurance
  otherCharges?: number;

  // GST & Reverse Charge (GTA)
  gtaGstScheme?: GtaGstScheme;
  taxableAmount?: number;
  gstRate?: number; // 0, 5, 12
  gstAmount?: number;
  isRcmApplicable?: boolean; // Under RCM 5% paid by recipient

  // Totals & Settlement
  freightAmount: number; // Gross Freight Amount
  paidAmount: number;
  dueAmount: number;
  paidBy: 'BUYER' | 'SELLER' | 'SELF' | 'SUPPLIER' | 'SELF_ADVANCE';
  advancePaidToDriver?: number;
  paymentDate?: string;
  paymentMode?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'UPI' | 'FASTAG_DIESEL' | 'CREDIT_LEDGER' | string;
  paymentRefNo?: string; // UTR or Cheque No
  paymentStatus: FreightPaymentStatus;
  deliveryStatus?: FreightDeliveryStatus;
  podDocumentNo?: string;
  podReceivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  code?: string;
  category: PaperCategory;
  paperType?: string;
  brand?: string;
  gsm: number;
  sizeInches: string;
  quantity: number;
  quantityKgs?: number;
  unit: ProductUnit;
  rate: number; // In selected currency or INR
  unitPriceForeign?: number;
  unitPriceInr?: number;
  discountPct: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  totalAmountForeign?: number;
  totalAmountInr?: number;
  receivedQty?: number;
  pendingQty?: number;
  damagedQty?: number;
  batchLotNo?: string;
  containerNo?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  amount?: number; // Legacy
}

export type PurchaseOrderStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PARTIALLY_RECEIVED' 
  | 'RECEIVED' 
  | 'CANCELLED' 
  | 'CLOSED'
  | 'ACTIVE';

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string; // 'COMMERCIAL_INVOICE' | 'PACKING_LIST' | 'BILL_OF_LADING' | 'CERTIFICATE_OF_ORIGIN' | 'INSURANCE' | 'CUSTOMS_BOE' | 'DUTY_CHALLAN' | 'DELIVERY_ORDER' | 'SUPPLIER_INVOICE' | 'OTHER'
  fileUrl?: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseNo: string; // e.g. "ABPPL/PO/25-26/0012"
  poNo?: string;
  supplierId: string;
  supplierName: string;
  supplierCountry?: string;
  isImport?: boolean;
  currency?: string; // 'INR' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'AED'
  exchangeRate?: number; // e.g. 86.50 for USD
  requisitionId?: string;
  requisitionNo?: string;
  warehouseId?: string;
  warehouseName?: string;
  date: string;
  poDate?: string;
  dueDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  paymentTerms: string; // e.g. "Net 30 Days", "LC 60 Days", "Advance 20% + Bal on BL"
  incoterms?: 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DDP' | 'FOR';
  originPort?: string;
  destinationPort?: string;
  
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string;
  supplierInvoiceAmount?: number;
  
  // Transport Details
  transporterId?: string;
  transporterName?: string;
  transporterGovtId?: string;
  vehicleNumber?: string;
  lrGrNo?: string;
  lrGrDate?: string;
  freightAmount: number;
  freightPaidBy?: 'SUPPLIER' | 'BUYER' | 'SELF';
  loadingCharges?: number;
  unloadingCharges?: number;
  otherTransportCharges?: number;

  items: PurchaseItem[];
  subtotal: number;
  subtotalForeign?: number;
  discountTotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  grandTotalForeign?: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'ADVANCE_PAID' | 'PARTIAL' | 'PAID';
  status?: PurchaseOrderStatus;
  
  // Approval
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Receiving & GRN
  totalReceivedQty?: number;
  totalPendingQty?: number;
  grnIds?: string[];
  grnNos?: string[];
  shipmentIds?: string[];
  shipmentNos?: string[];
  documents?: DocumentAttachment[];

  notes?: string;
  termsConditions?: string;
  createdAt: string;
  updatedAt?: string;
}

// Purchase Requisition
export interface PurchaseRequisitionItem {
  productId?: string;
  productName: string;
  brand?: string;
  gsm: number;
  sizeInches: string;
  requiredQuantity: number;
  unit: ProductUnit;
  targetRate?: number;
  estimatedTotal?: number;
  purpose?: string;
}

export interface PurchaseRequisition {
  id: string;
  reqNo: string; // e.g. "ABPPL/PR/2026/001"
  reqDate: string;
  requiredByDate: string;
  requestedBy: string;
  requestedByRole: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  warehouseId?: string;
  warehouseName?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  convertedPoId?: string;
  convertedPoNo?: string;
  purpose: string;
  items: PurchaseRequisitionItem[];
  estimatedTotalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Supplier Quotation Comparison
export interface SupplierQuoteItem {
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  currency: string;
  exchangeRate: number;
  unitRateForeign: number;
  unitRateInr: number;
  freightInr: number;
  deliveryDays: number;
  paymentTerms: string;
  totalInr: number;
  isSelected?: boolean;
  remarks?: string;
  // Aliases
  moq?: number;
  validityDate?: string;
  incoterms?: string;
  quoteDate?: string;
  qualityRating?: number;
}
export type SupplierQuoteEntry = SupplierQuoteItem;

export interface SupplierQuotationComparison {
  id: string;
  comparisonNo: string; // e.g. "ABPPL/RFQ/2026/001"
  requisitionId?: string;
  requisitionNo?: string;
  date: string;
  productName: string;
  gsm: number;
  sizeInches: string;
  requiredQuantity: number;
  unit: ProductUnit;
  quotes: SupplierQuoteItem[];
  selectedSupplierId?: string;
  selectedSupplierName?: string;
  decisionNotes?: string;
  status: 'DRAFT' | 'OPEN' | 'EVALUATED' | 'AWARDED' | 'CLOSED';
  evaluatedBy?: string;
  evaluatedAt?: string;
  createdAt: string;
  // Aliases
  rfqNumber?: string;
  requiredByDate?: string;
  targetPriceInr?: number;
  awardedDate?: string;
  awardedReason?: string;
}
export type SupplierQuotation = SupplierQuotationComparison;

// Goods Receipt Note (GRN)
export interface GrnItem {
  productId: string;
  productName: string;
  code?: string;
  brand?: string;
  category?: PaperCategory | string;
  gsm: number;
  sizeInches: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  damagedQty: number;
  unit: ProductUnit;
  rate: number;
  rateInr: number;
  batchLotNo?: string;
  containerNo?: string;
  hsCode?: string;
  remarks?: string;
  
  // Extended QC & Warehouse Aliases
  orderedQuantity?: number;
  receivedQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  damagedQuantity?: number;
  unitRateInr?: number;
  totalValueInr?: number;
  batchLotNumber?: string;
  storageBinLocation?: string;
  inspectedMoisturePercent?: number;
  measuredGsm?: number;
  burstFactor?: number;
  qcStatus?: 'ACCEPTED' | 'REJECTED' | 'CONDITIONALLY_ACCEPTED' | string;
}
export type GoodsReceiptItem = GrnItem;

export interface GoodsReceiptNote {
  id: string;
  grnNo: string; // e.g. "ABPPL/GRN/25-26/0045"
  grnDate: string;
  poId: string;
  poNo: string;
  shipmentId?: string;
  shipmentNo?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  
  challanNo?: string;
  challanDate?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  vehicleNumber?: string;
  transporterName?: string;
  lrGrNo?: string;
  containerNo?: string;
  sealNo?: string;
  
  // Extended aliases
  poNumber?: string;
  supplierChallanNo?: string;
  supplierInvoiceNo?: string;
  gateEntryNo?: string;
  gateEntryDate?: string;
  inspectorName?: string;
  receivedBy: string;
  inspectedBy?: string;
  qcStatus: 'PASSED' | 'FAILED' | 'CONDITIONALLY_ACCEPTED';
  qcRemarks?: string;
  
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';
  confirmedBy?: string;
  confirmedAt?: string;
  stockUpdated: boolean;
  
  items: GrnItem[];
  totalOrderedQty: number;
  totalReceivedQty: number;
  totalAcceptedQty: number;
  totalRejectedQty: number;
  totalDamagedQty: number;
  totalWeightKgs?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// 3-Way Matching
export interface ThreeWayMatch {
  id: string;
  matchNo: string; // e.g. "ABPPL/3WM/2026/001"
  date: string;
  poId: string;
  poNo: string;
  grnId: string;
  grnNo: string;
  supplierInvoiceNo: string;
  supplierInvoiceDate: string;
  supplierId: string;
  supplierName: string;
  
  poTotalAmount: number;
  grnAcceptedValue: number;
  invoiceTotalAmount: number;
  
  quantityVariance: number; // difference in qty
  priceVariance: number; // difference in rate
  taxVariance: number;
  totalVariance: number;
  
  matchStatus: 'MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE' | 'TAX_VARIANCE' | 'UNMATCHED' | 'APPROVED_EXCEPTION' | 'EXCEPTION_VARIANCE' | 'APPROVED_OVERRIDE';
  varianceReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  payableAmount: number;
  paymentScheduledDate?: string;
  createdAt: string;
}

// Purchase Return / Debit Note
export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  gsm: number;
  sizeInches: string;
  returnQty: number;
  unit: ProductUnit;
  unitRate: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  batchLotNo?: string;
  reason: string;
}

export interface PurchaseReturn {
  id: string;
  returnNo: string; // e.g. "ABPPL/PRN/25-26/0009"
  debitNoteNo: string; // e.g. "ABPPL/DN/25-26/0009"
  returnDate: string;
  poId?: string;
  poNo?: string;
  grnId?: string;
  grnNo?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  reasonCategory: 'DAMAGED_PAPER' | 'QUALITY_REJECTED' | 'WRONG_GSM_SIZE' | 'MOISTURE_DEFECT' | 'EXCESS_SUPPLY';
  reasonDetails: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'APPROVED' | 'DISPATCHED_TO_SUPPLIER' | 'CREDIT_NOTE_RECEIVED' | 'CANCELLED';
  transporterName?: string;
  vehicleNo?: string;
  lrNo?: string;
  supplierCreditNoteNo?: string;
  supplierCreditNoteDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  stockAdjusted: boolean;
  notes?: string;
  createdAt: string;
}

// Import Shipment Management
export type ImportShipmentStatus = 
  | 'PLANNED' 
  | 'BOOKED' 
  | 'IN_TRANSIT' 
  | 'ARRIVED_AT_PORT' 
  | 'UNDER_CUSTOMS' 
  | 'CUSTOMS_CLEARED' 
  | 'DELIVERED_TO_WAREHOUSE'
  | 'PARTIALLY_RECEIVED' 
  | 'FULLY_RECEIVED' 
  | 'CLOSED' 
  | 'CANCELLED';

export interface ShipmentTimelineEntry {
  id: string;
  status: ImportShipmentStatus | string;
  title: string;
  description: string;
  location?: string;
  timestamp: string;
  recordedBy: string;
}
export type ShipmentTimelineEvent = ShipmentTimelineEntry;
export type PurchaseAuditLog = AuditLog;

export interface ImportShipment {
  id: string;
  shipmentNo: string; // e.g. "ABPPL/IMP/2026/001"
  poIds: string[];
  poNos: string[];
  supplierId: string;
  supplierName: string;
  originCountry: string; // e.g. "Finland", "Sweden", "Indonesia", "China", "Germany", "Canada"
  originPort: string; // e.g. "Helsinki", "Shanghai", "Jakarta", "Gothenburg"
  destinationPort: string; // e.g. "Nhava Sheva (JNPT), Mumbai", "Mundra", "Chennai"
  warehouseId: string;
  warehouseName: string;
  
  shippingLine: string; // e.g. "Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE"
  freightForwarder: string; // e.g. "Kuehne+Nagel", "DHL Global Forwarding", "DB Schenker"
  clearingAgent: string; // Custom House Agent (CHA)
  transporterName?: string;
  
  containerNumber: string; // e.g. "MSKU-9876543"
  containerType: '20FT_STANDARD' | '40FT_STANDARD' | '40FT_HIGH_CUBE' | 'LCL_BREAKBULK' | 'BULK_VESSEL';
  sealNumber: string; // e.g. "SL-445892"
  blAwbNumber: string; // Bill of Lading / Airway Bill No
  blDate?: string;
  
  commercialInvoiceNumber: string;
  commercialInvoiceDate?: string;
  commercialInvoiceAmountForeign: number;
  commercialInvoiceCurrency: string; // 'USD' | 'EUR' | 'GBP' etc.
  exchangeRate: number;
  packingListNumber?: string;
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  
  // Key Milestone Dates
  etd: string; // Estimated Time of Departure
  eta: string; // Estimated Time of Arrival
  actualArrivalDate?: string;
  customsClearanceDate?: string;
  warehouseReceivingDate?: string;
  
  status: ImportShipmentStatus;
  billOfEntryNo?: string;
  billOfEntryDate?: string;
  dutyChallanNo?: string;
  customsDutyAmountInr?: number;
  
  totalWeightKg: number;
  totalWeightMt: number;
  totalPackages: number;
  packageType: 'Reams' | 'Wooden Pallets' | 'Rolls / Reels' | 'Bundles' | 'Cartons';
  
  documents: DocumentAttachment[];
  timeline: ShipmentTimelineEntry[];
  
  landedCostId?: string;
  landedCostStatus: 'NOT_CALCULATED' | 'ESTIMATED' | 'ACTUAL_ALLOCATED';
  finalLandedCostInr?: number;
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Landed Cost Calculation & Allocation
export type LandedCostAllocationMethod = 'BY_VALUE' | 'BY_QUANTITY' | 'BY_WEIGHT' | 'BY_VOLUME' | 'MANUAL';

export interface LandedCostItem {
  productId: string;
  productName: string;
  brand?: string;
  gsm: number;
  sizeInches: string;
  hsCode: string;
  countryOfOrigin: string;
  quantity: number;
  unit: ProductUnit;
  weightKg: number;
  weightMt: number;
  volumeCbm?: number;
  
  fobUnitForeign: number;
  fobTotalForeign: number;
  fobTotalInr: number;
  
  allocatedFreightInr: number;
  allocatedInsuranceInr: number;
  cifTotalInr: number;
  cifUnitInr: number;
  
  allocatedCustomsDutyInr: number;
  allocatedSwsInr: number;
  allocatedIgstInr: number;
  allocatedPortHandlingInr: number;
  allocatedChaFeesInr: number;
  allocatedStorageDemurrageInr: number;
  allocatedBankChargesInr: number;
  allocatedLocalTransportInr: number;
  allocatedOtherChargesInr: number;
  
  totalAdditionalChargesInr: number;
  finalLandedCostTotalInr: number;
  finalLandedCostPerUnitInr: number; // Landed cost per Ream
  finalLandedCostPerKgInr: number; // Landed cost per Kg
  
  currentInventoryCostRate?: number;
  suggestedMarginPct: number; // e.g. 12%
  suggestedSellingPriceInr: number; // Landed cost + Margin
  manualAllocationPct?: number;
}

export interface LandedCostAuditEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  action: string;
  previousLandedCostTotal?: number;
  newLandedCostTotal: number;
  varianceNotes?: string;
}

export interface LandedCostCalculation {
  id: string;
  calculationNo: string; // e.g. "ABPPL/LC/2026/001"
  shipmentId: string;
  shipmentNo: string;
  poIds: string[];
  poNos: string[];
  calculationDate: string;
  currency: string;
  exchangeRate: number; // Foreign currency to INR
  allocationMethod: LandedCostAllocationMethod;
  
  // Cost Component Breakdown (Estimated vs Actual)
  fobProductCostForeign: number;
  fobProductCostInr: number;
  
  estimatedOceanAirFreightInr: number;
  actualOceanAirFreightInr: number;
  
  estimatedMarineInsuranceInr: number;
  actualMarineInsuranceInr: number;
  
  cifValueInr: number;
  
  estimatedCustomsDutyInr: number; // BCD
  actualCustomsDutyInr: number;
  
  estimatedSwsInr: number; // Social Welfare Surcharge (10% of BCD)
  actualSwsInr: number;
  
  estimatedIgstInr: number; // IGST on import
  actualIgstInr: number;
  
  estimatedPortHandlingInr: number; // Terminal Handling Charges (THC)
  actualPortHandlingInr: number;
  
  estimatedChaFeesInr: number; // Custom House Agent
  actualChaFeesInr: number;
  
  estimatedStorageDemurrageInr: number; // CFS / Demurrage
  actualStorageDemurrageInr: number;
  
  estimatedBankChargesInr: number; // LC / Forex remittance
  actualBankChargesInr: number;
  
  estimatedInspectionFeesInr: number;
  actualInspectionFeesInr: number;
  
  estimatedLocalTransportInr: number; // Port/CFS to Godown
  actualLocalTransportInr: number;
  
  estimatedMiscellaneousInr: number;
  actualMiscellaneousInr: number;
  
  totalEstimatedLandedCostInr: number;
  totalActualLandedCostInr: number;
  varianceAmountInr: number; // Actual - Estimated
  variancePercentage: number;
  
  isActualFinalized: boolean;
  inventoryValuationUpdated: boolean;
  inventoryUpdatedDate?: string;
  
  items: LandedCostItem[];
  formulaBreakdown: string;
  
  calculatedBy: string;
  calculatedAt: string;
  finalizedBy?: string;
  finalizedAt?: string;
  
  auditHistory: LandedCostAuditEntry[];
  notes?: string;
}

// Supplier Payment Record
export interface SupplierPayment {
  id: string;
  paymentNo: string; // e.g. "ABPPL/SPAY/25-26/0015"
  supplierId: string;
  supplierName: string;
  supplierCountry?: string;
  isInternational?: boolean;
  currency: string;
  exchangeRate: number;
  amountForeign?: number;
  amountInr: number;
  paymentDate: string;
  dueDate?: string;
  
  poId?: string;
  poNo?: string;
  shipmentId?: string;
  shipmentNo?: string;
  invoiceNo?: string;
  
  paymentMode: 'BANK_TRANSFER' | 'LC' | 'TT' | 'CHEQUE' | 'UPI' | 'CASH';
  paymentType: 'ADVANCE' | 'PARTIAL' | 'FULL_SETTLEMENT';
  bankName: string;
  referenceNo: string; // UTR / Swift Message No
  swiftBic?: string;
  taxDeductedTds?: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  receiptDocUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}


export interface PartyAddress {
  name: string;
  companyName: string;
  contactPerson?: string;
  address: string;
  city: string;
  state: string;
  stateCode?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  phone: string;
  email?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  code?: string;
  category: PaperCategory;
  paperType?: string;
  brand?: string;
  gsm: number;
  sizeInches: string;
  quantity: number;
  quantityKgs?: number; // Actual weight / quantity in Kgs
  unit: ProductUnit;
  rate: number;
  ratePerKg?: number;
  discountPct: number;
  taxableValue: number;
  gstRate: number; // 5, 12, 18
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  netAmount: number;
  batchLotNo?: string;
  amount?: number; // Legacy alias
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'GENERATED' | 'DISPATCHED' | 'DELIVERED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type SalesOrderStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'STOCK_RESERVED' 
  | 'PROCESSING' 
  | 'PACKED' 
  | 'DISPATCHED' 
  | 'PARTIALLY_DELIVERED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'RETURNED'
  | 'CONFIRMED' 
  | 'PARTIALLY_INVOICED' 
  | 'INVOICED';

export type OrderPaymentStatus = 'UNPAID' | 'ADVANCE_PAID' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'CREDIT_APPROVED';
export type OrderDeliveryStatus = 'PENDING' | 'PACKING' | 'PACKED' | 'READY_FOR_DISPATCH' | 'IN_TRANSIT' | 'DISPATCHED' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'RETURNED';

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  orderNo: string;
  fromStatus?: SalesOrderStatus | string;
  toStatus: SalesOrderStatus | string;
  action: string;
  performedBy: string;
  performedById?: string;
  performedByRole?: string;
  timestamp: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface SalesOrderItem extends InvoiceItem {
  dispatchedQty?: number;
  deliveredQty?: number;
  backOrderQty?: number;
  warehouseId?: string;
  warehouseName?: string;
  availableStock?: number;
  physicalStock?: number;
  reservedStock?: number;
  stockStatus?: 'AVAILABLE' | 'PARTIAL' | 'OUT_OF_STOCK' | 'RESERVED';
}

export interface SalesOrder {
  id: string;
  orderNo: string; // e.g. "ABPPL/SO/25-26/0014"
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryAddress?: string;
  
  // Role & Creator Info
  createdById?: string;
  createdByName?: string;
  createdByRole?: UserRole;

  // Customer & Distributor Info
  customerId: string;
  customerName: string;
  distributorId?: string;
  distributorName?: string;
  customerGstin?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  billTo: PartyAddress;
  shipTo: PartyAddress;

  // References & Terms
  customerPoNumber?: string;
  customerPoDate?: string;
  paymentTerms: string; // e.g. "Net 30 Days", "Net 15 Days", "Immediate / COD"
  deliveryDispatchRef?: string; // e.g. "DC-2026-081"
  dispatchNotes?: string;

  // Logistics & Transporter
  transporterId?: string;
  transporterName?: string;
  transporterGovtId?: string;
  vehicleNumber?: string; // Truck Number
  lrGrNo?: string;
  lrGrDate?: string;
  freightAmount?: number;
  freightPaidBy?: 'BUYER' | 'SELLER' | 'SELF';

  // Items & Calculations
  items: SalesOrderItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  gstTotal: number;
  freightCharges?: number;
  otherCharges?: number;
  roundOff?: number;
  grandTotal: number;

  // Status & Workflow
  status: SalesOrderStatus;
  paymentStatus?: OrderPaymentStatus;
  deliveryStatus?: OrderDeliveryStatus;
  paidAmount?: number;
  balanceDue?: number;

  // Credit Limit Check Results
  creditLimit?: number;
  currentOutstanding?: number;
  creditCheckPassed?: boolean;
  creditLimitExceeded?: boolean;
  creditWarning?: string;

  // Approvals & Workflow Details
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Inventory & Warehouse Reservations
  warehouseId?: string;
  warehouseName?: string;
  stockReserved?: boolean;
  stockReservationId?: string;
  reservedAt?: string;

  // Packing & Dispatch Details
  packedBy?: string;
  packedAt?: string;
  totalPackages?: number;
  packageType?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  deliveryRemarks?: string;

  // Linked Invoices, Challans & Receipts
  invoiceIds?: string[];
  invoiceNos?: string[];
  deliveryChallanIds?: string[];
  deliveryChallanNos?: string[];
  receiptIds?: string[];
  receiptNos?: string[];

  // Activity Timeline
  timeline?: OrderStatusHistoryEntry[];

  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNo: string; // e.g. "ABPPL/DC/25-26/0042"
  packingSlipNo: string; // e.g. "ABPPL/PS/25-26/0042"
  orderId: string;
  orderNo: string;
  invoiceId?: string;
  invoiceNo?: string;
  customerId: string;
  customerName: string;
  distributorId?: string;
  distributorName?: string;
  billTo?: PartyAddress;
  shipTo?: PartyAddress;
  dispatchDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  transporterName: string;
  transporterId?: string;
  vehicleNumber: string;
  lrGrNo: string;
  lrGrDate?: string;
  driverPhone?: string;
  warehouseId: string;
  warehouseName: string;
  totalPackages: number;
  packageType: 'Bundles' | 'Wooden Pallets' | 'Reams' | 'Rolls' | 'Cartons' | 'Mixed Packages';
  totalWeightKgs: number;
  status: 'PREPARED' | 'DISPATCHED' | 'IN_TRANSIT' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'RETURNED';
  items: {
    productId: string;
    productName: string;
    sizeInches: string;
    gsm: number;
    orderedQty: number;
    dispatchedQty: number;
    deliveredQty?: number;
    backOrderQty?: number;
    unit: string;
    weightKg: number;
  }[];
  deliveryRemarks?: string;
  receivedBy?: string;
  receiverSignatureNote?: string;
  deliveredAt?: string;
  dispatchedBy?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNo: string; // e.g. "ABPPL/REC/25-26/0089"
  paymentId?: string;
  orderId?: string;
  orderNo?: string;
  invoiceId?: string;
  invoiceNo?: string;
  customerId: string;
  customerName: string;
  distributorId?: string;
  distributorName?: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'ADVANCE' | 'PARTIAL' | 'FULL' | 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CREDIT';
  referenceNo?: string; // UTR / Cheque / Transaction Ref
  bankName?: string;
  status: 'SUCCESS' | 'PENDING' | 'REVERSED';
  notes?: string;
  collectedBy?: string;
  createdAt: string;
}

export interface CustomerPriceList {
  id: string;
  partyId: string; // Customer or Distributor ID
  partyName: string;
  partyType?: 'CUSTOMER' | 'DISTRIBUTOR' | 'BOTH';
  isDistributorTier?: boolean;
  effectiveDate?: string;
  productId?: string;
  productName?: string;
  category?: PaperCategory;
  gsm?: number;
  sizeInches?: string;
  standardRate?: number;
  specialRate?: number;
  discountPct?: number;
  minOrderQty?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  items?: {
    productName: string;
    gsm: number;
    customRate: number;
    discountPercent: number;
    minOrderQuantity: number;
  }[];
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 
    | 'ORDER_CREATED' 
    | 'ORDER_UPDATED'
    | 'ORDER_SAVED_DRAFT'
    | 'ORDER_DRAFTED'
    | 'ORDER_SUBMITTED' 
    | 'ORDER_APPROVED' 
    | 'ORDER_REJECTED' 
    | 'ORDER_STOCK_RESERVED' 
    | 'ORDER_PACKED' 
    | 'ORDER_DISPATCHED' 
    | 'ORDER_DELIVERED' 
    | 'ORDER_CANCELLED' 
    | 'INVOICE_GENERATED' 
    | 'PAYMENT_RECORDED' 
    | 'PAYMENT_RECEIVED'
    | 'RECEIPT_GENERATED'
    | 'DELIVERY_CHALLAN_CREATED'
    | 'PRICE_LIST_UPDATED' 
    | 'USER_CREATED'
    | 'USER_ROLE_CHANGED' 
    | 'USER_STATUS_CHANGED'
    | 'PERMISSION_ASSIGNED'
    | 'INVENTORY_ADJUSTED'
    | 'PO_CREATED'
    | 'PO_UPDATED'
    | 'PO_SUBMITTED'
    | 'PO_APPROVED'
    | 'PO_REJECTED'
    | 'PO_CANCELLED'
    | 'REQUISITION_CREATED'
    | 'REQUISITION_UPDATED'
    | 'REQUISITION_APPROVED'
    | 'REQUISITION_REJECTED'
    | 'RFQ_CREATED'
    | 'GRN_CREATED'
    | 'GRN_CONFIRMED'
    | 'GRN_REJECTED'
    | 'PURCHASE_RETURN_CREATED'
    | 'SHIPMENT_CREATED'
    | 'SHIPMENT_UPDATED'
    | 'SHIPMENT_STATUS_CHANGED'
    | 'LANDED_COST_CALCULATED'
    | 'LANDED_COST_FINALIZED'
    | 'SUPPLIER_PAYMENT_RECORDED'
    | 'PURCHASE_ORDER_CREATED'
    | 'PURCHASE_ORDER_UPDATED'
    | 'PURCHASE_ORDER_APPROVED'
    | 'PURCHASE_ORDER_CANCELLED'
    | 'ACTION'
    | string;
  entityType: 'ORDER' | 'INVOICE' | 'PAYMENT' | 'RECEIPT' | 'DELIVERY' | 'PRODUCT' | 'USER' | 'CUSTOMER' | 'PRICE_LIST' | 'PURCHASE_ORDER' | 'REQUISITION' | 'PURCHASE_REQUISITION' | 'RFQ' | 'GRN' | 'PURCHASE_RETURN' | 'SHIPMENT' | 'IMPORT_SHIPMENT' | 'LANDED_COST' | 'SUPPLIER_PAYMENT' | 'SUPPLIER' | 'SYSTEM' | string;
  entityId: string;
  entityNo?: string;
  details?: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
}

export interface PurchaseStats {
  totalPurchaseOrders?: number;
  openPOs?: number;
  approvedPOs?: number;
  receivedPOs?: number;
  shipmentsInTransit?: number;
  customsPendingCount?: number;
  goodsAwaitingReceiptCount?: number;
  totalSupplierPayableInr?: number;
  pendingLandedCostAllocations?: number;
  totalPurchaseValueInr: number;
  totalImportValueInr: number;
  totalOrders?: number;
  pendingApprovalOrders?: number;
  activeImportShipments?: number;
  customsClearedShipments?: number;
  pendingGrnCount?: number;
  pendingRequisitions?: number;
  totalDomesticValueInr?: number;
  totalPaidInr?: number;
  totalOutstandingInr?: number;
  totalCustomsDutyPaidInr?: number;
  totalLandedCostInr?: number;
  averageLandedCostVariancePct?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders?: number;
  pendingApproval?: number;
  draftOrders?: number;
  submittedOrders?: number;
  underReviewOrders?: number;
  approvedOrders?: number;
  stockReservedOrders?: number;
  processingOrders?: number;
  packedOrders?: number;
  dispatchedOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalOrderAmount?: number;
  totalOrderValue?: number;
  totalSalesValue?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  totalOutstandingAmount?: number;
  totalStockReservedKgs?: number;
  totalReservedReams?: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: 'INVOICE' | 'QUOTATION';
  quotationStatus?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  invoiceStatus?: InvoiceStatus;
  
  // Linked Sales Order & References
  salesOrderId?: string;
  salesOrderNo?: string;
  orderReference?: string; // Sales Order # or Customer PO
  deliveryDispatchRef?: string; // Delivery / Dispatch Reference (Challan #)
  dispatchDate?: string;
  ewayBillNo?: string;

  // Bill To & Ship To
  customerId: string;
  customerName: string;
  billTo?: PartyAddress;
  shipTo?: PartyAddress;
  customerGstin?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;

  date: string;
  dueDate: string;
  paymentTerms?: string;
  poNumber?: string;
  poDate?: string;

  // Transport details
  transporterId?: string;
  transporterName?: string;
  transporterGovtId?: string;
  vehicleNumber?: string; // Truck Number
  lrGrNo?: string;
  lrGrDate?: string;
  freightAmount?: number;
  freightPaidBy?: 'BUYER' | 'SELLER' | 'SELF';
  deliveryNotes?: string;

  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  freightCharges?: number;
  otherCharges?: number;
  taxableAmount?: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  gstTotal: number;
  roundOff?: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue?: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  status?: 'ACTIVE' | 'CANCELLED';
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  paymentNo: string;
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'FREIGHT';
  partyId: string;
  partyName: string;
  invoiceId?: string;
  purchaseId?: string;
  freightId?: string;
  amount: number;
  paymentDate: string;
  method: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'UPI' | 'OTHER';
  referenceNo?: string;
  remarks?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: string;
  date: string;
  referenceNo: string;
  type: 'OPENING_BALANCE' | 'INVOICE' | 'PURCHASE' | 'PAYMENT_RECEIVED' | 'PAYMENT_MADE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'CANCELLATION';
  description: string;
  debit: number; // Receivable increase or Supplier payment
  credit: number; // Receivable decrease or Purchase bill
  runningBalance: number;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  invoicePrefix: string;
  quotationPrefix: string;
  salesOrderPrefix?: string;
  purchasePrefix: string;
  paymentPrefix: string;
  defaultTerms: string;
}

export interface DueReminder {
  id: string;
  type: 'CUSTOMER_RECEIVABLE' | 'SUPPLIER_PAYABLE';
  partyId: string;
  partyName: string;
  phone: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  daysOverdue: number;
  status: 'DUE_SOON' | 'OVERDUE' | 'DUE_TODAY';
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'Party' | 'Product' | 'Sales Invoice' | 'Purchase Order' | 'Transporter' | 'Payment';
  module: string;
}

export interface DashboardSummary {
  totalCustomersCount: number;
  totalSuppliersCount: number;
  totalPartiesCount: number;
  totalUsersCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  
  todaySales: number;
  todayPurchases: number;
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  
  totalReceivables: number;
  totalPayables: number;
  
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  upcomingDueCount: number;
  upcomingDueAmount: number;
  pendingFreightAmount: number;

  recentInvoices: Invoice[];
  lowStockProducts: Product[];
  monthlySalesData: { month: string; sales: number; purchases: number }[];
}

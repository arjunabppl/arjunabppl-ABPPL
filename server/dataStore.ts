import fs from 'fs';
import path from 'path';
import {
  User, Party, PartyType, Customer, Supplier, Product, StockMovement,
  Transporter, FreightRecord, PurchaseOrder, Invoice, PaymentRecord, LedgerEntry, CompanySettings,
  DueReminder, GlobalSearchResult, DashboardSummary, Warehouse, WarehouseStock,
  StockTransfer, StockAdjustment, StockReservation, InventorySummary, StockMovementType, StockReferenceDocType,
  SalesOrder, SalesOrderStatus, InvoiceStatus, DeliveryChallan, PaymentReceipt,
  OrderStatusHistoryEntry, AuditLog, CustomerPriceList, OrderStats, SalesOrderItem,
  PurchaseRequisition, SupplierQuotationComparison, GoodsReceiptNote, ThreeWayMatch,
  PurchaseReturn, ImportShipment, LandedCostCalculation, SupplierPayment, PurchaseStats,
  PaperCategoryDefinition, PaperSizePreset
} from '../src/types/index.js';
import { StoredUser, hashPassword } from './authUtils.js';
import { PurchaseStore } from './purchaseStore.js';

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'abppl_db.json');

// Initial seed data for ABPPL Paper Wholesaler
const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "ABPPL Paper Wholesalers Pvt Ltd",
  tagline: "Leading Paper Wholesaler, Importer & Converter",
  gstin: "27AABCU9603R1ZM",
  phone: "+91 98200 12345 / 022-23456789",
  email: "sales@abppl.com",
  website: "www.abppl.com",
  address: "Plot 42, Paper Market Yard, Kalbadevi Road",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400002",
  bankName: "HDFC Bank",
  accountName: "ABPPL Paper Wholesalers Pvt Ltd",
  accountNumber: "50200034891234",
  ifscCode: "HDFC0000060",
  branch: "Fort Branch, Mumbai",
  invoicePrefix: "ABPPL/INV/25-26/",
  quotationPrefix: "ABPPL/QTN/25-26/",
  salesOrderPrefix: "ABPPL/SO/25-26/",
  purchasePrefix: "ABPPL/PO/25-26/",
  paymentPrefix: "ABPPL/PAY/",
  defaultTerms: "1. Payment due within 30 days from date of invoice.\n2. Goods once sold will not be taken back unless damaged prior to delivery.\n3. Interest @ 18% p.a. will be charged on overdue payments."
};

const adminCreds = hashPassword('929248');
const managerCreds = hashPassword('mgr123');
const salesCreds = hashPassword('sales123');
const invCreds = hashPassword('inv123');
const accCreds = hashPassword('acc123');
const distCreds = hashPassword('dist123');
const custCreds = hashPassword('cust123');

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'usr-1',
    name: 'Rajesh Kumar (Super Admin)',
    username: 'admin',
    email: 'arjdnk99@gmail.com',
    role: 'admin',
    status: 'ACTIVE',
    passwordHash: adminCreds.hash,
    passwordSalt: adminCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-5',
    name: 'Vikas Mehta (Operations Manager)',
    username: 'manager',
    email: 'manager@abppl.com',
    role: 'manager',
    status: 'ACTIVE',
    passwordHash: managerCreds.hash,
    passwordSalt: managerCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-2',
    name: 'Sanjay Sharma (Sales Lead)',
    username: 'sales',
    email: 'sales@abppl.com',
    role: 'sales',
    status: 'ACTIVE',
    passwordHash: salesCreds.hash,
    passwordSalt: salesCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-3',
    name: 'Amit Patel (Warehouse Mgr)',
    username: 'inventory',
    email: 'inventory@abppl.com',
    role: 'inventory',
    status: 'ACTIVE',
    passwordHash: invCreds.hash,
    passwordSalt: invCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-4',
    name: 'Priya Verma (Accounts Head)',
    username: 'accounts',
    email: 'accounts@abppl.com',
    role: 'accounts',
    status: 'ACTIVE',
    passwordHash: accCreds.hash,
    passwordSalt: accCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-6',
    name: 'Vikram Joshi (National Box & Packaging)',
    username: 'distributor',
    email: 'v.joshi@natbox.com',
    role: 'distributor',
    status: 'ACTIVE',
    partyId: 'cust-103',
    partyName: 'National Box & Packaging',
    distributorTier: 'TIER_1',
    customDiscountPct: 5,
    passwordHash: distCreds.hash,
    passwordSalt: distCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-7',
    name: 'Anil Gupta (Apex Printpack Solutions)',
    username: 'customer',
    email: 'anil@apexprintpack.com',
    role: 'customer',
    status: 'ACTIVE',
    partyId: 'cust-101',
    partyName: 'Apex Printpack Solutions',
    passwordHash: custCreds.hash,
    passwordSalt: custCreds.salt,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

const DEFAULT_PARTIES: Party[] = [
  {
    id: 'cust-101',
    partyType: 'CUSTOMER',
    name: 'Anil Gupta',
    companyName: 'Apex Printpack Solutions',
    contactPerson: 'Anil Gupta',
    gstin: '27AABCA1234F1Z1',
    pan: 'AABCA1234F',
    phone: '+91 98210 44332',
    altPhone: '+91 22 28711223',
    email: 'anil@apexprintpack.com',
    address: 'Industrial Estate, Unit 12, Goregaon East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400063',
    creditLimit: 1500000,
    openingBalance: 0,
    balanceType: 'RECEIVABLE',
    paymentTerms: 'Net 30 Days',
    bankName: 'HDFC Bank',
    bankAccountNo: '5010022334455',
    bankIfsc: 'HDFC0000123',
    bankBranch: 'Goregaon East',
    outstandingBalance: 320432,
    status: 'ACTIVE',
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'cust-102',
    partyType: 'CUSTOMER',
    name: 'Mahesh Shah',
    companyName: 'Standard Offset Printers',
    contactPerson: 'Mahesh Shah',
    gstin: '27AABCS5678G2Z3',
    pan: 'AABCS5678G',
    phone: '+91 98199 88776',
    email: 'info@standardoffset.in',
    address: 'Gala 5, Commercial Complex, Bhiwandi',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '421302',
    creditLimit: 800000,
    openingBalance: 0,
    balanceType: 'RECEIVABLE',
    paymentTerms: 'Net 15 Days',
    outstandingBalance: 0,
    status: 'ACTIVE',
    createdAt: '2025-01-15T11:30:00Z'
  },
  {
    id: 'cust-103',
    partyType: 'CUSTOMER',
    name: 'Vikram Joshi',
    companyName: 'National Box & Packaging',
    contactPerson: 'Vikram Joshi',
    gstin: '27AABCN9988H1Z5',
    phone: '+91 98331 22110',
    email: 'v.joshi@natbox.com',
    address: 'Plot 88, MIDC Tarapur',
    city: 'Palghar',
    state: 'Maharashtra',
    pincode: '401506',
    creditLimit: 2500000,
    openingBalance: 100000,
    balanceType: 'RECEIVABLE',
    paymentTerms: 'Net 30 Days',
    outstandingBalance: 610000,
    status: 'ACTIVE',
    createdAt: '2025-02-01T09:15:00Z'
  },
  {
    id: 'supp-201',
    partyType: 'SUPPLIER',
    name: 'Ketan Patel',
    companyName: 'Century Pulp & Paper',
    contactPerson: 'Ketan Patel',
    gstin: '05AABCC0123E1ZP',
    phone: '+91 5945 223344',
    email: 'orders@centurypaper.in',
    address: 'Lalkua, District Nainital',
    city: 'Lalkua',
    state: 'Uttarakhand',
    pincode: '263145',
    creditLimit: 5000000,
    openingBalance: 0,
    balanceType: 'PAYABLE',
    paymentTerms: 'Net 30 Days',
    outstandingBalance: 1250000,
    status: 'ACTIVE',
    createdAt: '2025-01-05T08:00:00Z'
  },
  {
    id: 'supp-202',
    partyType: 'SUPPLIER',
    name: 'Ramesh Sundaram',
    companyName: 'JK Paper Industries',
    contactPerson: 'Ramesh Sundaram',
    gstin: '21AABCJ4321K1ZM',
    phone: '+91 6856 220011',
    email: 'sales@jkpaper.com',
    address: 'Rayagada Plant, PO Jaykaypur',
    city: 'Rayagada',
    state: 'Odisha',
    pincode: '765017',
    creditLimit: 4000000,
    openingBalance: 0,
    balanceType: 'PAYABLE',
    paymentTerms: 'Net 30 Days',
    outstandingBalance: 840000,
    status: 'ACTIVE',
    createdAt: '2025-01-08T09:00:00Z'
  },
  {
    id: 'supp-203',
    partyType: 'BOTH',
    name: 'Rakesh Aggarwal',
    companyName: 'BILT Paper & Trading Co',
    contactPerson: 'Rakesh Aggarwal',
    gstin: '27AABCB8877L1ZQ',
    phone: '+91 7172 230100',
    email: 'bhiwandi.depot@bilt.com',
    address: 'Ballarpur Depot, Chandrapur',
    city: 'Chandrapur',
    state: 'Maharashtra',
    pincode: '442401',
    creditLimit: 3000000,
    openingBalance: 0,
    balanceType: 'PAYABLE',
    paymentTerms: 'Net 15 Days',
    outstandingBalance: 420000,
    status: 'ACTIVE',
    createdAt: '2025-01-20T10:00:00Z'
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-301',
    name: 'Kraft Paper High BF 120 GSM',
    code: 'KP-120-2336',
    category: 'Kraft Paper',
    paperType: 'Kraft Paper',
    brand: 'ITC Ltd',
    gsm: 120,
    sizeInches: '23x36',
    length: 23,
    width: 36,
    unit: 'Ream',
    reamWeightKg: 16.1,
    purchaseRate: 1250,
    saleRate: 1450,
    ratePerUnit: 1450,
    openingStock: 300,
    currentStock: 350,
    minStockLevel: 50,
    hsnCode: '48041100',
    gstRate: 12,
    warehouse: 'Main Godown (Kalbadevi)',
    rackLocation: 'Rack A-04',
    batchLotNo: 'LOT-2025-08-A',
    packagingDetails: '500 sheets per ream wrapped in polythene kraft',
    status: 'IN_STOCK',
    lastUpdated: '2025-08-01T10:00:00Z'
  },
  {
    id: 'prod-302',
    name: 'Super Gloss Art Paper 300 GSM',
    code: 'AP-300-2536',
    category: 'Art Paper / C2S',
    paperType: 'Art Paper / C2S',
    brand: 'Century Pulp & Paper',
    gsm: 300,
    sizeInches: '25x36',
    length: 25,
    width: 36,
    unit: 'Ream',
    reamWeightKg: 43.5,
    purchaseRate: 4100,
    saleRate: 4800,
    ratePerUnit: 4800,
    openingStock: 100,
    currentStock: 120,
    minStockLevel: 30,
    hsnCode: '48101300',
    gstRate: 12,
    warehouse: 'Bhiwandi Depot',
    rackLocation: 'Bay B-12',
    batchLotNo: 'LOT-2025-07-C',
    packagingDetails: 'Heavy Duty Wooden Pallet Box',
    status: 'IN_STOCK',
    lastUpdated: '2025-08-05T12:00:00Z'
  },
  {
    id: 'prod-303',
    name: 'Duplex Board Grey Back 250 GSM',
    code: 'DB-250-3040',
    category: 'Duplex Board',
    paperType: 'Duplex Board',
    brand: 'West Coast Paper',
    gsm: 250,
    sizeInches: '30x40',
    length: 30,
    width: 40,
    unit: 'Ream',
    reamWeightKg: 48.3,
    purchaseRate: 3400,
    saleRate: 3950,
    ratePerUnit: 3950,
    openingStock: 50,
    currentStock: 15, // LOW STOCK
    minStockLevel: 40,
    hsnCode: '48109200',
    gstRate: 12,
    warehouse: 'Main Godown (Kalbadevi)',
    rackLocation: 'Rack C-01',
    batchLotNo: 'LOT-2025-08-D',
    packagingDetails: 'Wrapped in waterproof plastic sheet',
    status: 'LOW_STOCK',
    lastUpdated: '2025-08-10T15:00:00Z'
  },
  {
    id: 'prod-304',
    name: 'Maplitho High Bright 70 GSM',
    code: 'ML-070-2030',
    category: 'Maplitho Paper',
    paperType: 'Maplitho Paper',
    brand: 'JK Paper Industries',
    gsm: 70,
    sizeInches: '20x30',
    length: 20,
    width: 30,
    unit: 'Ream',
    reamWeightKg: 6.8,
    purchaseRate: 680,
    saleRate: 780,
    ratePerUnit: 780,
    openingStock: 400,
    currentStock: 520,
    minStockLevel: 100,
    hsnCode: '48025590',
    gstRate: 12,
    warehouse: 'Bhiwandi Depot',
    rackLocation: 'Rack D-08',
    batchLotNo: 'LOT-2025-08-M',
    packagingDetails: '500 sheets ream wrapped in blue wrapper',
    status: 'IN_STOCK',
    lastUpdated: '2025-08-11T09:00:00Z'
  },
  {
    id: 'prod-305',
    name: 'Premium Copier Paper A4 80 GSM',
    code: 'CP-080-A4',
    category: 'Copier Paper',
    paperType: 'Copier Paper',
    brand: 'Trident Paper',
    gsm: 80,
    sizeInches: 'A4',
    length: 8.27,
    width: 11.69,
    unit: 'Packet',
    reamWeightKg: 2.5,
    purchaseRate: 200,
    saleRate: 240,
    ratePerUnit: 240,
    openingStock: 100,
    currentStock: 8, // LOW STOCK
    minStockLevel: 50,
    hsnCode: '48025610',
    gstRate: 12,
    warehouse: 'Main Godown (Kalbadevi)',
    rackLocation: 'Rack A-01',
    batchLotNo: 'LOT-2025-08-CP',
    packagingDetails: 'Box containing 10 ream packets',
    status: 'LOW_STOCK',
    lastUpdated: '2025-08-12T08:00:00Z'
  },
  {
    id: 'prod-306',
    name: 'Newsprint Grade A 45 GSM Reel',
    code: 'NP-045-REEL',
    category: 'Newsprint',
    paperType: 'Newsprint',
    brand: 'Century Pulp & Paper',
    gsm: 45,
    sizeInches: '30 inch reel',
    unit: 'Ton',
    reamWeightKg: 0,
    purchaseRate: 51000,
    saleRate: 58000,
    ratePerUnit: 58000,
    openingStock: 20,
    currentStock: 18,
    minStockLevel: 5,
    hsnCode: '48010090',
    gstRate: 12,
    warehouse: 'Bhiwandi Yard',
    rackLocation: 'Reel Yard 02',
    batchLotNo: 'REEL-2025-08',
    packagingDetails: 'Heavy craft paper outer reel wrap',
    status: 'IN_STOCK',
    lastUpdated: '2025-08-08T11:00:00Z'
  }
];

const DEFAULT_TRANSPorters: Transporter[] = [
  {
    id: 'tr-1',
    name: 'Vijay Logistics',
    companyName: 'Vijay Freight Carriers Pvt Ltd',
    contactPerson: 'Vijay Sharma',
    phone: '+91 98200 88776',
    altPhone: '+91 22 23441100',
    address: 'Transport Nagar, Sector 19, Vashi',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    gstin: '27AABCV1234F1Z0',
    transporterId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-9921',
    freightTerms: 'To Pay / Paid',
    bankDetails: 'ICICI Bank, Vashi Branch, A/C: 001105001234',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'tr-2',
    name: 'Bombay Transport Service',
    companyName: 'Bombay Roadways',
    contactPerson: 'Harish Mehta',
    phone: '+91 98211 44556',
    address: 'Goregaon Transport Depot',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27AABCB5566G1Z2',
    transporterId: '27AABCB5566G1Z2',
    vehicleNumber: 'MH-02-EE-4410',
    freightTerms: 'Door Delivery Paid',
    status: 'ACTIVE',
    createdAt: '2025-01-05T00:00:00Z'
  }
];

export const DEFAULT_PAPER_CATEGORIES: PaperCategoryDefinition[] = [
  { id: 'cat-1', name: 'Kraft Paper', description: 'High-strength virgin/recycled paper for packaging, corrugation & bags', defaultHsnCode: '48041100', defaultGstRate: 12, standardGsmRange: '60 - 250 GSM' },
  { id: 'cat-2', name: 'Art Paper / C2S', description: 'Coated two-side glossy/matt paper for magazines, brochures & premium print', defaultHsnCode: '48101300', defaultGstRate: 12, standardGsmRange: '90 - 350 GSM' },
  { id: 'cat-3', name: 'Duplex Board', description: 'Grey back / White back coated carton board for packaging cartons', defaultHsnCode: '48109200', defaultGstRate: 12, standardGsmRange: '200 - 450 GSM' },
  { id: 'cat-4', name: 'Maplitho Paper', description: 'Uncoated woodfree writing and printing paper for books and stationery', defaultHsnCode: '48025590', defaultGstRate: 12, standardGsmRange: '52 - 120 GSM' },
  { id: 'cat-5', name: 'Copier Paper', description: 'Cut-size A4/A3 office multipurpose printing and photocopying paper', defaultHsnCode: '48025610', defaultGstRate: 12, standardGsmRange: '70 - 80 GSM' },
  { id: 'cat-6', name: 'Newsprint', description: 'Lightweight printing paper for newspapers, flyers and publications', defaultHsnCode: '48010090', defaultGstRate: 12, standardGsmRange: '42 - 48 GSM' },
  { id: 'cat-7', name: 'SBS / FBB Board', description: 'Solid Bleached Sulphate / Folding Box Board for pharma and food boxes', defaultHsnCode: '48109200', defaultGstRate: 12, standardGsmRange: '210 - 400 GSM' },
  { id: 'cat-8', name: 'Chromic Paper', description: 'High-gloss one-side coated paper for labels, posters and stickers', defaultHsnCode: '48101400', defaultGstRate: 12, standardGsmRange: '70 - 130 GSM' },
  { id: 'cat-9', name: 'Thermal Paper', description: 'Heat-sensitive coated paper for POS receipt rolls and billing machines', defaultHsnCode: '48119099', defaultGstRate: 12, standardGsmRange: '48 - 75 GSM' },
  { id: 'cat-10', name: 'Specialty Paper', description: 'Textured, metallic, security, parchment and luxury packaging papers', defaultHsnCode: '48025890', defaultGstRate: 18, standardGsmRange: '100 - 350 GSM' },
  { id: 'cat-11', name: 'Grey Board', description: 'Rigid unbleached board for hardbound books, sweet boxes and calendars', defaultHsnCode: '48059300', defaultGstRate: 12, standardGsmRange: '300 - 1200 GSM' },
  { id: 'cat-12', name: 'Release / Sticker Paper', description: 'Siliconised base paper and self-adhesive sheets for sticker labels', defaultHsnCode: '48114100', defaultGstRate: 18, standardGsmRange: '65 - 140 GSM' }
];

export const DEFAULT_PAPER_SIZES: PaperSizePreset[] = [
  { id: 'sz-1', name: 'Double Demy (23" × 36")', width: 23, length: 36, isStandard: true },
  { id: 'sz-2', name: 'Double Crown (20" × 30")', width: 20, length: 30, isStandard: true },
  { id: 'sz-3', name: 'Single Crown (15" × 20")', width: 15, length: 20, isStandard: true },
  { id: 'sz-4', name: 'Quad Crown (30" × 40")', width: 30, length: 40, isStandard: true },
  { id: 'sz-5', name: 'Single Demy (18" × 23")', width: 18, length: 23, isStandard: true },
  { id: 'sz-6', name: 'Quad Demy (36" × 46")', width: 36, length: 46, isStandard: true },
  { id: 'sz-7', name: 'Single Royal (20" × 25")', width: 20, length: 25, isStandard: true },
  { id: 'sz-8', name: 'Double Royal (25" × 40")', width: 25, length: 40, isStandard: true },
  { id: 'sz-9', name: 'Imperial (22" × 30")', width: 22, length: 30, isStandard: true },
  { id: 'sz-10', name: 'Double Imperial (30" × 44")', width: 30, length: 44, isStandard: true },
  { id: 'sz-11', name: 'Packaging Board (24" × 34")', width: 24, length: 34, isStandard: true },
  { id: 'sz-12', name: 'Packaging Board Large (28" × 40")', width: 28, length: 40, isStandard: true },
  { id: 'sz-13', name: 'A4 (8.27" × 11.69")', width: 8.27, length: 11.69, isStandard: true },
  { id: 'sz-14', name: 'A3 (11.69" × 16.54")', width: 11.69, length: 16.54, isStandard: true },
  { id: 'sz-15', name: 'Legal / FS (8.5" × 14")', width: 8.5, length: 14, isStandard: true },
  { id: 'sz-16', name: '12" × 18" (Digital SRA3)', width: 12, length: 18, isStandard: true },
  { id: 'sz-17', name: '13" × 19" (Digital Plus)', width: 13, length: 19, isStandard: true }
];

const DEFAULT_FREIGHTS: FreightRecord[] = [
  {
    id: 'fr-1',
    billNo: 'FB-2526-0042',
    freightType: 'OUTWARD',
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGstin: '27AABCV1234F1Z0',
    transporterPhone: '+91 98200 88776',
    invoiceNo: 'ABPPL/INV/25-26/0142',
    deliveryChallanNo: 'CH-2025-0814',
    lrGrNo: 'VL-9982',
    lrGrDate: '2025-08-01',
    vehicleNumber: 'MH-04-FK-9921',
    driverName: 'Santosh Yadav',
    driverPhone: '+91 97654 32100',
    ewayBillNo: '241088491023',
    consignorName: 'ABPPL Central Godown',
    consignorCity: 'Bhiwandi',
    consigneeName: 'Apex Printpack Solutions',
    consigneeCity: 'Vasai',
    cargoDescription: '120 GSM Kraft Paper & 300 GSM Art Board - 130 Reams',
    weightMt: 5.82,
    weightKg: 5818,
    packagesCount: 130,
    packageType: 'Reams',
    rateType: 'FIXED_DELIVERY',
    fixedTripRate: 3500,
    baseFreightAmount: 3500,
    loadingCharges: 300,
    unloadingCharges: 300,
    tollCharges: 200,
    detentionCharges: 0,
    doorDeliveryCharge: 0,
    insuranceCharges: 0,
    gtaGstScheme: 'RCM_5_PERCENT',
    isRcmApplicable: true,
    gstRate: 5,
    freightAmount: 3500,
    paidAmount: 3500,
    dueAmount: 0,
    paidBy: 'BUYER',
    paymentDate: '2025-08-01',
    paymentMode: 'CASH',
    paymentStatus: 'PAID',
    deliveryStatus: 'DELIVERED',
    notes: 'Direct door delivery paid by customer at destination upon unloading.',
    createdAt: '2025-08-01T10:30:00Z'
  },
  {
    id: 'fr-2',
    billNo: 'FB-2526-0038',
    freightType: 'INWARD',
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGstin: '27AABCV1234F1Z0',
    purchaseNo: 'ABPPL/PO/25-26/0091',
    lrGrNo: 'VL-8820',
    lrGrDate: '2025-07-25',
    vehicleNumber: 'MH-04-FK-1102',
    driverName: 'Mohan Lal',
    driverPhone: '+91 98980 11223',
    ewayBillNo: '241077391089',
    consignorName: 'Century Pulp & Paper Mill',
    consignorCity: 'Lalkuan (Nainital)',
    consigneeName: 'ABPPL Central Godown',
    consigneeCity: 'Bhiwandi (Mumbai)',
    cargoDescription: '120 GSM Maplitho Paper Reels & Reams',
    weightMt: 14.50,
    weightKg: 14500,
    packagesCount: 450,
    packageType: 'Reams',
    rateType: 'PER_MT',
    ratePerMt: 950,
    baseFreightAmount: 13775,
    loadingCharges: 400,
    unloadingCharges: 0,
    tollCharges: 325,
    detentionCharges: 0,
    doorDeliveryCharge: 0,
    gtaGstScheme: 'RCM_5_PERCENT',
    isRcmApplicable: true,
    gstRate: 5,
    freightAmount: 14500,
    paidAmount: 14500,
    dueAmount: 0,
    paidBy: 'SELF',
    advancePaidToDriver: 8000,
    paymentDate: '2025-07-26',
    paymentMode: 'BANK_TRANSFER',
    paymentRefNo: 'UTR998822001',
    paymentStatus: 'PAID',
    deliveryStatus: 'POD_RECEIVED',
    notes: 'Inward mill transport from Nainital. Rate calculated @ ₹950 / MT.',
    createdAt: '2025-07-25T09:00:00Z'
  },
  {
    id: 'fr-3',
    billNo: 'FB-2526-0045',
    freightType: 'OUTWARD',
    transporterId: 'tr-2',
    transporterName: 'Bombay Roadways',
    transporterGstin: '27AABCB5566G1Z2',
    invoiceNo: 'ABPPL/INV/25-26/0148',
    deliveryChallanNo: 'CH-2025-0820',
    lrGrNo: 'BR-10492',
    lrGrDate: '2025-08-10',
    vehicleNumber: 'MH-02-EE-4410',
    driverName: 'Gurpreet Singh',
    driverPhone: '+91 98199 44332',
    ewayBillNo: '241099201948',
    consignorName: 'ABPPL Bhiwandi Yard',
    consignorCity: 'Bhiwandi',
    consigneeName: 'National Box & Packaging',
    consigneeCity: 'Andheri East',
    cargoDescription: '250 GSM Duplex Board Sheets - 200 Reams',
    weightMt: 8.40,
    weightKg: 8400,
    packagesCount: 200,
    packageType: 'Reams',
    rateType: 'PER_MT',
    ratePerMt: 1200,
    baseFreightAmount: 10080,
    loadingCharges: 400,
    unloadingCharges: 0,
    tollCharges: 320,
    detentionCharges: 0,
    doorDeliveryCharge: 500,
    insuranceCharges: 0,
    gtaGstScheme: 'FORWARD_12_PERCENT',
    isRcmApplicable: false,
    gstRate: 12,
    gstAmount: 1356,
    freightAmount: 12656,
    paidAmount: 6000,
    dueAmount: 6656,
    paidBy: 'SELF_ADVANCE',
    advancePaidToDriver: 6000,
    paymentDate: '2025-08-10',
    paymentMode: 'UPI',
    paymentRefNo: 'UPI/20250810/8812',
    paymentStatus: 'PARTIALLY_PAID',
    deliveryStatus: 'IN_TRANSIT',
    notes: 'Advance ₹6,000 paid via UPI to driver. Balance ₹6,656 payable upon POD delivery.',
    createdAt: '2025-08-10T11:00:00Z'
  }
];

const DEFAULT_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    orderDate: '2025-08-01',
    expectedDeliveryDate: '2025-08-05',
    customerId: 'cust-101',
    customerName: 'Apex Printpack Solutions',
    customerGstin: '27AABCA1234F1Z1',
    customerPhone: '+91 98210 44332',
    customerEmail: 'purchase@apexprintpack.com',
    customerAddress: 'Industrial Estate, Unit 12, Goregaon East, Mumbai, MH - 400063',
    customerPoNumber: 'PO-AP-2025-099',
    customerPoDate: '2025-07-30',
    paymentTerms: 'Net 30 Days',
    deliveryDispatchRef: 'CH-2025-0814',
    dispatchNotes: 'Fragile paper edges - strap and shrink wrap pallets securely',
    billTo: {
      name: 'Anil Gupta',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Anil Gupta (Procurement Head)',
      address: 'Industrial Estate, Unit 12, Goregaon East',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400063',
      gstin: '27AABCA1234F1Z1',
      pan: 'AABCA1234F',
      phone: '+91 98210 44332',
      email: 'purchase@apexprintpack.com'
    },
    shipTo: {
      name: 'Apex Printpack Plant 2 (Warehouse)',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Ramesh Sawant (Store Incharge)',
      address: 'Gala 3, Prime Industrial Park, Vasai East',
      city: 'Palghar',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '401208',
      gstin: '27AABCA1234F1Z1',
      phone: '+91 98210 44332',
      email: 'stores.vasai@apexprintpack.com'
    },
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGovtId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-9921',
    lrGrNo: 'VL-9982',
    lrGrDate: '2025-08-01',
    freightAmount: 3500,
    freightPaidBy: 'BUYER',
    items: [
      {
        productId: 'prod-301',
        productName: 'Craft Paper High BF 120 GSM',
        code: 'KP-120-2336',
        category: 'Kraft Paper',
        paperType: 'Kraft Paper',
        brand: 'ITC Ltd',
        gsm: 120,
        sizeInches: '23x36',
        quantity: 100,
        quantityKgs: 3205.16,
        unit: 'Ream',
        rate: 1450,
        discountPct: 2,
        taxableValue: 142100,
        gstRate: 18,
        cgst: 12789,
        sgst: 12789,
        igst: 0,
        gstAmount: 25578,
        netAmount: 167678
      },
      {
        productId: 'prod-302',
        productName: 'Super Gloss Art Paper 300 GSM',
        code: 'AP-300-2536',
        category: 'Art Paper / C2S',
        paperType: 'Art Paper / C2S',
        brand: 'Century Pulp & Paper',
        gsm: 300,
        sizeInches: '25x36',
        quantity: 30,
        quantityKgs: 2612.90,
        unit: 'Ream',
        rate: 4800,
        discountPct: 0,
        taxableValue: 144000,
        gstRate: 18,
        cgst: 12960,
        sgst: 12960,
        igst: 0,
        gstAmount: 25920,
        netAmount: 169920
      }
    ],
    subtotal: 289000,
    discountTotal: 2900,
    taxableAmount: 286100,
    cgstTotal: 25749,
    sgstTotal: 25749,
    igstTotal: 0,
    gstTotal: 51498,
    freightCharges: 3500,
    roundOff: 0,
    grandTotal: 337598,
    status: 'INVOICED',
    invoiceIds: ['inv-501'],
    invoiceNos: ['ABPPL/INV/25-26/0142'],
    notes: 'Order confirmed with 18% GST. Dispatched on truck MH-04-FK-9921.',
    terms: 'Payment due within 30 days. Late payment subject to 18% p.a. interest.',
    createdAt: '2025-08-01T09:00:00Z'
  },
  {
    id: 'so-102',
    orderNo: 'ABPPL/SO/25-26/0015',
    orderDate: '2025-08-03',
    expectedDeliveryDate: '2025-08-06',
    customerId: 'cust-102',
    customerName: 'Standard Offset Printers',
    customerGstin: '27AABCS5678G2Z3',
    customerPhone: '+91 98199 88776',
    customerEmail: 'mahesh@standardoffset.in',
    customerAddress: 'Gala 5, Commercial Complex, Bhiwandi, Thane, MH',
    customerPoNumber: 'SOP-PO-2025-88',
    customerPoDate: '2025-08-02',
    paymentTerms: 'Net 15 Days',
    deliveryDispatchRef: 'CH-2025-0818',
    dispatchNotes: 'Direct plant unloading near press machine',
    billTo: {
      name: 'Mahesh Shah',
      companyName: 'Standard Offset Printers',
      contactPerson: 'Mahesh Shah',
      address: 'Gala 5, Commercial Complex, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '421302',
      gstin: '27AABCS5678G2Z3',
      phone: '+91 98199 88776',
      email: 'mahesh@standardoffset.in'
    },
    shipTo: {
      name: 'Standard Offset Printers (Press Unit)',
      companyName: 'Standard Offset Printers',
      contactPerson: 'Mahesh Shah',
      address: 'Gala 5, Commercial Complex, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '421302',
      gstin: '27AABCS5678G2Z3',
      phone: '+91 98199 88776',
      email: 'mahesh@standardoffset.in'
    },
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGovtId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-1102',
    lrGrNo: 'VL-9990',
    lrGrDate: '2025-08-04',
    freightAmount: 2200,
    freightPaidBy: 'BUYER',
    items: [
      {
        productId: 'prod-304',
        productName: 'Maplitho High Bright 70 GSM',
        code: 'ML-070-2030',
        category: 'Maplitho Paper',
        paperType: 'Maplitho Paper',
        brand: 'JK Paper Industries',
        gsm: 70,
        sizeInches: '20x30',
        quantity: 200,
        quantityKgs: 2709.68,
        unit: 'Ream',
        rate: 780,
        discountPct: 0,
        taxableValue: 156000,
        gstRate: 18,
        cgst: 14040,
        sgst: 14040,
        igst: 0,
        gstAmount: 28080,
        netAmount: 184080
      }
    ],
    subtotal: 156000,
    discountTotal: 0,
    taxableAmount: 156000,
    cgstTotal: 14040,
    sgstTotal: 14040,
    igstTotal: 0,
    gstTotal: 28080,
    grandTotal: 184080,
    status: 'INVOICED',
    invoiceIds: ['inv-502'],
    invoiceNos: ['ABPPL/INV/25-26/0143'],
    notes: 'Invoiced and fully paid via bank transfer.',
    terms: 'Payment due within 15 days.',
    createdAt: '2025-08-03T10:00:00Z'
  },
  {
    id: 'so-103',
    orderNo: 'ABPPL/SO/25-26/0016',
    orderDate: '2025-08-11',
    expectedDeliveryDate: '2025-08-16',
    customerId: 'cust-103',
    customerName: 'National Box & Packaging',
    customerGstin: '27AABCN9988H1Z5',
    customerPhone: '+91 98331 22110',
    customerEmail: 'order@nationalbox.co.in',
    customerAddress: 'Plot 88, MIDC Tarapur, Palghar, MH',
    customerPoNumber: 'NBP/PO/AUG/104',
    customerPoDate: '2025-08-10',
    paymentTerms: 'Net 30 Days',
    deliveryDispatchRef: 'CH-2025-0822',
    dispatchNotes: 'Corrugation grade sheets. Protect moisture cover with tarpaulin.',
    billTo: {
      name: 'Prakash Nair',
      companyName: 'National Box & Packaging',
      contactPerson: 'Prakash Nair',
      address: 'Plot 88, MIDC Tarapur',
      city: 'Palghar',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '401506',
      gstin: '27AABCN9988H1Z5',
      phone: '+91 98331 22110',
      email: 'order@nationalbox.co.in'
    },
    shipTo: {
      name: 'National Box Corrugation Plant',
      companyName: 'National Box & Packaging',
      contactPerson: 'Ganesh Shinde',
      address: 'Plot 88-B, MIDC Tarapur Industrial Area',
      city: 'Palghar',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '401506',
      gstin: '27AABCN9988H1Z5',
      phone: '+91 98331 22110',
      email: 'stores@nationalbox.co.in'
    },
    transporterId: 'tr-2',
    transporterName: 'Patel Roadways Carrier',
    transporterGovtId: '27AABCP5678Q1ZZ',
    vehicleNumber: 'MH-48-AC-5510',
    lrGrNo: 'PR-4412',
    lrGrDate: '2025-08-11',
    freightAmount: 8500,
    freightPaidBy: 'BUYER',
    items: [
      {
        productId: 'prod-303',
        productName: 'Duplex Board Grey Back 250 GSM',
        code: 'DB-250-3040',
        category: 'Duplex Board',
        paperType: 'Duplex Board',
        brand: 'West Coast Paper',
        gsm: 250,
        sizeInches: '30x40',
        quantity: 150,
        quantityKgs: 14516.13,
        unit: 'Ream',
        rate: 3950,
        discountPct: 3,
        taxableValue: 574725,
        gstRate: 18,
        cgst: 51725.25,
        sgst: 51725.25,
        igst: 0,
        gstAmount: 103450.5,
        netAmount: 678175.5
      }
    ],
    subtotal: 592500,
    discountTotal: 17775,
    taxableAmount: 574725,
    cgstTotal: 51725.25,
    sgstTotal: 51725.25,
    igstTotal: 0,
    gstTotal: 103450.5,
    grandTotal: 678176,
    status: 'CONFIRMED',
    notes: 'Confirmed Sales Order ready for GST Invoicing and dispatch.',
    terms: 'Payment due within 30 days.',
    createdAt: '2025-08-11T11:00:00Z'
  },
  {
    id: 'so-104',
    orderNo: 'ABPPL/SO/25-26/0017',
    orderDate: '2025-08-12',
    expectedDeliveryDate: '2025-08-17',
    customerId: 'cust-101',
    customerName: 'Apex Printpack Solutions',
    customerGstin: '27AABCA1234F1Z1',
    customerPhone: '+91 98210 44332',
    customerEmail: 'purchase@apexprintpack.com',
    customerAddress: 'Industrial Estate, Unit 12, Goregaon East, Mumbai, MH - 400063',
    customerPoNumber: 'PO-AP-2025-112',
    customerPoDate: '2025-08-11',
    paymentTerms: 'Net 30 Days',
    deliveryDispatchRef: 'CH-2025-0825',
    dispatchNotes: 'Urgent delivery for upcoming carton run',
    billTo: {
      name: 'Anil Gupta',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Anil Gupta',
      address: 'Industrial Estate, Unit 12, Goregaon East',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400063',
      gstin: '27AABCA1234F1Z1',
      pan: 'AABCA1234F',
      phone: '+91 98210 44332',
      email: 'purchase@apexprintpack.com'
    },
    shipTo: {
      name: 'Apex Printpack Plant 2 (Warehouse)',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Ramesh Sawant',
      address: 'Gala 3, Prime Industrial Park, Vasai East',
      city: 'Palghar',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '401208',
      gstin: '27AABCA1234F1Z1',
      phone: '+91 98210 44332',
      email: 'stores.vasai@apexprintpack.com'
    },
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGovtId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-9921',
    lrGrNo: 'VL-10022',
    lrGrDate: '2025-08-12',
    freightAmount: 1800,
    freightPaidBy: 'BUYER',
    items: [
      {
        productId: 'prod-301',
        productName: 'Craft Paper High BF 120 GSM',
        code: 'KP-120-2336',
        category: 'Kraft Paper',
        paperType: 'Kraft Paper',
        brand: 'ITC Ltd',
        gsm: 120,
        sizeInches: '23x36',
        quantity: 50,
        quantityKgs: 1602.58,
        unit: 'Ream',
        rate: 1450,
        discountPct: 0,
        taxableValue: 72500,
        gstRate: 18,
        cgst: 6525,
        sgst: 6525,
        igst: 0,
        gstAmount: 13050,
        netAmount: 85550
      }
    ],
    subtotal: 72500,
    discountTotal: 0,
    taxableAmount: 72500,
    cgstTotal: 6525,
    sgstTotal: 6525,
    igstTotal: 0,
    gstTotal: 13050,
    grandTotal: 85550,
    status: 'CONFIRMED',
    notes: 'Order confirmed and ready to generate GST Invoice.',
    terms: 'Payment due within 30 days.',
    createdAt: '2025-08-12T10:30:00Z'
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-501',
    invoiceNo: 'ABPPL/INV/25-26/0142',
    type: 'INVOICE',
    invoiceStatus: 'DISPATCHED',
    salesOrderId: 'so-101',
    salesOrderNo: 'ABPPL/SO/25-26/0014',
    orderReference: 'ABPPL/SO/25-26/0014 (PO-AP-2025-099)',
    deliveryDispatchRef: 'CH-2025-0814',
    dispatchDate: '2025-08-01',
    ewayBillNo: '241899100234',
    customerId: 'cust-101',
    customerName: 'Apex Printpack Solutions',
    billTo: {
      name: 'Anil Gupta',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Anil Gupta',
      address: 'Industrial Estate, Unit 12, Goregaon East',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400063',
      gstin: '27AABCA1234F1Z1',
      pan: 'AABCA1234F',
      phone: '+91 98210 44332',
      email: 'purchase@apexprintpack.com'
    },
    shipTo: {
      name: 'Apex Printpack Plant 2 (Warehouse)',
      companyName: 'Apex Printpack Solutions',
      contactPerson: 'Ramesh Sawant',
      address: 'Gala 3, Prime Industrial Park, Vasai East',
      city: 'Palghar',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '401208',
      gstin: '27AABCA1234F1Z1',
      phone: '+91 98210 44332',
      email: 'stores.vasai@apexprintpack.com'
    },
    customerGstin: '27AABCA1234F1Z1',
    customerPhone: '+91 98210 44332',
    customerEmail: 'purchase@apexprintpack.com',
    customerAddress: 'Industrial Estate, Unit 12, Goregaon East, Mumbai, MH - 400063',
    date: '2025-08-01',
    dueDate: '2025-08-31',
    paymentTerms: 'Net 30 Days',
    poNumber: 'PO-AP-2025-099',
    poDate: '2025-07-30',
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGovtId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-9921',
    lrGrNo: 'VL-9982',
    lrGrDate: '2025-08-01',
    freightAmount: 3500,
    freightPaidBy: 'BUYER',
    deliveryNotes: 'Dispatched via Transporter Vijay Logistics on Truck #MH-04-FK-9921.',
    items: [
      {
        productId: 'prod-301',
        productName: 'Craft Paper High BF 120 GSM',
        code: 'KP-120-2336',
        category: 'Kraft Paper',
        paperType: 'Kraft Paper',
        brand: 'ITC Ltd',
        gsm: 120,
        sizeInches: '23x36',
        quantity: 100,
        quantityKgs: 3205.16,
        unit: 'Ream',
        rate: 1450,
        discountPct: 2,
        taxableValue: 142100,
        gstRate: 18,
        cgst: 12789,
        sgst: 12789,
        igst: 0,
        gstAmount: 25578,
        netAmount: 167678
      },
      {
        productId: 'prod-302',
        productName: 'Super Gloss Art Paper 300 GSM',
        code: 'AP-300-2536',
        category: 'Art Paper / C2S',
        paperType: 'Art Paper / C2S',
        brand: 'Century Pulp & Paper',
        gsm: 300,
        sizeInches: '25x36',
        quantity: 30,
        quantityKgs: 2612.90,
        unit: 'Ream',
        rate: 4800,
        discountPct: 0,
        taxableValue: 144000,
        gstRate: 18,
        cgst: 12960,
        sgst: 12960,
        igst: 0,
        gstAmount: 25920,
        netAmount: 169920
      }
    ],
    subtotal: 289000,
    discountTotal: 2900,
    taxableAmount: 286100,
    cgstTotal: 25749,
    sgstTotal: 25749,
    igstTotal: 0,
    gstTotal: 51498,
    roundOff: 0,
    grandTotal: 337598,
    paidAmount: 0,
    balanceDue: 337598,
    paymentStatus: 'UNPAID',
    status: 'ACTIVE',
    notes: 'Goods dispatched with original Tax Invoice & E-Way Bill.',
    terms: '1. Payment due within 30 days.\n2. Interest @ 18% p.a. will be charged on overdue payments.',
    createdAt: '2025-08-01T10:30:00Z'
  },
  {
    id: 'inv-502',
    invoiceNo: 'ABPPL/INV/25-26/0143',
    type: 'INVOICE',
    invoiceStatus: 'PAID',
    salesOrderId: 'so-102',
    salesOrderNo: 'ABPPL/SO/25-26/0015',
    orderReference: 'ABPPL/SO/25-26/0015 (SOP-PO-2025-88)',
    deliveryDispatchRef: 'CH-2025-0818',
    dispatchDate: '2025-08-04',
    ewayBillNo: '241899100299',
    customerId: 'cust-102',
    customerName: 'Standard Offset Printers',
    billTo: {
      name: 'Mahesh Shah',
      companyName: 'Standard Offset Printers',
      contactPerson: 'Mahesh Shah',
      address: 'Gala 5, Commercial Complex, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '421302',
      gstin: '27AABCS5678G2Z3',
      phone: '+91 98199 88776',
      email: 'mahesh@standardoffset.in'
    },
    shipTo: {
      name: 'Standard Offset Printers',
      companyName: 'Standard Offset Printers',
      contactPerson: 'Mahesh Shah',
      address: 'Gala 5, Commercial Complex, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '421302',
      gstin: '27AABCS5678G2Z3',
      phone: '+91 98199 88776',
      email: 'mahesh@standardoffset.in'
    },
    customerGstin: '27AABCS5678G2Z3',
    customerPhone: '+91 98199 88776',
    customerEmail: 'mahesh@standardoffset.in',
    customerAddress: 'Gala 5, Commercial Complex, Bhiwandi, Thane, MH',
    date: '2025-08-04',
    dueDate: '2025-09-03',
    paymentTerms: 'Net 15 Days',
    poNumber: 'SOP-PO-2025-88',
    poDate: '2025-08-02',
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    transporterGovtId: '27AABCV1234F1Z0',
    vehicleNumber: 'MH-04-FK-1102',
    lrGrNo: 'VL-9990',
    lrGrDate: '2025-08-04',
    freightAmount: 2200,
    freightPaidBy: 'BUYER',
    deliveryNotes: 'Delivered directly to Bhiwandi printing unit.',
    items: [
      {
        productId: 'prod-304',
        productName: 'Maplitho High Bright 70 GSM',
        code: 'ML-070-2030',
        category: 'Maplitho Paper',
        paperType: 'Maplitho Paper',
        brand: 'JK Paper Industries',
        gsm: 70,
        sizeInches: '20x30',
        quantity: 200,
        quantityKgs: 2709.68,
        unit: 'Ream',
        rate: 780,
        discountPct: 0,
        taxableValue: 156000,
        gstRate: 18,
        cgst: 14040,
        sgst: 14040,
        igst: 0,
        gstAmount: 28080,
        netAmount: 184080
      }
    ],
    subtotal: 156000,
    discountTotal: 0,
    taxableAmount: 156000,
    cgstTotal: 14040,
    sgstTotal: 14040,
    igstTotal: 0,
    gstTotal: 28080,
    grandTotal: 184080,
    paidAmount: 184080,
    balanceDue: 0,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    notes: 'Paid in full via HDFC Bank Transfer.',
    terms: 'Payment terms: Net 15 Days.',
    createdAt: '2025-08-04T11:00:00Z'
  },
  {
    id: 'qtn-601',
    invoiceNo: 'ABPPL/QTN/25-26/0088',
    type: 'QUOTATION',
    quotationStatus: 'SENT',
    customerId: 'cust-103',
    customerName: 'National Box & Packaging',
    customerGstin: '27AABCN9988H1Z5',
    customerPhone: '+91 98331 22110',
    customerAddress: 'Plot 88, MIDC Tarapur, Palghar, MH',
    date: '2025-08-10',
    dueDate: '2025-08-25',
    paymentTerms: 'Net 30 Days',
    items: [
      {
        productId: 'prod-303',
        productName: 'Duplex Board Grey Back 250 GSM',
        code: 'DB-250-3040',
        category: 'Duplex Board',
        paperType: 'Duplex Board',
        brand: 'West Coast Paper',
        gsm: 250,
        sizeInches: '30x40',
        quantity: 150,
        quantityKgs: 14516.13,
        unit: 'Ream',
        rate: 3950,
        discountPct: 3,
        taxableValue: 574725,
        gstRate: 18,
        cgst: 51725.25,
        sgst: 51725.25,
        igst: 0,
        gstAmount: 103450.5,
        netAmount: 678175.5
      }
    ],
    subtotal: 592500,
    discountTotal: 17775,
    taxableAmount: 574725,
    cgstTotal: 51725.25,
    sgstTotal: 51725.25,
    igstTotal: 0,
    gstTotal: 103450.5,
    grandTotal: 678176,
    paidAmount: 0,
    balanceDue: 678176,
    paymentStatus: 'UNPAID',
    status: 'ACTIVE',
    notes: 'Quotation valid for 15 days from issue date.',
    createdAt: '2025-08-10T14:15:00Z'
  }
];

const DEFAULT_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po-701',
    purchaseNo: 'ABPPL/PO/25-26/0091',
    supplierId: 'supp-201',
    supplierName: 'Century Pulp & Paper',
    date: '2025-07-25',
    dueDate: '2025-08-24',
    paymentTerms: 'Net 30 Days',
    supplierInvoiceNo: 'CPP/INV/88210',
    supplierInvoiceDate: '2025-07-24',
    transporterId: 'tr-1',
    transporterName: 'Vijay Logistics',
    vehicleNumber: 'MH-04-FK-1102',
    lrGrNo: 'VL-8820',
    freightAmount: 14500,
    freightPaidBy: 'SELF',
    items: [
      {
        productId: 'prod-302',
        productName: 'Super Gloss Art Paper 300 GSM',
        code: 'AP-300-2536',
        category: 'Art Paper / C2S',
        paperType: 'Art Paper / C2S',
        brand: 'Century Pulp & Paper',
        gsm: 300,
        sizeInches: '25x36',
        quantity: 150,
        unit: 'Ream',
        rate: 4200,
        discountPct: 0,
        taxableAmount: 630000,
        gstRate: 12,
        cgst: 0,
        sgst: 0,
        igst: 75600,
        totalAmount: 705600,
        batchLotNo: 'LOT-2025-07-C'
      }
    ],
    subtotal: 630000,
    discountTotal: 0,
    taxableAmount: 630000,
    cgst: 0,
    sgst: 0,
    igst: 75600,
    gstAmount: 75600,
    roundOff: 0,
    grandTotal: 705600,
    paidAmount: 705600,
    balanceDue: 0,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    notes: 'Received in full at Bhiwandi Godown No. 3.',
    createdAt: '2025-07-25T09:00:00Z'
  }
];

const DEFAULT_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-801',
    paymentNo: 'ABPPL/PAY/2025/0310',
    partyType: 'CUSTOMER',
    partyId: 'cust-102',
    partyName: 'Standard Offset Printers',
    invoiceId: 'inv-502',
    amount: 174720,
    paymentDate: '2025-08-08',
    method: 'BANK_TRANSFER',
    referenceNo: 'UTR9988123456',
    remarks: 'Full payment against invoice ABPPL/INV/25-26/0143',
    createdAt: '2025-08-08T16:00:00Z'
  }
];

const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'WH-BHW',
    name: 'Bhiwandi Central Godown',
    location: 'Gala 14-18, Arihant Commercial Complex, Kopar Road',
    city: 'Bhiwandi',
    state: 'Maharashtra',
    isDefault: true,
    capacityTon: 1500,
    managerName: 'Amit Patel',
    contactPhone: '+91 98200 11223',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'wh-2',
    code: 'WH-KLB',
    name: 'Kalbadevi City Depot',
    location: '54/56, Sutar Chawl, Paper Market',
    city: 'Mumbai',
    state: 'Maharashtra',
    isDefault: false,
    capacityTon: 300,
    managerName: 'Suresh Shah',
    contactPhone: '+91 98210 55443',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'wh-3',
    code: 'WH-VAP',
    name: 'Vapi Mill Logistics Hub',
    location: 'GIDC Phase 2, Near Paper Mills Area',
    city: 'Vapi',
    state: 'Gujarat',
    isDefault: false,
    capacityTon: 2500,
    managerName: 'Rajesh Chauhan',
    contactPhone: '+91 98250 99881',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'wh-4',
    code: 'WH-SUR',
    name: 'Surat Distribution Depot',
    location: 'Plot 88, Sachin GIDC Industrial Area',
    city: 'Surat',
    state: 'Gujarat',
    isDefault: false,
    capacityTon: 800,
    managerName: 'Deepak Jha',
    contactPhone: '+91 98240 77665',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

const DEFAULT_STOCK_TRANSFERS: StockTransfer[] = [
  {
    id: 'trf-1',
    transferNo: 'ABPPL/TRF/25-26/001',
    date: '2025-08-05T11:00:00Z',
    fromWarehouseId: 'wh-3',
    fromWarehouseName: 'Vapi Mill Logistics Hub',
    toWarehouseId: 'wh-1',
    toWarehouseName: 'Bhiwandi Central Godown',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    quantity: 50,
    unit: 'Ream',
    referenceDocNo: 'CHALLAN-TRF-001',
    reason: 'Replenishment for high-demand Bhiwandi client base',
    status: 'COMPLETED',
    transporterName: 'Vijay Logistics',
    vehicleNo: 'MH-04-FK-9921',
    notes: 'Inter-godown transfer completed and verified by Amit Patel',
    performedBy: 'Amit Patel',
    createdAt: '2025-08-05T11:00:00Z'
  }
];

const DEFAULT_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-1',
    adjustmentNo: 'ABPPL/ADJ/25-26/001',
    date: '2025-08-03T14:30:00Z',
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    productId: 'prod-302',
    productName: 'Super Gloss Art Paper 300 GSM',
    productCode: 'AP-300-2536',
    adjustmentType: 'DEDUCT',
    quantity: 2,
    unit: 'Ream',
    reasonCode: 'DAMAGED_PAPER',
    referenceDocNo: 'QC-REJECT-2025-08',
    remarks: 'Corner moisture dampness damaged 2 outer reams during monsoon storage',
    physicalCountedQty: 23,
    systemQtyBefore: 25,
    systemQtyAfter: 23,
    performedBy: 'Amit Patel',
    createdAt: '2025-08-03T14:30:00Z'
  }
];

const DEFAULT_STOCK_RESERVATIONS: StockReservation[] = [
  {
    id: 'res-1',
    reservationNo: 'ABPPL/RES/25-26/001',
    date: '2025-08-10T10:00:00Z',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    quantity: 25,
    unit: 'Ream',
    salesOrderRef: 'ABPPL/SO/25-26/0088',
    customerName: 'Apex Printpack Solutions',
    status: 'ACTIVE',
    notes: 'Reserved for urgent corrugated packaging box order dispatching next Tuesday',
    reservedBy: 'Sanjay Sharma',
    createdAt: '2025-08-10T10:00:00Z'
  }
];

const DEFAULT_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-901',
    movementNo: 'STK-2025-0042',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    category: 'Kraft Paper',
    gsm: 120,
    sizeInches: '23x36',
    type: 'STOCK_OUT',
    quantity: 100,
    unit: 'Ream',
    stockBefore: 350,
    stockAfter: 250,
    availableBefore: 325,
    availableAfter: 225,
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    referenceDocType: 'SALES_INVOICE',
    referenceNo: 'ABPPL/INV/25-26/0142',
    reasonCode: 'SALES_DISPATCH',
    reason: 'Sales Order Dispatch to Apex Printpack Solutions',
    performedBy: 'Amit Patel',
    performedByRole: 'Warehouse Manager',
    date: '2025-08-01T10:30:00Z'
  },
  {
    id: 'mov-902',
    movementNo: 'STK-2025-0041',
    productId: 'prod-302',
    productName: 'Super Gloss Art Paper 300 GSM',
    productCode: 'AP-300-2536',
    category: 'Art Paper / C2S',
    gsm: 300,
    sizeInches: '25x36',
    type: 'STOCK_IN',
    quantity: 150,
    unit: 'Ream',
    stockBefore: 50,
    stockAfter: 200,
    availableBefore: 50,
    availableAfter: 200,
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    referenceDocType: 'PURCHASE_RECEIPT',
    referenceNo: 'ABPPL/PO/25-26/0091',
    reasonCode: 'PURCHASE_ENTRY',
    reason: 'Mill Purchase Arrival from Century Pulp & Paper',
    performedBy: 'Amit Patel',
    performedByRole: 'Warehouse Manager',
    date: '2025-07-25T09:00:00Z'
  },
  {
    id: 'mov-903',
    movementNo: 'STK-2025-0040',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    category: 'Kraft Paper',
    gsm: 120,
    sizeInches: '23x36',
    type: 'TRANSFER_OUT',
    quantity: 50,
    unit: 'Ream',
    stockBefore: 150,
    stockAfter: 100,
    warehouseId: 'wh-3',
    warehouseName: 'Vapi Mill Logistics Hub',
    targetWarehouseId: 'wh-1',
    targetWarehouseName: 'Bhiwandi Central Godown',
    referenceDocType: 'WAREHOUSE_TRANSFER',
    referenceNo: 'ABPPL/TRF/25-26/001',
    reasonCode: 'INTER_GODOWN_TRANSFER',
    reason: 'Transfer Out to Bhiwandi Central Godown',
    performedBy: 'Rajesh Chauhan',
    performedByRole: 'Vapi Depot Supervisor',
    date: '2025-08-05T11:00:00Z'
  },
  {
    id: 'mov-904',
    movementNo: 'STK-2025-0039',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    category: 'Kraft Paper',
    gsm: 120,
    sizeInches: '23x36',
    type: 'TRANSFER_IN',
    quantity: 50,
    unit: 'Ream',
    stockBefore: 200,
    stockAfter: 250,
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    targetWarehouseId: 'wh-3',
    targetWarehouseName: 'Vapi Mill Logistics Hub',
    referenceDocType: 'WAREHOUSE_TRANSFER',
    referenceNo: 'ABPPL/TRF/25-26/001',
    reasonCode: 'INTER_GODOWN_TRANSFER',
    reason: 'Transfer In from Vapi Mill Logistics Hub',
    performedBy: 'Amit Patel',
    performedByRole: 'Warehouse Manager',
    date: '2025-08-05T15:00:00Z'
  },
  {
    id: 'mov-905',
    movementNo: 'STK-2025-0038',
    productId: 'prod-302',
    productName: 'Super Gloss Art Paper 300 GSM',
    productCode: 'AP-300-2536',
    category: 'Art Paper / C2S',
    gsm: 300,
    sizeInches: '25x36',
    type: 'ADJUSTMENT_DEDUCT',
    quantity: 2,
    unit: 'Ream',
    stockBefore: 25,
    stockAfter: 23,
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    referenceDocType: 'ADJUSTMENT_VOUCHER',
    referenceNo: 'ABPPL/ADJ/25-26/001',
    reasonCode: 'DAMAGED_PAPER',
    reason: 'Moisture dampness physical damage deduction',
    performedBy: 'Amit Patel',
    performedByRole: 'Warehouse Manager',
    date: '2025-08-03T14:30:00Z'
  },
  {
    id: 'mov-906',
    movementNo: 'STK-2025-0037',
    productId: 'prod-301',
    productName: 'Craft Paper High BF 120 GSM',
    productCode: 'KP-120-2336',
    category: 'Kraft Paper',
    gsm: 120,
    sizeInches: '23x36',
    type: 'RESERVE',
    quantity: 25,
    unit: 'Ream',
    stockBefore: 250,
    stockAfter: 250,
    availableBefore: 250,
    availableAfter: 225,
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    referenceDocType: 'SALES_RESERVATION',
    referenceNo: 'ABPPL/RES/25-26/001',
    reasonCode: 'RESERVATION_HOLD',
    reason: 'Stock Reserved for Apex Printpack Solutions Order #SO-0088',
    performedBy: 'Sanjay Sharma',
    performedByRole: 'Sales Lead',
    date: '2025-08-10T10:00:00Z'
  }
];

const DEFAULT_PRICE_LISTS: CustomerPriceList[] = [
  {
    id: 'pl-1',
    partyId: 'cust-103',
    partyName: 'National Box & Packaging',
    partyType: 'DISTRIBUTOR',
    productId: 'prod-301',
    productName: 'Kraft Paper High BF 120 GSM',
    category: 'Kraft Paper',
    gsm: 120,
    sizeInches: '23x36',
    standardRate: 1450,
    specialRate: 1350,
    discountPct: 5,
    minOrderQty: 100,
    effectiveFrom: '2025-01-01',
    notes: 'Tier-1 Distributor contracted wholesale rate',
    updatedBy: 'Rajesh Kumar (Super Admin)',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pl-2',
    partyId: 'cust-101',
    partyName: 'Apex Printpack Solutions',
    partyType: 'CUSTOMER',
    productId: 'prod-302',
    productName: 'Super Gloss Art Paper 300 GSM',
    category: 'Art Paper / C2S',
    gsm: 300,
    sizeInches: '25x36',
    standardRate: 4800,
    specialRate: 4600,
    discountPct: 3,
    minOrderQty: 25,
    effectiveFrom: '2025-01-10',
    notes: 'Premium commercial printer special discount',
    updatedBy: 'Sanjay Sharma (Sales Lead)',
    updatedAt: '2025-01-10T00:00:00Z'
  }
];

const DEFAULT_DELIVERIES: DeliveryChallan[] = [
  {
    id: 'dc-101',
    challanNo: 'ABPPL/DC/25-26/0042',
    packingSlipNo: 'ABPPL/PS/25-26/0042',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    invoiceId: 'inv-501',
    invoiceNo: 'ABPPL/INV/25-26/0142',
    customerId: 'cust-101',
    customerName: 'Apex Printpack Solutions',
    dispatchDate: '2025-08-01',
    expectedDeliveryDate: '2025-08-02',
    actualDeliveryDate: '2025-08-02',
    transporterName: 'Vijay Logistics',
    transporterId: 'tr-1',
    vehicleNumber: 'MH-04-FK-9921',
    lrGrNo: 'VL-9982',
    lrGrDate: '2025-08-01',
    driverPhone: '+91 98221 00982',
    warehouseId: 'wh-1',
    warehouseName: 'Bhiwandi Central Godown',
    totalPackages: 45,
    packageType: 'Bundles',
    totalWeightKgs: 5818.06,
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod-301',
        productName: 'Kraft Paper High BF 120 GSM',
        sizeInches: '23x36',
        gsm: 120,
        orderedQty: 100,
        dispatchedQty: 100,
        deliveredQty: 100,
        unit: 'Ream',
        weightKg: 3205.16
      },
      {
        productId: 'prod-302',
        productName: 'Super Gloss Art Paper 300 GSM',
        sizeInches: '25x36',
        gsm: 300,
        orderedQty: 30,
        dispatchedQty: 30,
        deliveredQty: 30,
        unit: 'Ream',
        weightKg: 2612.90
      }
    ],
    deliveryRemarks: 'Delivered securely to Vasai warehouse. Received by Ramesh Sawant.',
    receivedBy: 'Ramesh Sawant (Store Incharge)',
    receiverSignatureNote: 'Signed on physical delivery challan',
    deliveredAt: '2025-08-02T16:45:00Z',
    dispatchedBy: 'Amit Patel (Warehouse Mgr)',
    createdAt: '2025-08-01T10:00:00Z'
  }
];

const DEFAULT_RECEIPTS: PaymentReceipt[] = [
  {
    id: 'rec-101',
    receiptNo: 'ABPPL/REC/25-26/0089',
    paymentId: 'pay-701',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    invoiceId: 'inv-501',
    invoiceNo: 'ABPPL/INV/25-26/0142',
    customerId: 'cust-101',
    customerName: 'Apex Printpack Solutions',
    amount: 150000,
    paymentDate: '2025-08-02',
    paymentMode: 'BANK_TRANSFER',
    referenceNo: 'HDFC-NEFT-99882103',
    bankName: 'HDFC Bank',
    status: 'SUCCESS',
    notes: 'Part payment received for Invoice #ABPPL/INV/25-26/0142',
    collectedBy: 'Priya Verma (Accounts Head)',
    createdAt: '2025-08-02T11:30:00Z'
  }
];

const DEFAULT_ORDER_STATUS_HISTORY: OrderStatusHistoryEntry[] = [
  {
    id: 'osh-1',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'DRAFT',
    toStatus: 'SUBMITTED',
    action: 'Order Placed & Submitted by Customer',
    performedBy: 'Anil Gupta (Apex Printpack Solutions)',
    performedByRole: 'customer',
    timestamp: '2025-08-01T08:30:00Z',
    notes: 'Order submitted via Customer Wholesale Portal.'
  },
  {
    id: 'osh-2',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'SUBMITTED',
    toStatus: 'APPROVED',
    action: 'Order Approved & Credit Limit Verified',
    performedBy: 'Vikas Mehta (Operations Manager)',
    performedByRole: 'manager',
    timestamp: '2025-08-01T09:00:00Z',
    notes: 'Credit check passed. Approved for processing.'
  },
  {
    id: 'osh-3',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'APPROVED',
    toStatus: 'STOCK_RESERVED',
    action: 'Stock Reserved in Bhiwandi Godown',
    performedBy: 'Amit Patel (Warehouse Mgr)',
    performedByRole: 'inventory',
    timestamp: '2025-08-01T09:15:00Z',
    notes: '100 Reams KP-120 and 30 Reams AP-300 reserved.'
  },
  {
    id: 'osh-4',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'STOCK_RESERVED',
    toStatus: 'PACKED',
    action: 'Order Packed into 45 Bundles',
    performedBy: 'Amit Patel (Warehouse Mgr)',
    performedByRole: 'inventory',
    timestamp: '2025-08-01T11:00:00Z',
    notes: 'Moisture wrap packaging complete with packing slip #ABPPL/PS/25-26/0042.'
  },
  {
    id: 'osh-5',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'PACKED',
    toStatus: 'DISPATCHED',
    action: 'Dispatched via Vijay Logistics (Truck #MH-04-FK-9921)',
    performedBy: 'Amit Patel (Warehouse Mgr)',
    performedByRole: 'inventory',
    timestamp: '2025-08-01T14:30:00Z',
    notes: 'Delivery Challan #ABPPL/DC/25-26/0042 issued with LR #VL-9982.'
  },
  {
    id: 'osh-6',
    orderId: 'so-101',
    orderNo: 'ABPPL/SO/25-26/0014',
    fromStatus: 'DISPATCHED',
    toStatus: 'DELIVERED',
    action: 'Goods Delivered & Acknowledged by Customer',
    performedBy: 'Vijay Logistics Driver',
    performedByRole: 'transporter',
    timestamp: '2025-08-02T16:45:00Z',
    notes: 'Received in good condition by Ramesh Sawant at Vasai plant.'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2025-08-01T08:30:00Z',
    userId: 'usr-7',
    userName: 'Anil Gupta',
    userRole: 'customer',
    action: 'ORDER_SUBMITTED',
    entityType: 'ORDER',
    entityId: 'so-101',
    entityNo: 'ABPPL/SO/25-26/0014',
    details: 'Sales order submitted with total amount ₹3,37,598.'
  },
  {
    id: 'aud-2',
    timestamp: '2025-08-01T09:00:00Z',
    userId: 'usr-5',
    userName: 'Vikas Mehta',
    userRole: 'manager',
    action: 'ORDER_APPROVED',
    entityType: 'ORDER',
    entityId: 'so-101',
    entityNo: 'ABPPL/SO/25-26/0014',
    details: 'Order approved. Credit limit and outstanding balance verified.'
  },
  {
    id: 'aud-3',
    timestamp: '2025-08-01T09:15:00Z',
    userId: 'usr-3',
    userName: 'Amit Patel',
    userRole: 'inventory',
    action: 'ORDER_STOCK_RESERVED',
    entityType: 'ORDER',
    entityId: 'so-101',
    entityNo: 'ABPPL/SO/25-26/0014',
    details: 'Reserved 100 Reams Kraft Paper + 30 Reams Art Paper in Bhiwandi Central Godown.'
  },
  {
    id: 'aud-4',
    timestamp: '2025-08-01T14:30:00Z',
    userId: 'usr-3',
    userName: 'Amit Patel',
    userRole: 'inventory',
    action: 'DELIVERY_CHALLAN_CREATED',
    entityType: 'DELIVERY',
    entityId: 'dc-101',
    entityNo: 'ABPPL/DC/25-26/0042',
    details: 'Created Delivery Challan & Packing Slip for Truck #MH-04-FK-9921.'
  },
  {
    id: 'aud-5',
    timestamp: '2025-08-02T11:30:00Z',
    userId: 'usr-4',
    userName: 'Priya Verma',
    userRole: 'accounts',
    action: 'RECEIPT_GENERATED',
    entityType: 'RECEIPT',
    entityId: 'rec-101',
    entityNo: 'ABPPL/REC/25-26/0089',
    details: 'Payment receipt generated for ₹1,50,000 via HDFC Bank NEFT.'
  }
];

export interface DBStructure {
  settings: CompanySettings;
  users: StoredUser[];
  parties: Party[];
  customers?: Customer[];
  suppliers?: Supplier[];
  products: Product[];
  warehouses: Warehouse[];
  stockTransfers: StockTransfer[];
  stockAdjustments: StockAdjustment[];
  stockReservations: StockReservation[];
  stockMovements: StockMovement[];
  transporters: Transporter[];
  freights: FreightRecord[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  purchases: PurchaseOrder[];
  payments: PaymentRecord[];
  deliveries: DeliveryChallan[];
  receipts: PaymentReceipt[];
  orderStatusHistory: OrderStatusHistoryEntry[];
  auditLogs: AuditLog[];
  customerPriceLists: CustomerPriceList[];
  paperCategories?: PaperCategoryDefinition[];
  paperSizes?: PaperSizePreset[];
  purchaseRequisitions?: PurchaseRequisition[];
  supplierQuotations?: SupplierQuotationComparison[];
  goodsReceiptNotes?: GoodsReceiptNote[];
  threeWayMatches?: ThreeWayMatch[];
  purchaseReturns?: PurchaseReturn[];
  importShipments?: ImportShipment[];
  landedCostCalculations?: LandedCostCalculation[];
  supplierPayments?: SupplierPayment[];
}

class DataStore {
  private db: DBStructure;
  private purchaseStore: PurchaseStore;

  constructor() {
    this.db = this.loadData();
    this.purchaseStore = new PurchaseStore(this.db, () => this.saveData());
  }

  private loadData(): DBStructure {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed: any = JSON.parse(raw);
        
        // Ensure Users migration & validation without overwriting saved data
        if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
          parsed.users = parsed.users.map((rawU: any) => {
            let username = (rawU.username || rawU.loginId || 'user').toString().trim().toLowerCase();
            let email = (rawU.email || '').toString().trim().toLowerCase();
            let role = rawU.role || 'sales';
            // Default demo system roles should remain ACTIVE
            const isStandardRole = ['admin', 'manager', 'sales', 'inventory', 'accounts', 'distributor', 'customer'].includes(username) || role === 'admin';
            let status = isStandardRole ? 'ACTIVE' : (rawU.status || 'ACTIVE');

            let passwordHash = rawU.passwordHash;
            let passwordSalt = rawU.passwordSalt;

            if (!passwordHash || !passwordSalt) {
              const defaultPass = role === 'admin' ? '929248' : '123456';
              const creds = hashPassword(defaultPass);
              passwordHash = creds.hash;
              passwordSalt = creds.salt;
            }

            return {
              id: rawU.id || `usr-${Date.now()}`,
              name: rawU.name || 'User',
              username: username,
              email: email,
              role: role,
              status: status,
              partyId: rawU.partyId,
              partyName: rawU.partyName,
              distributorTier: rawU.distributorTier,
              customDiscountPct: rawU.customDiscountPct,
              passwordHash,
              passwordSalt,
              createdAt: rawU.createdAt || new Date().toISOString(),
              updatedAt: rawU.updatedAt || new Date().toISOString(),
              avatar: rawU.avatar
            } as StoredUser;
          });

          // Ensure all standard system users are present and active
          DEFAULT_USERS.forEach(defU => {
            const existing = parsed.users.find((u: any) => u.username === defU.username);
            if (!existing) {
              parsed.users.push(defU);
            } else {
              existing.status = 'ACTIVE';
              if (defU.username === 'admin') {
                if (!existing.email || existing.email === 'arjdnk99@abppl.com') {
                  existing.email = 'arjdnk99@gmail.com';
                }
              }
            }
          });
        } else {
          parsed.users = DEFAULT_USERS;
        }

        // Migration for unified parties
        if (!parsed.parties || !Array.isArray(parsed.parties)) {
          parsed.parties = [];
          if (parsed.customers && Array.isArray(parsed.customers)) {
            parsed.customers.forEach((c: any) => {
              parsed.parties.push({
                id: c.id,
                partyType: 'CUSTOMER',
                name: c.name,
                companyName: c.companyName || c.name,
                contactPerson: c.name,
                phone: c.phone || '',
                email: c.email || '',
                address: c.address || '',
                city: c.city || 'Mumbai',
                state: c.state || 'Maharashtra',
                pincode: c.pincode || '400001',
                gstin: c.gstin || '',
                creditLimit: c.creditLimit || 500000,
                openingBalance: 0,
                balanceType: 'RECEIVABLE',
                paymentTerms: 'Net 30 Days',
                outstandingBalance: c.outstandingBalance || 0,
                status: c.status || 'ACTIVE',
                createdAt: c.createdAt || new Date().toISOString()
              });
            });
          }
          if (parsed.suppliers && Array.isArray(parsed.suppliers)) {
            parsed.suppliers.forEach((s: any) => {
              if (!parsed.parties.find((p: any) => p.id === s.id)) {
                parsed.parties.push({
                  id: s.id,
                  partyType: 'SUPPLIER',
                  name: s.name,
                  companyName: s.companyName || s.name,
                  contactPerson: s.name,
                  phone: s.phone || '',
                  email: s.email || '',
                  address: s.address || '',
                  city: s.city || 'Mumbai',
                  state: s.state || 'Maharashtra',
                  pincode: s.pincode || '400001',
                  gstin: s.gstin || '',
                  creditLimit: 2000000,
                  openingBalance: 0,
                  balanceType: 'PAYABLE',
                  paymentTerms: 'Net 30 Days',
                  outstandingBalance: s.outstandingBalance || 0,
                  status: s.status || 'ACTIVE',
                  createdAt: s.createdAt || new Date().toISOString()
                });
              }
            });
          }
        }

        if (!parsed.transporters || !Array.isArray(parsed.transporters)) {
          parsed.transporters = DEFAULT_TRANSPorters;
        }

        if (!parsed.freights || !Array.isArray(parsed.freights)) {
          parsed.freights = DEFAULT_FREIGHTS;
        }

        if (!parsed.warehouses || !Array.isArray(parsed.warehouses) || parsed.warehouses.length === 0) {
          parsed.warehouses = DEFAULT_WAREHOUSES;
        }

        if (!parsed.stockTransfers || !Array.isArray(parsed.stockTransfers)) {
          parsed.stockTransfers = DEFAULT_STOCK_TRANSFERS;
        }

        if (!parsed.stockAdjustments || !Array.isArray(parsed.stockAdjustments)) {
          parsed.stockAdjustments = DEFAULT_STOCK_ADJUSTMENTS;
        }

        if (!parsed.stockReservations || !Array.isArray(parsed.stockReservations)) {
          parsed.stockReservations = DEFAULT_STOCK_RESERVATIONS;
        }

        if (!parsed.stockMovements || !Array.isArray(parsed.stockMovements) || parsed.stockMovements.length === 0) {
          parsed.stockMovements = DEFAULT_STOCK_MOVEMENTS;
        }

        if (!parsed.salesOrders || !Array.isArray(parsed.salesOrders) || parsed.salesOrders.length === 0) {
          parsed.salesOrders = DEFAULT_SALES_ORDERS;
        }

        if (!parsed.deliveries || !Array.isArray(parsed.deliveries)) {
          parsed.deliveries = DEFAULT_DELIVERIES;
        }

        if (!parsed.receipts || !Array.isArray(parsed.receipts)) {
          parsed.receipts = DEFAULT_RECEIPTS;
        }

        if (!parsed.orderStatusHistory || !Array.isArray(parsed.orderStatusHistory)) {
          parsed.orderStatusHistory = DEFAULT_ORDER_STATUS_HISTORY;
        }

        if (!parsed.auditLogs || !Array.isArray(parsed.auditLogs)) {
          parsed.auditLogs = DEFAULT_AUDIT_LOGS;
        }

        if (!parsed.customerPriceLists || !Array.isArray(parsed.customerPriceLists)) {
          parsed.customerPriceLists = DEFAULT_PRICE_LISTS;
        }

        if (!parsed.paperCategories || !Array.isArray(parsed.paperCategories) || parsed.paperCategories.length === 0) {
          parsed.paperCategories = DEFAULT_PAPER_CATEGORIES;
        }

        if (!parsed.paperSizes || !Array.isArray(parsed.paperSizes) || parsed.paperSizes.length === 0) {
          parsed.paperSizes = DEFAULT_PAPER_SIZES;
        }

        return parsed as DBStructure;
      }
    } catch (err) {
      console.error('Error reading database file, resetting to default seed:', err);
    }

    // Default structure if file does not exist
    const defaultDb: DBStructure = {
      settings: DEFAULT_COMPANY_SETTINGS,
      users: DEFAULT_USERS,
      parties: DEFAULT_PARTIES,
      products: DEFAULT_PRODUCTS,
      warehouses: DEFAULT_WAREHOUSES,
      stockTransfers: DEFAULT_STOCK_TRANSFERS,
      stockAdjustments: DEFAULT_STOCK_ADJUSTMENTS,
      stockReservations: DEFAULT_STOCK_RESERVATIONS,
      stockMovements: DEFAULT_STOCK_MOVEMENTS,
      transporters: DEFAULT_TRANSPorters,
      freights: DEFAULT_FREIGHTS,
      salesOrders: DEFAULT_SALES_ORDERS,
      invoices: DEFAULT_INVOICES,
      purchases: DEFAULT_PURCHASES,
      payments: DEFAULT_PAYMENTS,
      deliveries: DEFAULT_DELIVERIES,
      receipts: DEFAULT_RECEIPTS,
      orderStatusHistory: DEFAULT_ORDER_STATUS_HISTORY,
      auditLogs: DEFAULT_AUDIT_LOGS,
      customerPriceLists: DEFAULT_PRICE_LISTS,
      paperCategories: DEFAULT_PAPER_CATEGORIES,
      paperSizes: DEFAULT_PAPER_SIZES
    };

    this.saveData(defaultDb);
    return defaultDb;
  }

  private saveData(data?: DBStructure) {
    try {
      const dataToSave = data || this.db;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database file:', err);
    }
  }

  // --- Settings ---
  getSettings(): CompanySettings {
    return this.db.settings;
  }

  updateSettings(settings: Partial<CompanySettings>): CompanySettings {
    this.db.settings = { ...this.db.settings, ...settings };
    this.saveData();
    return this.db.settings;
  }

  // --- Users ---
  getUsers(): StoredUser[] {
    return this.db.users;
  }

  getStoredUserById(id: string): StoredUser | undefined {
    return this.db.users.find(u => u.id === id);
  }

  findUserByLoginIdOrEmail(identifier: string): StoredUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    
    // 1. Direct username or email exact match
    const directMatch = this.db.users.find(u => 
      u.username.toLowerCase() === clean || 
      u.email.toLowerCase() === clean
    );
    if (directMatch) return directMatch;

    // 2. Specific matching for user email variants (e.g. arjdnk99@gmail.com, arjdnk99, arjdnk@abppl.com)
    if (clean === 'arjdnk99@gmail.com' || clean === 'arjdnk99' || clean === 'arjdnk@abppl.com' || clean === 'arjdnk99@abppl.com' || clean === 'admin@abppl.com' || clean === 'administrator') {
      const adminUser = this.db.users.find(u => u.role === 'admin' || u.username === 'admin');
      if (adminUser) return adminUser;
    }

    // 3. Match by standard role name if user typed role as login (e.g., "admin", "manager", "sales", "inventory", "accounts", "distributor", "customer")
    const roleMatch = this.db.users.find(u => u.role.toLowerCase() === clean || u.username.toLowerCase() === clean);
    if (roleMatch) return roleMatch;

    // 4. Match by party name/email for customer/distributor
    const partyUser = this.db.users.find(u => 
      (u.partyName && u.partyName.toLowerCase().includes(clean)) ||
      (u.email && u.email.toLowerCase().includes(clean))
    );
    if (partyUser) return partyUser;

    // 5. Partial username / name match
    return this.db.users.find(u => u.username.toLowerCase().includes(clean) || u.name.toLowerCase().includes(clean));
  }

  createUser(userData: Partial<User> & { password?: string }): StoredUser {
    const { name, username, email, role, status = 'ACTIVE', password = '123456' } = userData;

    if (!username || !email) {
      throw new Error('Username and Email are required');
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = this.db.users.find(
      u => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      throw new Error('User with this Username or Email already exists');
    }

    const { hash, salt } = hashPassword(password);

    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      name: name || 'New User',
      username: cleanUser,
      email: cleanEmail,
      role: role || 'sales',
      status: status,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.users.push(newUser);
    this.saveData();
    return newUser;
  }

  updateUser(id: string, userData: Partial<User> & { password?: string }): StoredUser {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new Error('User not found');
    }

    const current = this.db.users[idx];

    // Protect last remaining active administrator
    if (current.role === 'admin') {
      const willDemote = userData.role && userData.role !== 'admin';
      const willDeactivate = userData.status && userData.status === 'INACTIVE';
      if (willDemote || willDeactivate) {
        const otherActiveAdmins = this.db.users.filter(u => u.id !== id && u.role === 'admin' && u.status === 'ACTIVE');
        if (otherActiveAdmins.length === 0) {
          throw new Error('Cannot demote or deactivate the only remaining active Administrator.');
        }
      }
    }

    if (userData.username || userData.email) {
      const cleanUser = (userData.username || current.username).trim().toLowerCase();
      const cleanEmail = (userData.email || current.email).trim().toLowerCase();

      const existing = this.db.users.find(
        u => u.id !== id && (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail)
      );

      if (existing) {
        throw new Error('Username or Email is already taken by another account');
      }

      current.username = cleanUser;
      current.email = cleanEmail;
    }

    if (userData.name) current.name = userData.name;
    if (userData.role) current.role = userData.role;
    if (userData.status) current.status = userData.status;
    if (userData.avatar !== undefined) current.avatar = userData.avatar;

    if (userData.password && userData.password.trim().length > 0) {
      const { hash, salt } = hashPassword(userData.password.trim());
      current.passwordHash = hash;
      current.passwordSalt = salt;
    }

    current.updatedAt = new Date().toISOString();
    this.db.users[idx] = current;
    this.saveData();
    return current;
  }

  deleteUser(id: string): boolean {
    const userToDelete = this.db.users.find(u => u.id === id);
    if (!userToDelete) return false;

    if (userToDelete.role === 'admin') {
      const otherActiveAdmins = this.db.users.filter(u => u.id !== id && u.role === 'admin' && u.status === 'ACTIVE');
      if (otherActiveAdmins.length === 0) {
        throw new Error('Cannot delete the only remaining active Administrator.');
      }
    }

    const initialLength = this.db.users.length;
    this.db.users = this.db.users.filter(u => u.id !== id);
    if (this.db.users.length !== initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Parties (Unified Customers & Suppliers) ---
  getParties(type?: PartyType): Party[] {
    let list = this.db.parties || [];
    if (type) {
      list = list.filter(p => p.partyType === type || p.partyType === 'BOTH');
    }
    
    // Recalculate outstanding balance based on actual invoices, purchases, payments
    return list.map(party => {
      let calcBalance = party.openingBalance || 0;
      if (party.partyType === 'CUSTOMER' || party.partyType === 'BOTH') {
        const custInvoices = this.db.invoices.filter(i => i.customerId === party.id && i.type === 'INVOICE' && i.status !== 'CANCELLED');
        const custPayments = this.db.payments.filter(p => p.partyType === 'CUSTOMER' && p.partyId === party.id);
        const invSum = custInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
        const paySum = custPayments.reduce((acc, p) => acc + p.amount, 0);
        calcBalance += (invSum - paySum);
      } else if (party.partyType === 'SUPPLIER') {
        const suppPurchases = this.db.purchases.filter(p => p.supplierId === party.id && p.status !== 'CANCELLED');
        const suppPayments = this.db.payments.filter(p => p.partyType === 'SUPPLIER' && p.partyId === party.id);
        const purSum = suppPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
        const paySum = suppPayments.reduce((acc, p) => acc + p.amount, 0);
        calcBalance += (purSum - paySum);
      }
      return {
        ...party,
        outstandingBalance: Math.max(0, calcBalance)
      };
    });
  }

  getPartyById(id: string): Party | undefined {
    return this.getParties().find(p => p.id === id);
  }

  saveParty(partyData: Partial<Party>): Party {
    if (!this.db.parties) this.db.parties = [];

    const now = new Date().toISOString();
    if (partyData.id) {
      const idx = this.db.parties.findIndex(p => p.id === partyData.id);
      if (idx !== -1) {
        const updated: Party = {
          ...this.db.parties[idx],
          ...partyData,
          updatedAt: now
        } as Party;
        this.db.parties[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newParty: Party = {
      id: partyData.id || `prt-${Date.now()}`,
      partyType: partyData.partyType || 'CUSTOMER',
      name: partyData.name || 'New Party',
      companyName: partyData.companyName || partyData.name || 'Company',
      contactPerson: partyData.contactPerson || partyData.name || '',
      phone: partyData.phone || '',
      altPhone: partyData.altPhone || '',
      email: partyData.email || '',
      address: partyData.address || '',
      city: partyData.city || 'Mumbai',
      state: partyData.state || 'Maharashtra',
      pincode: partyData.pincode || '400001',
      gstin: partyData.gstin || '',
      pan: partyData.pan || '',
      creditLimit: partyData.creditLimit || 500000,
      openingBalance: partyData.openingBalance || 0,
      balanceType: partyData.balanceType || (partyData.partyType === 'SUPPLIER' ? 'PAYABLE' : 'RECEIVABLE'),
      paymentTerms: partyData.paymentTerms || 'Net 30 Days',
      bankName: partyData.bankName || '',
      bankAccountNo: partyData.bankAccountNo || '',
      bankIfsc: partyData.bankIfsc || '',
      bankBranch: partyData.bankBranch || '',
      notes: partyData.notes || '',
      status: partyData.status || 'ACTIVE',
      outstandingBalance: partyData.openingBalance || 0,
      createdAt: now,
      updatedAt: now
    };

    this.db.parties.push(newParty);
    this.saveData();
    return newParty;
  }

  deleteParty(id: string): boolean {
    // Check if party has invoices or purchases
    const hasInvoices = this.db.invoices.some(i => i.customerId === id);
    const hasPurchases = this.db.purchases.some(p => p.supplierId === id);

    if (hasInvoices || hasPurchases) {
      // Deactivate instead of hard delete to preserve accounting history
      const party = this.getPartyById(id);
      if (party) {
        this.saveParty({ id, status: 'INACTIVE' });
        return true;
      }
      return false;
    }

    const len = this.db.parties.length;
    this.db.parties = this.db.parties.filter(p => p.id !== id);
    if (this.db.parties.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Legacy customer & supplier compatibility wrappers
  getCustomers(): Customer[] {
    return this.getParties().filter(p => p.partyType === 'CUSTOMER' || p.partyType === 'BOTH');
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getPartyById(id);
  }

  saveCustomer(cust: Partial<Customer>): Customer {
    return this.saveParty({ ...cust, partyType: cust.partyType || 'CUSTOMER' });
  }

  deleteCustomer(id: string): boolean {
    return this.deleteParty(id);
  }

  getSuppliers(): Supplier[] {
    return this.getParties().filter(p => p.partyType === 'SUPPLIER' || p.partyType === 'BOTH');
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.getPartyById(id);
  }

  saveSupplier(supp: Partial<Supplier>): Supplier {
    return this.saveParty({ ...supp, partyType: supp.partyType || 'SUPPLIER' });
  }

  deleteSupplier(id: string): boolean {
    return this.deleteParty(id);
  }

  // --- Transporters ---
  getTransporters(): Transporter[] {
    return this.db.transporters || [];
  }

  getTransporterById(id: string): Transporter | undefined {
    return this.getTransporters().find(t => t.id === id);
  }

  saveTransporter(data: Partial<Transporter>): Transporter {
    if (!this.db.transporters) this.db.transporters = [];

    if (data.id) {
      const idx = this.db.transporters.findIndex(t => t.id === data.id);
      if (idx !== -1) {
        const updated = { ...this.db.transporters[idx], ...data };
        this.db.transporters[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newTransporter: Transporter = {
      id: data.id || `tr-${Date.now()}`,
      name: data.name || 'New Transporter',
      companyName: data.companyName || data.name || 'Transport Co',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      altPhone: data.altPhone || '',
      address: data.address || '',
      city: data.city || 'Mumbai',
      state: data.state || 'Maharashtra',
      gstin: data.gstin || '',
      transporterId: data.transporterId || data.gstin || `TR-${Date.now()}`,
      vehicleNumber: data.vehicleNumber || '',
      freightTerms: data.freightTerms || 'Paid',
      bankDetails: data.bankDetails || '',
      notes: data.notes || '',
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    this.db.transporters.push(newTransporter);
    this.saveData();
    return newTransporter;
  }

  deleteTransporter(id: string): boolean {
    const len = this.db.transporters.length;
    this.db.transporters = this.db.transporters.filter(t => t.id !== id);
    if (this.db.transporters.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Freight Records & Bills ---
  getFreights(): FreightRecord[] {
    return this.db.freights || [];
  }

  saveFreight(data: Partial<FreightRecord>): FreightRecord {
    if (!this.db.freights) this.db.freights = [];

    const now = new Date().toISOString();
    const weightMt = Number(data.weightMt || 0);
    const weightKg = Number(data.weightKg || (weightMt > 0 ? weightMt * 1000 : 0));
    const packagesCount = Number(data.packagesCount || 0);
    const rateType = data.rateType || (data.ratePerMt ? 'PER_MT' : (data.fixedTripRate ? 'FIXED_DELIVERY' : 'FIXED_DELIVERY'));

    // Rate calculations
    let baseFreight = Number(data.baseFreightAmount || 0);
    if (rateType === 'PER_MT' && data.ratePerMt) {
      baseFreight = Number((weightMt * Number(data.ratePerMt)).toFixed(2));
    } else if (rateType === 'PER_KG' && data.ratePerKg) {
      baseFreight = Number((weightKg * Number(data.ratePerKg)).toFixed(2));
    } else if (rateType === 'FIXED_DELIVERY' && data.fixedTripRate) {
      baseFreight = Number(data.fixedTripRate);
    } else if (rateType === 'PER_PACKAGE' && data.ratePerPackage) {
      baseFreight = Number((packagesCount * Number(data.ratePerPackage)).toFixed(2));
    }

    const loading = Number(data.loadingCharges || 0);
    const unloading = Number(data.unloadingCharges || 0);
    const toll = Number(data.tollCharges || 0);
    const detention = Number(data.detentionCharges || 0);
    const doorDel = Number(data.doorDeliveryCharge || 0);
    const ins = Number(data.insuranceCharges || 0);
    const other = Number(data.otherCharges || 0);

    const taxable = baseFreight + loading + unloading + toll + detention + doorDel + ins + other;
    
    // GTA GST
    const gtaScheme = data.gtaGstScheme || 'RCM_5_PERCENT';
    const isRcm = gtaScheme === 'RCM_5_PERCENT';
    let gstRate = Number(data.gstRate ?? (gtaScheme === 'FORWARD_12_PERCENT' ? 12 : (gtaScheme === 'RCM_5_PERCENT' ? 5 : 0)));
    let gstAmount = Number(data.gstAmount || 0);
    if (!isRcm && gstRate > 0) {
      gstAmount = Number(((taxable * gstRate) / 100).toFixed(2));
    }

    // If freightAmount explicitly supplied and > 0, use it, else calculate total
    const computedTotal = isRcm ? taxable : (taxable + gstAmount);
    const amount = Number(data.freightAmount && Number(data.freightAmount) > 0 ? data.freightAmount : (computedTotal > 0 ? computedTotal : 0));
    const paid = Number(data.paidAmount ?? data.advancePaidToDriver ?? 0);
    const due = Math.max(0, amount - paid);

    let paymentStatus = data.paymentStatus;
    if (!paymentStatus) {
      if (due === 0 && amount > 0) paymentStatus = 'PAID';
      else if (paid > 0 && due > 0) paymentStatus = 'PARTIALLY_PAID';
      else paymentStatus = 'UNPAID';
    }

    if (data.id) {
      const idx = this.db.freights.findIndex(f => f.id === data.id);
      if (idx !== -1) {
        const updated: FreightRecord = {
          ...this.db.freights[idx],
          ...data,
          weightMt,
          weightKg,
          packagesCount,
          rateType,
          baseFreightAmount: baseFreight,
          taxableAmount: taxable,
          gstRate,
          gstAmount,
          isRcmApplicable: isRcm,
          freightAmount: amount,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus,
          updatedAt: now
        };
        this.db.freights[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const billSeq = this.db.freights.length + 1;
    const yearCode = '2526';
    const autoBillNo = `FB-${yearCode}-${String(billSeq).padStart(4, '0')}`;

    const newFreight: FreightRecord = {
      id: data.id || `fr-${Date.now()}`,
      billNo: data.billNo || autoBillNo,
      freightType: data.freightType || 'OUTWARD',
      transporterId: data.transporterId || '',
      transporterName: data.transporterName || 'Self Transport',
      transporterGstin: data.transporterGstin || '',
      transporterPhone: data.transporterPhone || '',
      invoiceNo: data.invoiceNo || '',
      purchaseNo: data.purchaseNo || '',
      deliveryChallanNo: data.deliveryChallanNo || '',
      salesOrderNo: data.salesOrderNo || '',
      lrGrNo: data.lrGrNo || `LR-${Date.now().toString().slice(-6)}`,
      lrGrDate: data.lrGrDate || now.split('T')[0],
      vehicleNumber: data.vehicleNumber || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      ewayBillNo: data.ewayBillNo || '',
      consignorName: data.consignorName || 'ABPPL Central Godown',
      consignorCity: data.consignorCity || 'Mumbai',
      consigneeName: data.consigneeName || '',
      consigneeCity: data.consigneeCity || '',
      cargoDescription: data.cargoDescription || '',
      weightMt,
      weightKg,
      packagesCount,
      packageType: data.packageType || 'Reams',
      rateType,
      ratePerMt: data.ratePerMt ? Number(data.ratePerMt) : undefined,
      ratePerKg: data.ratePerKg ? Number(data.ratePerKg) : undefined,
      fixedTripRate: data.fixedTripRate ? Number(data.fixedTripRate) : undefined,
      ratePerPackage: data.ratePerPackage ? Number(data.ratePerPackage) : undefined,
      baseFreightAmount: baseFreight,
      loadingCharges: loading,
      unloadingCharges: unloading,
      tollCharges: toll,
      detentionCharges: detention,
      doorDeliveryCharge: doorDel,
      insuranceCharges: ins,
      otherCharges: other,
      gtaGstScheme: gtaScheme,
      taxableAmount: taxable,
      gstRate,
      gstAmount,
      isRcmApplicable: isRcm,
      freightAmount: amount,
      paidAmount: paid,
      dueAmount: due,
      paidBy: data.paidBy || 'BUYER',
      advancePaidToDriver: data.advancePaidToDriver ? Number(data.advancePaidToDriver) : undefined,
      paymentDate: data.paymentDate,
      paymentMode: data.paymentMode || 'BANK_TRANSFER',
      paymentRefNo: data.paymentRefNo || '',
      paymentStatus,
      deliveryStatus: data.deliveryStatus || 'DISPATCHED',
      podDocumentNo: data.podDocumentNo || '',
      podReceivedDate: data.podReceivedDate || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now
    };

    this.db.freights.push(newFreight);
    this.saveData();
    return newFreight;
  }

  deleteFreight(id: string): boolean {
    const len = this.db.freights.length;
    this.db.freights = this.db.freights.filter(f => f.id !== id);
    if (this.db.freights.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Paper Categories Master ---
  getPaperCategories(): PaperCategoryDefinition[] {
    return this.db.paperCategories || DEFAULT_PAPER_CATEGORIES;
  }

  savePaperCategory(data: Partial<PaperCategoryDefinition>): PaperCategoryDefinition {
    if (!this.db.paperCategories) this.db.paperCategories = [...DEFAULT_PAPER_CATEGORIES];

    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.db.paperCategories.findIndex(c => c.id === data.id);
      if (idx !== -1) {
        const updated = {
          ...this.db.paperCategories[idx],
          ...data
        };
        this.db.paperCategories[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newCat: PaperCategoryDefinition = {
      id: data.id || `cat-${Date.now()}`,
      name: data.name || 'New Paper Category',
      description: data.description || '',
      defaultHsnCode: data.defaultHsnCode || '48025590',
      defaultGstRate: Number(data.defaultGstRate ?? 12),
      standardGsmRange: data.standardGsmRange || '60 - 300 GSM',
      isCustom: true,
      createdAt: now
    };

    this.db.paperCategories.push(newCat);
    this.saveData();
    return newCat;
  }

  deletePaperCategory(id: string): boolean {
    if (!this.db.paperCategories) return false;
    const len = this.db.paperCategories.length;
    this.db.paperCategories = this.db.paperCategories.filter(c => c.id !== id);
    if (this.db.paperCategories.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Paper Size Presets Master ---
  getPaperSizes(): PaperSizePreset[] {
    return this.db.paperSizes || DEFAULT_PAPER_SIZES;
  }

  savePaperSize(data: Partial<PaperSizePreset>): PaperSizePreset {
    if (!this.db.paperSizes) this.db.paperSizes = [...DEFAULT_PAPER_SIZES];

    if (data.id) {
      const idx = this.db.paperSizes.findIndex(s => s.id === data.id);
      if (idx !== -1) {
        const updated = { ...this.db.paperSizes[idx], ...data };
        this.db.paperSizes[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newSize: PaperSizePreset = {
      id: data.id || `sz-${Date.now()}`,
      name: data.name || `${data.width || 0}" × ${data.length || 0}"`,
      width: Number(data.width || 0),
      length: Number(data.length || 0),
      isStandard: Boolean(data.isStandard ?? false)
    };

    this.db.paperSizes.push(newSize);
    this.saveData();
    return newSize;
  }

  deletePaperSize(id: string): boolean {
    if (!this.db.paperSizes) return false;
    const len = this.db.paperSizes.length;
    this.db.paperSizes = this.db.paperSizes.filter(s => s.id !== id);
    if (this.db.paperSizes.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Warehouses ---
  getWarehouses(): Warehouse[] {
    return this.db.warehouses || DEFAULT_WAREHOUSES;
  }

  getWarehouseById(id: string): Warehouse | undefined {
    return this.getWarehouses().find(w => w.id === id || w.code === id);
  }

  saveWarehouse(data: Partial<Warehouse>): Warehouse {
    if (!this.db.warehouses) this.db.warehouses = [...DEFAULT_WAREHOUSES];

    const now = new Date().toISOString();
    if (data.isDefault) {
      this.db.warehouses.forEach(w => {
        w.isDefault = false;
      });
    }

    if (data.id) {
      const idx = this.db.warehouses.findIndex(w => w.id === data.id);
      if (idx !== -1) {
        const updated: Warehouse = {
          ...this.db.warehouses[idx],
          ...data,
          code: data.code?.toUpperCase() || this.db.warehouses[idx].code
        };
        this.db.warehouses[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const count = this.db.warehouses.length + 1;
    const newWh: Warehouse = {
      id: data.id || `wh-${Date.now()}`,
      code: data.code?.toUpperCase() || `WH-${String(count).padStart(3, '0')}`,
      name: data.name || 'New Storage Depot',
      location: data.location || '',
      city: data.city || 'Mumbai',
      state: data.state || 'Maharashtra',
      isDefault: Boolean(data.isDefault || this.db.warehouses.length === 0),
      capacityTon: Number(data.capacityTon || 500),
      managerName: data.managerName || 'Depot Manager',
      contactPhone: data.contactPhone || '',
      status: data.status || 'ACTIVE',
      createdAt: now
    };

    this.db.warehouses.push(newWh);
    this.saveData();
    return newWh;
  }

  deleteWarehouse(id: string): boolean {
    const wh = this.getWarehouseById(id);
    if (!wh) return false;
    if (wh.isDefault) {
      throw new Error('Cannot delete the default central warehouse.');
    }
    const len = this.db.warehouses.length;
    this.db.warehouses = this.db.warehouses.filter(w => w.id !== id);
    if (this.db.warehouses.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Products / Central Inventory ---
  getProducts(): Product[] {
    const warehouses = this.getWarehouses();
    const reservations = this.db.stockReservations || [];
    const movements = this.db.stockMovements || [];

    return (this.db.products || []).map(p => {
      // 1. Calculate active reserved stock for this product
      const activeReservations = reservations.filter(
        r => r.productId === p.id && r.status === 'ACTIVE'
      );
      const calculatedReserved = activeReservations.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
      const reservedStock = calculatedReserved;

      // 2. Physical stock is the actual warehouse physical count
      const physicalStock = Number(p.currentStock ?? p.openingStock ?? 0);

      // 3. Clear formula: Available Stock = Current Physical Stock - Reserved Stock
      const availableStock = Math.max(0, physicalStock - reservedStock);

      // 4. Warehouse-wise distribution calculation
      let warehouseStocks: WarehouseStock[] = [];
      if (p.warehouseStocks && Array.isArray(p.warehouseStocks) && p.warehouseStocks.length > 0) {
        warehouseStocks = p.warehouseStocks.map(ws => {
          const wh = warehouses.find(w => w.id === ws.warehouseId || w.name === ws.warehouseName);
          const whReserved = activeReservations
            .filter(r => r.warehouseId === ws.warehouseId)
            .reduce((s, r) => s + Number(r.quantity || 0), 0);
          const whPhysical = Number(ws.physicalStock || 0);
          return {
            warehouseId: ws.warehouseId,
            warehouseName: wh ? wh.name : ws.warehouseName,
            physicalStock: whPhysical,
            reservedStock: whReserved,
            availableStock: Math.max(0, whPhysical - whReserved),
            rackLocation: ws.rackLocation || p.rackLocation || 'Rack A-01',
            lastUpdated: ws.lastUpdated || p.lastUpdated || new Date().toISOString()
          };
        });
      } else {
        // Fallback: assign to primary warehouse
        const defaultWh = warehouses.find(w => w.isDefault) || warehouses[0] || { id: 'wh-1', name: p.warehouse || 'Central Godown' };
        warehouseStocks = [
          {
            warehouseId: defaultWh.id,
            warehouseName: defaultWh.name,
            physicalStock: physicalStock,
            reservedStock: reservedStock,
            availableStock: availableStock,
            rackLocation: p.rackLocation || 'Rack A-01',
            lastUpdated: p.lastUpdated || new Date().toISOString()
          }
        ];
      }

      // 5. Calculate cumulative transaction metrics
      const prodMovements = movements.filter(m => m.productId === p.id);
      const totalPurchasedStock = prodMovements
        .filter(m => m.type === 'STOCK_IN')
        .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
      const totalSoldStock = prodMovements
        .filter(m => m.type === 'STOCK_OUT')
        .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
      const totalAdjustedStock = prodMovements
        .filter(m => m.type === 'ADJUSTMENT_ADD' || m.type === 'ADJUSTMENT_DEDUCT' || m.type === 'ADJUSTMENT')
        .reduce((sum, m) => {
          if (m.type === 'ADJUSTMENT_ADD') return sum + Number(m.quantity || 0);
          if (m.type === 'ADJUSTMENT_DEDUCT') return sum - Number(m.quantity || 0);
          return sum;
        }, 0);

      // 6. Real-time Status calculation based on Available Stock vs Min Threshold
      const minLevel = Number(p.minStockLevel ?? 20);
      let status: Product['status'] = 'IN_STOCK';
      if (physicalStock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (availableStock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (availableStock <= minLevel) {
        status = 'LOW_STOCK';
      }

      return {
        ...p,
        currentStock: physicalStock,
        physicalStock,
        reservedStock,
        availableStock,
        warehouseStocks,
        totalPurchasedStock,
        totalSoldStock,
        totalAdjustedStock,
        status
      };
    });
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id || p.code === id);
  }

  saveProduct(productData: Partial<Product>, auditUser = 'Admin'): Product {
    if (!this.db.products) this.db.products = [];

    const now = new Date().toISOString();
    const currentStock = Number(productData.currentStock ?? productData.physicalStock ?? productData.openingStock ?? 0);
    const openingStock = Number(productData.openingStock ?? currentStock);
    const minStockLevel = Number(productData.minStockLevel ?? 20);

    if (productData.id) {
      const idx = this.db.products.findIndex(p => p.id === productData.id);
      if (idx !== -1) {
        const currentProd = this.db.products[idx];
        const oldPhysical = Number(currentProd.currentStock ?? 0);

        // Check if physical stock changed directly outside regular voucher flow -> log audit adjustment
        if (productData.currentStock !== undefined && productData.currentStock !== oldPhysical) {
          const delta = productData.currentStock - oldPhysical;
          const isAdd = delta > 0;
          const adjQty = Math.abs(delta);
          this.recordStockMovement({
            productId: currentProd.id,
            productName: currentProd.name,
            productCode: currentProd.code,
            category: currentProd.category,
            gsm: currentProd.gsm,
            sizeInches: currentProd.sizeInches,
            type: isAdd ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_DEDUCT',
            quantity: adjQty,
            unit: currentProd.unit || 'Ream',
            stockBefore: oldPhysical,
            stockAfter: productData.currentStock,
            availableBefore: Math.max(0, oldPhysical - (currentProd.reservedStock || 0)),
            availableAfter: Math.max(0, productData.currentStock - (currentProd.reservedStock || 0)),
            warehouseName: productData.warehouse || currentProd.warehouse || 'Bhiwandi Central Godown',
            referenceDocType: 'ADJUSTMENT_VOUCHER',
            referenceNo: `DIR-UPD-${Date.now().toString().slice(-6)}`,
            reasonCode: 'CYCLE_COUNT_SURPLUS',
            reason: `Direct product master quantity update from ${oldPhysical} to ${productData.currentStock}`,
            performedBy: auditUser,
            performedByRole: 'Admin',
            date: now
          });
        }

        const updated: Product = {
          ...currentProd,
          ...productData,
          openingStock,
          currentStock,
          physicalStock: currentStock,
          minStockLevel,
          lastUpdated: now
        } as Product;

        this.db.products[idx] = updated;
        this.saveData();
        return this.getProductById(updated.id)!;
      }
    }

    const newId = productData.id || `prod-${Date.now()}`;
    const code = productData.code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = productData.name || 'New Paper Product';
    const primaryWarehouse = productData.warehouse || 'Bhiwandi Central Godown';

    const newProd: Product = {
      id: newId,
      name,
      code,
      category: productData.category || 'Kraft Paper',
      paperType: productData.paperType || productData.category || 'Kraft Paper',
      brand: productData.brand || 'Generic Mill',
      gsm: Number(productData.gsm || 80),
      sizeInches: productData.sizeInches || '23x36',
      length: productData.length,
      width: productData.width,
      unit: productData.unit || 'Ream',
      reamWeightKg: productData.reamWeightKg || 10,
      purchaseRate: Number(productData.purchaseRate || productData.ratePerUnit || 1000),
      saleRate: Number(productData.saleRate || productData.ratePerUnit || 1200),
      ratePerUnit: Number(productData.saleRate || productData.ratePerUnit || 1200),
      openingStock,
      currentStock,
      physicalStock: currentStock,
      reservedStock: 0,
      availableStock: currentStock,
      minStockLevel,
      hsnCode: productData.hsnCode || '48041100',
      gstRate: Number(productData.gstRate || 12),
      warehouse: primaryWarehouse,
      rackLocation: productData.rackLocation || 'Rack A-01',
      batchLotNo: productData.batchLotNo || `LOT-${new Date().getFullYear()}`,
      packagingDetails: productData.packagingDetails || '',
      notes: productData.notes || '',
      status: currentStock <= 0 ? 'OUT_OF_STOCK' : (currentStock <= minStockLevel ? 'LOW_STOCK' : 'IN_STOCK'),
      lastUpdated: now
    };

    this.db.products.push(newProd);

    // If opening stock > 0, log audit opening stock movement
    if (openingStock > 0) {
      if (!this.db.stockMovements) this.db.stockMovements = [];
      this.db.stockMovements.unshift({
        id: `mov-${Date.now()}`,
        movementNo: `STK-OB-${Date.now().toString().slice(-5)}`,
        productId: newId,
        productName: name,
        productCode: code,
        category: newProd.category,
        gsm: newProd.gsm,
        sizeInches: newProd.sizeInches,
        type: 'OPENING_STOCK',
        quantity: openingStock,
        unit: newProd.unit,
        stockBefore: 0,
        stockAfter: openingStock,
        availableBefore: 0,
        availableAfter: openingStock,
        warehouseName: primaryWarehouse,
        referenceDocType: 'OPENING_BALANCE',
        referenceNo: 'OB-INITIAL',
        reasonCode: 'OPENING_ENTRY',
        reason: `Initial Opening Stock Setup for ${name}`,
        performedBy: auditUser,
        performedByRole: 'Admin',
        date: now
      });
    }

    this.saveData();
    return this.getProductById(newId)!;
  }

  deleteProduct(id: string): boolean {
    const len = this.db.products.length;
    this.db.products = this.db.products.filter(p => p.id !== id);
    if (this.db.products.length !== len) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Central Inventory Summary ---
  getInventorySummary(): InventorySummary {
    const products = this.getProducts();
    const warehouses = this.getWarehouses();

    let totalPhysicalStock = 0;
    let totalReservedStock = 0;
    let totalAvailableStock = 0;
    let totalValuation = 0;
    let totalReams = 0;
    let totalTons = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalPhysicalStock += (p.physicalStock || 0);
      totalReservedStock += (p.reservedStock || 0);
      totalAvailableStock += (p.availableStock || 0);
      totalValuation += (p.purchaseRate || p.saleRate || 0) * (p.physicalStock || 0);

      if (p.unit === 'Ream' || !p.unit) {
        totalReams += (p.physicalStock || 0);
        if (p.reamWeightKg) {
          totalTons += ((p.physicalStock || 0) * p.reamWeightKg) / 1000;
        }
      } else if (p.unit === 'Ton') {
        totalTons += (p.physicalStock || 0);
      } else if (p.unit === 'Kg') {
        totalTons += (p.physicalStock || 0) / 1000;
      }

      if (p.status === 'LOW_STOCK') lowStockCount++;
      if (p.status === 'OUT_OF_STOCK') outOfStockCount++;
    });

    const warehouseSummaries = warehouses.map(wh => {
      let whPhysical = 0;
      let whReserved = 0;
      let whValuation = 0;
      let itemCount = 0;

      products.forEach(p => {
        const ws = (p.warehouseStocks || []).find(w => w.warehouseId === wh.id || w.warehouseName === wh.name);
        if (ws && ws.physicalStock > 0) {
          whPhysical += ws.physicalStock;
          whReserved += (ws.reservedStock || 0);
          whValuation += (p.purchaseRate || 0) * ws.physicalStock;
          itemCount++;
        }
      });

      return {
        warehouseId: wh.id,
        warehouseCode: wh.code,
        warehouseName: wh.name,
        city: wh.city,
        capacityTon: wh.capacityTon,
        physicalStock: whPhysical,
        reservedStock: whReserved,
        availableStock: Math.max(0, whPhysical - whReserved),
        valuation: whValuation,
        totalValuation: whValuation,
        itemCount,
        occupancyPercent: wh.capacityTon > 0 ? Math.min(100, Math.round((whPhysical * 0.015 / wh.capacityTon) * 100)) : 0
      };
    });

    return {
      totalProducts: products.length,
      totalPhysicalStock,
      totalReservedStock,
      totalAvailableStock,
      totalValuation: Math.round(totalValuation),
      totalReams,
      totalTons: Number(totalTons.toFixed(2)),
      lowStockCount,
      outOfStockCount,
      warehousesCount: warehouses.length,
      warehouseSummaries,
      recentMovementsCount: (this.db.stockMovements || []).length
    };
  }

  // --- Stock Movements / Audit History ---
  getStockMovements(filter?: { productId?: string; warehouseId?: string; type?: string; startDate?: string; endDate?: string }): StockMovement[] {
    let list = this.db.stockMovements || [];
    if (filter) {
      if (filter.productId) list = list.filter(m => m.productId === filter.productId);
      if (filter.warehouseId) list = list.filter(m => m.warehouseId === filter.warehouseId || m.fromWarehouse === filter.warehouseId);
      if (filter.type) list = list.filter(m => m.type === filter.type);
      if (filter.startDate) list = list.filter(m => m.date >= filter.startDate!);
      if (filter.endDate) list = list.filter(m => m.date <= filter.endDate!);
    }
    return list;
  }

  recordStockMovement(movData: Partial<StockMovement>): StockMovement {
    if (!this.db.stockMovements) this.db.stockMovements = [];

    const product = this.db.products?.find(p => p.id === movData.productId);
    if (!product) {
      throw new Error('Product not found for stock movement');
    }

    const qty = Number(movData.quantity || 0);
    if (qty <= 0) {
      throw new Error('Movement quantity must be greater than zero');
    }

    if (!movData.referenceNo || movData.referenceNo.trim() === '') {
      throw new Error('Every stock movement requires a valid source/reference document number.');
    }

    if (!movData.reason || movData.reason.trim() === '') {
      throw new Error('Every stock movement requires an explicit reason.');
    }

    const currentStock = Number(product.currentStock || 0);
    const reservedStock = Number(product.reservedStock || 0);
    let newCurrentStock = currentStock;

    // Apply movement logic strictly
    const movType = movData.type || 'STOCK_IN';
    if (movType === 'STOCK_IN' || movType === 'TRANSFER_IN' || movType === 'ADJUSTMENT_ADD' || movType === 'OPENING_STOCK') {
      newCurrentStock = currentStock + qty;
    } else if (movType === 'STOCK_OUT' || movType === 'TRANSFER_OUT' || movType === 'ADJUSTMENT_DEDUCT') {
      newCurrentStock = Math.max(0, currentStock - qty);
    } else if (movType === 'ADJUSTMENT') {
      newCurrentStock = qty;
    }

    product.currentStock = newCurrentStock;
    product.physicalStock = newCurrentStock;
    product.availableStock = Math.max(0, newCurrentStock - reservedStock);
    product.lastUpdated = new Date().toISOString();

    const count = this.db.stockMovements.length + 45;
    const year = new Date().getFullYear();
    const movementNo = movData.movementNo || `STK-${year}-${String(count).padStart(4, '0')}`;

    const movement: StockMovement = {
      id: movData.id || `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      movementNo,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: movType,
      quantity: qty,
      unit: product.unit || 'Ream',
      stockBefore: currentStock,
      stockAfter: newCurrentStock,
      availableBefore: Math.max(0, currentStock - reservedStock),
      availableAfter: Math.max(0, newCurrentStock - reservedStock),
      warehouseId: movData.warehouseId,
      warehouseName: movData.warehouseName || movData.toWarehouse || movData.fromWarehouse || product.warehouse || 'Central Godown',
      fromWarehouse: movData.fromWarehouse,
      toWarehouse: movData.toWarehouse,
      targetWarehouseId: movData.targetWarehouseId,
      targetWarehouseName: movData.targetWarehouseName,
      referenceDocType: movData.referenceDocType || 'MANUAL_ADJUSTMENT',
      referenceNo: movData.referenceNo,
      reasonCode: movData.reasonCode || 'OTHER',
      reason: movData.reason,
      performedBy: movData.performedBy || 'Inventory Controller',
      performedByRole: movData.performedByRole || 'Staff',
      batchLotNo: movData.batchLotNo || product.batchLotNo,
      date: movData.date || new Date().toISOString()
    };

    this.db.stockMovements.unshift(movement);
    this.saveData();
    return movement;
  }

  // --- Stock Transfers (Warehouse to Warehouse) ---
  getStockTransfers(): StockTransfer[] {
    return this.db.stockTransfers || [];
  }

  createStockTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    referenceDocNo?: string;
    reason: string;
    transporterName?: string;
    vehicleNo?: string;
    notes?: string;
    performedBy: string;
  }): StockTransfer {
    if (!this.db.stockTransfers) this.db.stockTransfers = [];

    const fromWh = this.getWarehouseById(data.fromWarehouseId);
    const toWh = this.getWarehouseById(data.toWarehouseId);
    const product = this.getProductById(data.productId);

    if (!fromWh) throw new Error('Source warehouse not found');
    if (!toWh) throw new Error('Destination warehouse not found');
    if (fromWh.id === toWh.id) throw new Error('Source and destination warehouses cannot be the same');
    if (!product) throw new Error('Product not found');

    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error('Transfer quantity must be greater than zero');
    if (product.availableStock < qty) {
      throw new Error(`Insufficient available stock in product. Requested: ${qty}, Available: ${product.availableStock}`);
    }

    const now = new Date().toISOString();
    const count = this.db.stockTransfers.length + 1;
    const transferNo = `ABPPL/TRF/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${String(count).padStart(3, '0')}`;
    const refDoc = data.referenceDocNo || `CHALLAN-TRF-${String(count).padStart(3, '0')}`;

    // 1. Log Transfer Out from Source Warehouse
    this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: 'TRANSFER_OUT',
      quantity: qty,
      unit: product.unit,
      warehouseId: fromWh.id,
      warehouseName: fromWh.name,
      targetWarehouseId: toWh.id,
      targetWarehouseName: toWh.name,
      fromWarehouse: fromWh.name,
      toWarehouse: toWh.name,
      referenceDocType: 'WAREHOUSE_TRANSFER',
      referenceNo: transferNo,
      reasonCode: 'INTER_GODOWN_TRANSFER',
      reason: `Transfer Out to ${toWh.name}. ${data.reason}`,
      performedBy: data.performedBy,
      performedByRole: 'Warehouse Supervisor',
      date: now
    });

    // 2. Log Transfer In to Destination Warehouse
    this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: 'TRANSFER_IN',
      quantity: qty,
      unit: product.unit,
      warehouseId: toWh.id,
      warehouseName: toWh.name,
      targetWarehouseId: fromWh.id,
      targetWarehouseName: fromWh.name,
      fromWarehouse: fromWh.name,
      toWarehouse: toWh.name,
      referenceDocType: 'WAREHOUSE_TRANSFER',
      referenceNo: transferNo,
      reasonCode: 'INTER_GODOWN_TRANSFER',
      reason: `Transfer In from ${fromWh.name}. ${data.reason}`,
      performedBy: data.performedBy,
      performedByRole: 'Warehouse Supervisor',
      date: now
    });

    const transfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNo,
      date: now,
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: qty,
      unit: product.unit,
      referenceDocNo: refDoc,
      reason: data.reason,
      status: 'COMPLETED',
      transporterName: data.transporterName,
      vehicleNo: data.vehicleNo,
      notes: data.notes,
      performedBy: data.performedBy,
      createdAt: now
    };

    this.db.stockTransfers.unshift(transfer);
    this.saveData();
    return transfer;
  }

  // --- Stock Adjustments (Cycle Count / Damage / Audit) ---
  getStockAdjustments(): StockAdjustment[] {
    return this.db.stockAdjustments || [];
  }

  createStockAdjustment(data: {
    warehouseId: string;
    productId: string;
    adjustmentType: 'ADD' | 'DEDUCT';
    quantity: number;
    reasonCode: StockAdjustment['reasonCode'];
    referenceDocNo: string;
    remarks: string;
    physicalCountedQty?: number;
    performedBy: string;
  }): StockAdjustment {
    if (!this.db.stockAdjustments) this.db.stockAdjustments = [];

    const warehouse = this.getWarehouseById(data.warehouseId);
    const product = this.getProductById(data.productId);

    if (!warehouse) throw new Error('Warehouse not found');
    if (!product) throw new Error('Product not found');

    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error('Adjustment quantity must be greater than zero');
    if (!data.referenceDocNo || data.referenceDocNo.trim() === '') {
      throw new Error('Reference document / Voucher number is required for all adjustments');
    }

    if (data.adjustmentType === 'DEDUCT' && product.physicalStock < qty) {
      throw new Error(`Cannot deduct ${qty} ${product.unit}. Current physical stock is only ${product.physicalStock} ${product.unit}.`);
    }

    const now = new Date().toISOString();
    const count = this.db.stockAdjustments.length + 1;
    const adjustmentNo = `ABPPL/ADJ/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${String(count).padStart(3, '0')}`;
    const sysBefore = product.physicalStock;
    const sysAfter = data.adjustmentType === 'ADD' ? (sysBefore + qty) : (sysBefore - qty);

    const movType: StockMovementType = data.adjustmentType === 'ADD' ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_DEDUCT';

    // Record adjustment audit movement
    this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: movType,
      quantity: qty,
      unit: product.unit,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      referenceDocType: 'ADJUSTMENT_VOUCHER',
      referenceNo: data.referenceDocNo,
      reasonCode: data.reasonCode,
      reason: `Stock Adjustment (${data.adjustmentType}): ${data.remarks}`,
      performedBy: data.performedBy,
      performedByRole: 'Auditor',
      date: now
    });

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustmentNo,
      date: now,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      adjustmentType: data.adjustmentType,
      quantity: qty,
      unit: product.unit,
      reasonCode: data.reasonCode,
      referenceDocNo: data.referenceDocNo,
      remarks: data.remarks,
      physicalCountedQty: data.physicalCountedQty ?? (data.adjustmentType === 'ADD' ? sysAfter : sysAfter),
      systemQtyBefore: sysBefore,
      systemQtyAfter: sysAfter,
      performedBy: data.performedBy,
      createdAt: now
    };

    this.db.stockAdjustments.unshift(adjustment);
    this.saveData();
    return adjustment;
  }

  // --- Stock Reservations (Order / Booking Hold) ---
  getStockReservations(): StockReservation[] {
    return this.db.stockReservations || [];
  }

  createStockReservation(data: {
    productId: string;
    warehouseId?: string;
    quantity: number;
    salesOrderRef: string;
    customerName: string;
    notes?: string;
    reservedBy: string;
  }): StockReservation {
    if (!this.db.stockReservations) this.db.stockReservations = [];

    const product = this.getProductById(data.productId);
    if (!product) throw new Error('Product not found');

    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error('Reservation quantity must be greater than zero');
    if (product.availableStock < qty) {
      throw new Error(`Insufficient available stock to reserve. Requested: ${qty}, Available: ${product.availableStock} (Physical: ${product.physicalStock}, Already Reserved: ${product.reservedStock})`);
    }

    const warehouse = data.warehouseId ? this.getWarehouseById(data.warehouseId) : (this.getWarehouses().find(w => w.isDefault) || this.getWarehouses()[0]);
    const whName = warehouse ? warehouse.name : (product.warehouse || 'Central Godown');

    const now = new Date().toISOString();
    const count = this.db.stockReservations.length + 1;
    const reservationNo = `ABPPL/RES/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${String(count).padStart(3, '0')}`;

    const reservation: StockReservation = {
      id: `res-${Date.now()}`,
      reservationNo,
      date: now,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      warehouseId: warehouse?.id || 'wh-1',
      warehouseName: whName,
      quantity: qty,
      unit: product.unit,
      salesOrderRef: data.salesOrderRef,
      customerName: data.customerName,
      status: 'ACTIVE',
      notes: data.notes,
      reservedBy: data.reservedBy,
      createdAt: now
    };

    this.db.stockReservations.unshift(reservation);

    // Record RESERVE audit movement
    if (!this.db.stockMovements) this.db.stockMovements = [];
    this.db.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      movementNo: `STK-RES-${Date.now().toString().slice(-5)}`,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: 'RESERVE',
      quantity: qty,
      unit: product.unit,
      stockBefore: product.physicalStock,
      stockAfter: product.physicalStock,
      availableBefore: product.availableStock,
      availableAfter: Math.max(0, product.availableStock - qty),
      warehouseId: warehouse?.id,
      warehouseName: whName,
      referenceDocType: 'SALES_RESERVATION',
      referenceNo: data.salesOrderRef || reservationNo,
      reasonCode: 'RESERVATION_HOLD',
      reason: `Stock Reserved for ${data.customerName} Order #${data.salesOrderRef}`,
      performedBy: data.reservedBy,
      performedByRole: 'Sales Executive',
      date: now
    });

    this.saveData();
    return reservation;
  }

  releaseStockReservation(id: string, action: 'FULFILLED' | 'CANCELLED', reason?: string): boolean {
    const res = (this.db.stockReservations || []).find(r => r.id === id);
    if (!res) throw new Error('Reservation not found');
    if (res.status !== 'ACTIVE') throw new Error(`Reservation is already marked as ${res.status}`);

    res.status = action;
    const now = new Date().toISOString();

    const product = this.getProductById(res.productId);
    if (product) {
      if (!this.db.stockMovements) this.db.stockMovements = [];
      this.db.stockMovements.unshift({
        id: `mov-${Date.now()}`,
        movementNo: `STK-UNRES-${Date.now().toString().slice(-5)}`,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        gsm: product.gsm,
        sizeInches: product.sizeInches,
        type: 'UNRESERVE',
        quantity: res.quantity,
        unit: res.unit,
        stockBefore: product.physicalStock,
        stockAfter: product.physicalStock,
        availableBefore: product.availableStock,
        availableAfter: product.availableStock + res.quantity,
        warehouseId: res.warehouseId,
        warehouseName: res.warehouseName,
        referenceDocType: 'SALES_RESERVATION',
        referenceNo: res.reservationNo,
        reasonCode: 'RESERVATION_RELEASE',
        reason: `Stock Reservation Released (${action}) for ${res.customerName}. ${reason || ''}`,
        performedBy: 'Sales / Inventory Dept',
        performedByRole: 'Manager',
        date: now
      });
    }

    this.saveData();
    return true;
  }

  // --- Opening Stock Adjuster ---
  updateOpeningStock(data: {
    productId: string;
    openingStock: number;
    warehouseId?: string;
    referenceNo?: string;
    remarks?: string;
    performedBy?: string;
  }): Product {
    const product = this.getProductById(data.productId);
    if (!product) throw new Error('Product not found');

    const newOpening = Number(data.openingStock);
    if (newOpening < 0) throw new Error('Opening stock cannot be negative');

    const oldOpening = Number(product.openingStock || 0);
    const delta = newOpening - oldOpening;
    const oldPhysical = Number(product.physicalStock || product.currentStock || 0);
    const newPhysical = Math.max(0, oldPhysical + delta);

    const warehouse = data.warehouseId ? this.getWarehouseById(data.warehouseId) : (this.getWarehouses().find(w => w.isDefault) || this.getWarehouses()[0]);
    const whName = warehouse ? warehouse.name : (product.warehouse || 'Central Godown');
    const now = new Date().toISOString();

    const rawProd = this.db.products?.find(p => p.id === data.productId);
    if (rawProd) {
      rawProd.openingStock = newOpening;
      rawProd.currentStock = newPhysical;
      rawProd.physicalStock = newPhysical;
      rawProd.lastUpdated = now;
    }

    this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      gsm: product.gsm,
      sizeInches: product.sizeInches,
      type: 'OPENING_STOCK',
      quantity: Math.abs(delta) || newOpening,
      unit: product.unit,
      stockBefore: oldPhysical,
      stockAfter: newPhysical,
      warehouseId: warehouse?.id,
      warehouseName: whName,
      referenceDocType: 'OPENING_BALANCE',
      referenceNo: data.referenceNo || 'OB-ADJUSTMENT',
      reasonCode: 'OPENING_ENTRY',
      reason: data.remarks || `Opening stock adjusted from ${oldOpening} to ${newOpening}`,
      performedBy: data.performedBy || 'Admin Auditor',
      performedByRole: 'Admin',
      date: now
    });

    this.saveData();
    return this.getProductById(product.id)!;
  }

  // =========================================================================
  // --- Purchase & Import Management Module ---
  // =========================================================================
  
  // Purchase Requisitions
  getPurchaseRequisitions(filter?: { status?: string; priority?: string; search?: string }): PurchaseRequisition[] {
    return this.purchaseStore.getPurchaseRequisitions(filter);
  }

  getPurchaseRequisitionById(id: string): PurchaseRequisition | undefined {
    return this.purchaseStore.getPurchaseRequisitionById(id);
  }

  savePurchaseRequisition(data: Partial<PurchaseRequisition>, user?: any): PurchaseRequisition {
    return this.purchaseStore.savePurchaseRequisition(data, user);
  }

  approvePurchaseRequisition(id: string, user?: any): PurchaseRequisition {
    return this.purchaseStore.approvePurchaseRequisition(id, user);
  }

  rejectPurchaseRequisition(id: string, reason: string, user?: any): PurchaseRequisition {
    return this.purchaseStore.rejectPurchaseRequisition(id, reason, user);
  }

  // Supplier Quotations (RFQ Comparison)
  getSupplierQuotations(filter?: { status?: string; search?: string }): SupplierQuotationComparison[] {
    return this.purchaseStore.getSupplierQuotations(filter);
  }

  saveSupplierQuotation(data: Partial<SupplierQuotationComparison>, user?: any): SupplierQuotationComparison {
    return this.purchaseStore.saveSupplierQuotation(data, user);
  }

  selectSupplierQuote(comparisonId: string, supplierId: string, decisionNotes: string, user?: any): SupplierQuotationComparison {
    return this.purchaseStore.selectSupplierQuote(comparisonId, supplierId, decisionNotes, user);
  }

  // Purchase Orders
  getPurchases(filter?: { supplierId?: string; status?: string; isImport?: boolean; approvalStatus?: string; search?: string }): PurchaseOrder[] {
    return this.purchaseStore.getPurchases(filter);
  }

  getPurchaseById(id: string): PurchaseOrder | undefined {
    return this.purchaseStore.getPurchaseById(id);
  }

  savePurchase(poData: Partial<PurchaseOrder>, user?: any): PurchaseOrder {
    return this.purchaseStore.savePurchase(poData, user);
  }

  approvePurchaseOrder(id: string, user?: any): PurchaseOrder {
    return this.purchaseStore.approvePurchaseOrder(id, user);
  }

  rejectPurchaseOrder(id: string, reason: string, user?: any): PurchaseOrder {
    return this.purchaseStore.rejectPurchaseOrder(id, reason, user);
  }

  cancelPurchase(id: string, user?: any): boolean {
    const po = this.getPurchaseById(id);
    if (!po) return false;
    po.status = 'CANCELLED';
    this.saveData();
    return true;
  }

  // Goods Receipt Notes (GRN) & Warehouse Stock Receipt
  getGoodsReceiptNotes(filter?: { poId?: string; status?: string; search?: string }): GoodsReceiptNote[] {
    return this.purchaseStore.getGoodsReceiptNotes(filter);
  }

  getGoodsReceiptNoteById(id: string): GoodsReceiptNote | undefined {
    return this.purchaseStore.getGoodsReceiptNoteById(id);
  }

  saveGoodsReceiptNote(data: Partial<GoodsReceiptNote>, user?: any): GoodsReceiptNote {
    return this.purchaseStore.saveGoodsReceiptNote(data, user);
  }

  confirmGoodsReceiptNote(id: string, user?: any): GoodsReceiptNote {
    return this.purchaseStore.confirmGoodsReceiptNote(id, user);
  }

  // 3-Way Matching (PO vs GRN vs Invoice)
  getThreeWayMatches(filter?: { status?: string; search?: string }): ThreeWayMatch[] {
    return this.purchaseStore.getThreeWayMatches(filter);
  }

  performThreeWayMatch(data: Partial<ThreeWayMatch>, user?: any): ThreeWayMatch {
    return this.purchaseStore.performThreeWayMatch(data, user);
  }

  approveThreeWayMatch(id: string, notes: string, user?: any): ThreeWayMatch {
    return this.purchaseStore.approveThreeWayMatch(id, notes, user);
  }

  // Purchase Returns & Debit Notes
  getPurchaseReturns(filter?: { status?: string; search?: string }): PurchaseReturn[] {
    return this.purchaseStore.getPurchaseReturns(filter);
  }

  savePurchaseReturn(data: Partial<PurchaseReturn>, user?: any): PurchaseReturn {
    return this.purchaseStore.savePurchaseReturn(data, user);
  }

  // Import Shipments
  getImportShipments(filter?: { status?: string; search?: string }): ImportShipment[] {
    return this.purchaseStore.getImportShipments(filter);
  }

  getImportShipmentById(id: string): ImportShipment | undefined {
    return this.purchaseStore.getImportShipmentById(id);
  }

  saveImportShipment(data: Partial<ImportShipment>, user?: any): ImportShipment {
    return this.purchaseStore.saveImportShipment(data, user);
  }

  updateShipmentTimeline(id: string, newStatus: ImportShipment['status'], location: string, description: string, user?: any): ImportShipment {
    return this.purchaseStore.updateShipmentTimeline(id, newStatus, location, description, user);
  }

  // Landed Cost Engine
  getLandedCostCalculations(filter?: { shipmentId?: string; search?: string }): LandedCostCalculation[] {
    return this.purchaseStore.getLandedCostCalculations(filter);
  }

  getLandedCostById(id: string): LandedCostCalculation | undefined {
    return this.purchaseStore.getLandedCostById(id);
  }

  getLandedCostByShipmentId(shipmentId: string): LandedCostCalculation | undefined {
    return this.purchaseStore.getLandedCostByShipmentId(shipmentId);
  }

  saveLandedCostCalculation(data: Partial<LandedCostCalculation>, user?: any): LandedCostCalculation {
    return this.purchaseStore.saveLandedCostCalculation(data, user);
  }

  finalizeLandedCost(id: string, user?: any): LandedCostCalculation {
    return this.purchaseStore.finalizeLandedCost(id, user);
  }

  // Supplier Payments
  getSupplierPayments(filter?: { supplierId?: string; poId?: string; search?: string }): SupplierPayment[] {
    return this.purchaseStore.getSupplierPayments(filter);
  }

  saveSupplierPayment(data: Partial<SupplierPayment>, user?: any): SupplierPayment {
    return this.purchaseStore.saveSupplierPayment(data, user);
  }

  // Purchase Analytics KPI Stats
  getPurchaseStats(): PurchaseStats {
    return this.purchaseStore.getPurchaseStats();
  }

  // --- Sales Orders & B2B Order Lifecycle ---
  getSalesOrders(filter?: { customerId?: string; distributorId?: string; role?: string; status?: string; search?: string }): SalesOrder[] {
    if (!this.db.salesOrders) this.db.salesOrders = [];
    let orders = [...this.db.salesOrders];

    if (filter) {
      if (filter.customerId) {
        orders = orders.filter(o => o.customerId === filter.customerId || o.createdById === filter.customerId);
      }
      if (filter.distributorId) {
        orders = orders.filter(o => o.customerId === filter.distributorId || o.createdById === filter.distributorId || o.distributorId === filter.distributorId);
      }
      if (filter.status && filter.status !== 'ALL') {
        orders = orders.filter(o => o.status === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        orders = orders.filter(o =>
          o.orderNo.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.customerPoNumber && o.customerPoNumber.toLowerCase().includes(q)) ||
          o.items.some(it => it.productName.toLowerCase().includes(q))
        );
      }
    }

    return orders.map(o => {
      // Calculate live balanceDue and statuses if needed
      const paid = Number(o.paidAmount || 0);
      const grand = Number(o.grandTotal || 0);
      const bal = o.balanceDue !== undefined ? o.balanceDue : Math.max(0, grand - paid);
      let pStatus = o.paymentStatus || 'UNPAID';
      if (paid >= grand && grand > 0) pStatus = 'PAID';
      else if (paid > 0) pStatus = 'PARTIAL';

      return {
        ...o,
        balanceDue: bal,
        paymentStatus: pStatus,
        timeline: this.getOrderActivityTimeline(o.id)
      };
    });
  }

  getSalesOrderById(id: string): SalesOrder | undefined {
    const order = this.getSalesOrders().find(o => o.id === id);
    if (!order) return undefined;
    return {
      ...order,
      timeline: this.getOrderActivityTimeline(order.id)
    };
  }

  saveSalesOrder(orderData: Partial<SalesOrder>, currentUser?: any): SalesOrder {
    if (!this.db.salesOrders) this.db.salesOrders = [];
    const now = new Date().toISOString();
    const prefix = this.db.settings.salesOrderPrefix || 'ABPPL/SO/25-26/';
    const count = this.db.salesOrders.length + 14;
    const orderNo = orderData.orderNo || `${prefix}${String(count).padStart(4, '0')}`;

    // Find Party & Credit check
    const party = orderData.customerId ? this.getPartyById(orderData.customerId) : undefined;
    const creditLimit = party ? (party.creditLimit || 500000) : 500000;
    const outstanding = party ? (party.outstandingBalance || 0) : 0;

    // Compute item pricing and stock checks
    const items = (orderData.items || []).map(item => {
      const gsm = Number(item.gsm || 0);
      const size = (item.sizeInches || '').toLowerCase();
      let autoKgs = item.quantityKgs || 0;
      if (!autoKgs && gsm > 0 && size.includes('x')) {
        const parts = size.split('x').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const singleReamKg = (parts[0] * parts[1] * gsm) / 3100;
          autoKgs = Math.round(singleReamKg * Number(item.quantity || 0) * 100) / 100;
        }
      }

      // Check current available stock
      const prod = item.productId ? this.getProductById(item.productId) : undefined;
      const availableStock = prod ? prod.availableStock : 100;
      const physicalStock = prod ? prod.physicalStock : 100;

      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || (prod ? (prod.saleRate || prod.ratePerUnit || 0) : 0));
      const discountPct = Number(item.discountPct || 0);
      const itemBase = quantity * rate;
      const discountAmt = (itemBase * discountPct) / 100;
      const taxableValue = Number((itemBase - discountAmt).toFixed(2));
      const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;
      const gstAmount = Number(((taxableValue * gstRate) / 100).toFixed(2));
      const cgst = Number((gstAmount / 2).toFixed(2));
      const sgst = Number((gstAmount / 2).toFixed(2));
      const igst = 0;
      const netAmount = Number((taxableValue + gstAmount).toFixed(2));

      return {
        ...item,
        quantity,
        dispatchedQty: item.dispatchedQty || 0,
        deliveredQty: item.deliveredQty || 0,
        backOrderQty: item.backOrderQty || Math.max(0, quantity - (item.dispatchedQty || 0)),
        quantityKgs: autoKgs,
        rate,
        discountPct,
        taxableValue,
        gstRate,
        cgst,
        sgst,
        igst,
        gstAmount,
        netAmount,
        availableStock,
        physicalStock
      };
    });

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.rate), 0);
    const discountTotal = items.reduce((sum, it) => sum + ((it.quantity * it.rate * it.discountPct) / 100), 0);
    const taxableAmount = items.reduce((sum, it) => sum + it.taxableValue, 0);
    const gstTotal = items.reduce((sum, it) => sum + it.gstAmount, 0);
    const cgstTotal = items.reduce((sum, it) => sum + it.cgst, 0);
    const sgstTotal = items.reduce((sum, it) => sum + it.sgst, 0);
    const igstTotal = items.reduce((sum, it) => sum + it.igst, 0);
    const freightCharges = Number(orderData.freightCharges || orderData.freightAmount || 0);
    const otherCharges = Number(orderData.otherCharges || 0);
    const grandTotal = Math.round(taxableAmount + gstTotal + freightCharges + otherCharges);

    const isCreditExceeded = (outstanding + grandTotal) > creditLimit;
    const creditWarning = isCreditExceeded
      ? `Total exposure (₹${(outstanding + grandTotal).toLocaleString('en-IN')}) exceeds credit limit of ₹${creditLimit.toLocaleString('en-IN')}`
      : undefined;

    const billTo = orderData.billTo || {
      name: orderData.customerName || (party ? party.name : 'Customer'),
      companyName: orderData.customerName || (party ? party.companyName : 'Customer Company'),
      contactPerson: party ? party.contactPerson : '',
      address: orderData.customerAddress || (party ? party.address : ''),
      city: party ? party.city : 'Mumbai',
      state: party ? party.state : 'Maharashtra',
      stateCode: '27',
      pincode: party ? party.pincode : '400001',
      gstin: orderData.customerGstin || (party ? party.gstin : ''),
      phone: orderData.customerPhone || (party ? party.phone : ''),
      email: orderData.customerEmail || (party ? party.email : '')
    };

    const shipTo = orderData.shipTo || billTo;
    const isNew = !orderData.id || !this.db.salesOrders.some(o => o.id === orderData.id);
    const initialStatus = orderData.status || (currentUser?.role === 'customer' ? 'SUBMITTED' : 'SUBMITTED');

    const newOrder: SalesOrder = {
      id: orderData.id || `so-${Date.now()}`,
      orderNo,
      orderDate: orderData.orderDate || now.split('T')[0],
      expectedDeliveryDate: orderData.expectedDeliveryDate || new Date(Date.now() + 3*24*3600*1000).toISOString().split('T')[0],
      customerId: orderData.customerId || (party ? party.id : ''),
      customerName: orderData.customerName || billTo.companyName || billTo.name,
      customerGstin: orderData.customerGstin || billTo.gstin || '',
      customerPhone: orderData.customerPhone || billTo.phone || '',
      customerEmail: orderData.customerEmail || billTo.email || '',
      customerAddress: orderData.customerAddress || billTo.address || '',
      customerPoNumber: orderData.customerPoNumber || '',
      customerPoDate: orderData.customerPoDate || '',
      paymentTerms: orderData.paymentTerms || (party ? party.paymentTerms : 'Net 30 Days'),
      deliveryDispatchRef: orderData.deliveryDispatchRef || `CH-${now.slice(0,10).replace(/-/g,'')}`,
      dispatchNotes: orderData.dispatchNotes || '',
      deliveryAddress: orderData.deliveryAddress || shipTo.address,
      billTo,
      shipTo,
      transporterId: orderData.transporterId,
      transporterName: orderData.transporterName,
      transporterGovtId: orderData.transporterGovtId,
      vehicleNumber: orderData.vehicleNumber,
      lrGrNo: orderData.lrGrNo,
      lrGrDate: orderData.lrGrDate,
      freightAmount: freightCharges,
      freightPaidBy: orderData.freightPaidBy || 'BUYER',
      items,
      subtotal,
      discountTotal,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      gstTotal,
      freightCharges,
      otherCharges,
      roundOff: grandTotal - (taxableAmount + gstTotal + freightCharges + otherCharges),
      grandTotal,
      paidAmount: Number(orderData.paidAmount || 0),
      balanceDue: grandTotal - Number(orderData.paidAmount || 0),
      status: initialStatus,
      paymentStatus: orderData.paymentStatus || 'UNPAID',
      deliveryStatus: orderData.deliveryStatus || 'PENDING',
      invoiceIds: orderData.invoiceIds || [],
      invoiceNos: orderData.invoiceNos || [],
      deliveryChallanIds: orderData.deliveryChallanIds || [],
      deliveryChallanNos: orderData.deliveryChallanNos || [],
      receiptIds: orderData.receiptIds || [],
      receiptNos: orderData.receiptNos || [],
      notes: orderData.notes || '',
      terms: orderData.terms || this.db.settings.defaultTerms,
      createdById: orderData.createdById || currentUser?.id || 'usr-1',
      createdByName: orderData.createdByName || currentUser?.name || 'Staff',
      createdByRole: orderData.createdByRole || currentUser?.role || 'sales',
      creditCheckPassed: !isCreditExceeded,
      creditWarning,
      createdAt: orderData.createdAt || now,
      updatedAt: now
    };

    if (orderData.id) {
      const idx = this.db.salesOrders.findIndex(o => o.id === orderData.id);
      if (idx !== -1) {
        this.db.salesOrders[idx] = newOrder;
        this.saveData();

        this.recordAuditLog({
          userId: currentUser?.id || 'usr-1',
          userName: currentUser?.name || 'User',
          userRole: currentUser?.role || 'staff',
          action: 'ORDER_UPDATED',
          entityType: 'ORDER',
          entityId: newOrder.id,
          entityNo: newOrder.orderNo,
          details: `Updated Sales Order #${newOrder.orderNo}, status: ${newOrder.status}`
        });

        return newOrder;
      }
    }

    this.db.salesOrders.unshift(newOrder);
    this.saveData();

    // Log creation history & audit
    this.recordOrderStatusHistory({
      orderId: newOrder.id,
      orderNo: newOrder.orderNo,
      fromStatus: 'DRAFT',
      toStatus: newOrder.status,
      action: newOrder.status === 'DRAFT' ? 'Order Draft Saved' : 'Order Placed & Submitted',
      performedBy: currentUser?.name || newOrder.customerName,
      performedByRole: currentUser?.role || 'customer',
      notes: `Order created with ${newOrder.items.length} items. Total: ₹${newOrder.grandTotal.toLocaleString('en-IN')}`
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || newOrder.customerName,
      userRole: currentUser?.role || 'customer',
      action: newOrder.status === 'DRAFT' ? 'ORDER_DRAFTED' : 'ORDER_SUBMITTED',
      entityType: 'ORDER',
      entityId: newOrder.id,
      entityNo: newOrder.orderNo,
      details: `New order submitted with ${newOrder.items.length} items, total ₹${newOrder.grandTotal.toLocaleString('en-IN')}`
    });

    return newOrder;
  }

  approveSalesOrder(orderId: string, currentUser?: any): SalesOrder {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const now = new Date().toISOString();
    const fromStatus = order.status;

    // Reserve stock automatically across items
    const warehouse = this.db.warehouses[0] || { id: 'wh-1', name: 'Bhiwandi Central Godown' };
    order.items.forEach(item => {
      if (item.productId) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.reservedStock = (prod.reservedStock || 0) + item.quantity;
          prod.availableStock = Math.max(0, prod.currentStock - prod.reservedStock);
          this.saveProduct(prod);

          this.createStockReservation({
            productId: prod.id,
            warehouseId: warehouse.id,
            quantity: item.quantity,
            salesOrderRef: order.orderNo,
            customerName: order.customerName,
            notes: `Auto reserved upon order approval #${order.orderNo}`,
            reservedBy: currentUser?.name || 'Admin Team'
          });
        }
      }
    });

    order.status = 'APPROVED';
    order.stockReserved = true;
    order.approvedBy = currentUser?.name || 'Operations Manager';
    order.approvedAt = now;
    order.updatedAt = now;

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus,
      toStatus: 'APPROVED',
      action: 'Order Approved & Stock Reserved',
      performedBy: currentUser?.name || 'Operations Manager',
      performedByRole: currentUser?.role || 'manager',
      notes: `Order approved. Stock reserved in ${warehouse.name}. Ready for warehouse processing.`
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Admin Team',
      userRole: currentUser?.role || 'manager',
      action: 'ORDER_APPROVED',
      entityType: 'ORDER',
      entityId: order.id,
      entityNo: order.orderNo,
      details: `Approved order #${order.orderNo}. Reserved inventory in ${warehouse.name}.`
    });

    return order;
  }

  rejectSalesOrder(orderId: string, reason: string, currentUser?: any): SalesOrder {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const fromStatus = order.status;
    const now = new Date().toISOString();

    // Release reservations if previously reserved
    if (order.stockReserved) {
      order.items.forEach(item => {
        if (item.productId) {
          const prod = this.getProductById(item.productId);
          if (prod) {
            prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - item.quantity);
            prod.availableStock = Math.max(0, prod.currentStock - prod.reservedStock);
            this.saveProduct(prod);
          }
        }
      });
      order.stockReserved = false;
    }

    order.status = 'CANCELLED';
    order.notes = `${order.notes ? order.notes + ' | ' : ''}Rejected: ${reason}`;
    order.updatedAt = now;

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus,
      toStatus: 'CANCELLED',
      action: 'Order Rejected / Cancelled',
      performedBy: currentUser?.name || 'Admin Team',
      performedByRole: currentUser?.role || 'admin',
      notes: `Reason: ${reason}`
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Admin Team',
      userRole: currentUser?.role || 'admin',
      action: 'ORDER_REJECTED',
      entityType: 'ORDER',
      entityId: order.id,
      entityNo: order.orderNo,
      details: `Rejected order #${order.orderNo}. Reason: ${reason}`
    });

    return order;
  }

  packSalesOrder(orderId: string, packingData: { totalPackages: number; packageType?: any; packedBy?: string; notes?: string }, currentUser?: any): SalesOrder {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const fromStatus = order.status;
    const now = new Date().toISOString();

    order.status = 'PACKED';
    order.deliveryStatus = 'PACKED';
    order.updatedAt = now;

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus,
      toStatus: 'PACKED',
      action: `Packed into ${packingData.totalPackages} ${packingData.packageType || 'Packages'}`,
      performedBy: packingData.packedBy || currentUser?.name || 'Warehouse Staff',
      performedByRole: currentUser?.role || 'inventory',
      notes: packingData.notes || 'Moisture-proof wrapping and bundle labeling completed.'
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Warehouse Staff',
      userRole: currentUser?.role || 'inventory',
      action: 'ORDER_PACKED',
      entityType: 'ORDER',
      entityId: order.id,
      entityNo: order.orderNo,
      details: `Packed order #${order.orderNo} into ${packingData.totalPackages} ${packingData.packageType || 'Packages'}`
    });

    return order;
  }

  dispatchSalesOrder(
    orderId: string,
    dispatchData: {
      transporterName: string;
      transporterId?: string;
      vehicleNumber: string;
      lrGrNo: string;
      lrGrDate?: string;
      driverPhone?: string;
      warehouseId?: string;
      warehouseName?: string;
      totalPackages?: number;
      packageType?: any;
      totalWeightKgs?: number;
      deliveryRemarks?: string;
      itemDispatches?: { productId: string; dispatchedQty: number }[];
    },
    currentUser?: any
  ): { order: SalesOrder; deliveryChallan: DeliveryChallan } {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const now = new Date().toISOString();
    const fromStatus = order.status;
    const whId = dispatchData.warehouseId || 'wh-1';
    const whName = dispatchData.warehouseName || 'Bhiwandi Central Godown';

    const dcCount = this.db.deliveries.length + 42;
    const challanNo = `ABPPL/DC/25-26/${String(dcCount).padStart(4, '0')}`;
    const packingSlipNo = `ABPPL/PS/25-26/${String(dcCount).padStart(4, '0')}`;

    let totalWeight = 0;
    let isPartial = false;

    // Process item quantities & stock deduction
    const deliveryItems = order.items.map(it => {
      const dispatchQty = dispatchData.itemDispatches?.find(d => d.productId === it.productId)?.dispatchedQty ?? (it.quantity - (it.dispatchedQty || 0));
      const newDispatched = (it.dispatchedQty || 0) + dispatchQty;
      const backOrder = Math.max(0, it.quantity - newDispatched);
      if (backOrder > 0) isPartial = true;

      it.dispatchedQty = newDispatched;
      it.backOrderQty = backOrder;

      // Deduct warehouse physical stock and release reservation
      if (it.productId) {
        const prod = this.getProductById(it.productId);
        if (prod) {
          prod.currentStock = Math.max(0, prod.currentStock - dispatchQty);
          prod.physicalStock = prod.currentStock;
          prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - dispatchQty);
          prod.availableStock = Math.max(0, prod.currentStock - prod.reservedStock);
          this.saveProduct(prod);

          // Stock movement audit
          this.recordStockMovement({
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            category: prod.category,
            gsm: prod.gsm,
            sizeInches: prod.sizeInches,
            type: 'STOCK_OUT',
            quantity: dispatchQty,
            unit: it.unit || prod.unit,
            warehouseId: whId,
            warehouseName: whName,
            referenceDocType: 'SALES_DISPATCH',
            referenceNo: challanNo,
            reasonCode: 'SALES_ORDER_DISPATCH',
            reason: `Order Dispatch #${order.orderNo} to ${order.customerName} via ${dispatchData.transporterName}`,
            performedBy: currentUser?.name || 'Warehouse Supervisor',
            performedByRole: 'Warehouse Mgr',
            date: now
          });
        }
      }

      const itemWeight = Math.round(((it.quantityKgs || 0) * (dispatchQty / (it.quantity || 1))) * 100) / 100;
      totalWeight += itemWeight;

      return {
        productId: it.productId || '',
        productName: it.productName,
        sizeInches: it.sizeInches,
        gsm: it.gsm,
        orderedQty: it.quantity,
        dispatchedQty: dispatchQty,
        deliveredQty: 0,
        unit: it.unit || 'Ream',
        weightKg: itemWeight
      };
    });

    // Create Delivery Challan
    const deliveryChallan: DeliveryChallan = {
      id: `dc-${Date.now()}`,
      challanNo,
      packingSlipNo,
      orderId: order.id,
      orderNo: order.orderNo,
      invoiceId: order.invoiceIds?.[0],
      invoiceNo: order.invoiceNos?.[0],
      customerId: order.customerId,
      customerName: order.customerName,
      dispatchDate: now.split('T')[0],
      expectedDeliveryDate: order.expectedDeliveryDate,
      transporterName: dispatchData.transporterName,
      transporterId: dispatchData.transporterId,
      vehicleNumber: dispatchData.vehicleNumber,
      lrGrNo: dispatchData.lrGrNo,
      lrGrDate: dispatchData.lrGrDate || now.split('T')[0],
      driverPhone: dispatchData.driverPhone,
      warehouseId: whId,
      warehouseName: whName,
      totalPackages: dispatchData.totalPackages || 1,
      packageType: dispatchData.packageType || 'Bundles',
      totalWeightKgs: dispatchData.totalWeightKgs || Math.round(totalWeight * 100) / 100,
      status: 'IN_TRANSIT',
      items: deliveryItems,
      deliveryRemarks: dispatchData.deliveryRemarks,
      dispatchedBy: currentUser?.name || 'Warehouse Lead',
      createdAt: now
    };

    this.db.deliveries.unshift(deliveryChallan);

    // Update order
    order.status = isPartial ? 'PARTIALLY_DELIVERED' : 'DISPATCHED';
    order.deliveryStatus = 'IN_TRANSIT';
    order.transporterName = dispatchData.transporterName;
    order.vehicleNumber = dispatchData.vehicleNumber;
    order.lrGrNo = dispatchData.lrGrNo;
    order.lrGrDate = dispatchData.lrGrDate || now.split('T')[0];
    order.deliveryChallanIds = [...(order.deliveryChallanIds || []), deliveryChallan.id];
    order.deliveryChallanNos = [...(order.deliveryChallanNos || []), deliveryChallan.challanNo];
    order.updatedAt = now;

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus,
      toStatus: order.status,
      action: `Dispatched via ${dispatchData.transporterName} (Truck #${dispatchData.vehicleNumber})`,
      performedBy: currentUser?.name || 'Warehouse Lead',
      performedByRole: currentUser?.role || 'inventory',
      notes: `Issued Delivery Challan #${challanNo}, LR/GR #${dispatchData.lrGrNo}. Total weight: ${deliveryChallan.totalWeightKgs} Kgs.`
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Warehouse Staff',
      userRole: currentUser?.role || 'inventory',
      action: 'ORDER_DISPATCHED',
      entityType: 'DELIVERY',
      entityId: deliveryChallan.id,
      entityNo: challanNo,
      details: `Dispatched Order #${order.orderNo} on ${dispatchData.vehicleNumber} via ${dispatchData.transporterName}.`
    });

    return { order, deliveryChallan };
  }

  markOrderDelivered(
    orderId: string,
    deliveryData: {
      actualDeliveryDate?: string;
      receivedBy?: string;
      deliveryRemarks?: string;
      receiverSignatureNote?: string;
    },
    currentUser?: any
  ): SalesOrder {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const fromStatus = order.status;
    const now = new Date().toISOString();
    const actualDate = deliveryData.actualDeliveryDate || now.split('T')[0];

    order.status = 'DELIVERED';
    order.deliveryStatus = 'DELIVERED';
    order.actualDeliveryDate = actualDate;
    order.deliveredAt = now;
    order.deliveredBy = deliveryData.receivedBy || 'Customer Receiving Staff';
    order.items.forEach(it => {
      it.deliveredQty = it.dispatchedQty || it.quantity;
      it.backOrderQty = 0;
    });
    order.updatedAt = now;

    // Update associated delivery challan
    const challans = this.db.deliveries.filter(d => d.orderId === orderId);
    challans.forEach(ch => {
      ch.status = 'DELIVERED';
      ch.actualDeliveryDate = actualDate;
      ch.deliveredAt = now;
      ch.receivedBy = deliveryData.receivedBy;
      ch.receiverSignatureNote = deliveryData.receiverSignatureNote;
      ch.deliveryRemarks = deliveryData.deliveryRemarks || ch.deliveryRemarks;
    });

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus,
      toStatus: 'DELIVERED',
      action: `Goods Delivered & Signed by ${deliveryData.receivedBy || 'Customer'}`,
      performedBy: currentUser?.name || 'Transporter / Store Incharge',
      performedByRole: currentUser?.role || 'transporter',
      notes: deliveryData.deliveryRemarks || 'All paper reams/bundles received in clean and undamaged condition.'
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Staff',
      userRole: currentUser?.role || 'admin',
      action: 'ORDER_DELIVERED',
      entityType: 'ORDER',
      entityId: order.id,
      entityNo: order.orderNo,
      details: `Delivered order #${order.orderNo}. Received by: ${deliveryData.receivedBy || 'Customer'}`
    });

    return order;
  }

  cancelSalesOrder(orderId: string, reason: string, currentUser?: any): SalesOrder {
    return this.rejectSalesOrder(orderId, reason, currentUser);
  }

  recordOrderPayment(
    orderId: string,
    paymentData: {
      amount: number;
      paymentDate?: string;
      paymentMode: any;
      referenceNo?: string;
      bankName?: string;
      notes?: string;
    },
    currentUser?: any
  ): { order: SalesOrder; receipt: PaymentReceipt } {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error(`Sales Order with ID ${orderId} not found`);

    const now = new Date().toISOString();
    const pDate = paymentData.paymentDate || now.split('T')[0];
    const amount = Number(paymentData.amount || 0);

    const recCount = this.db.receipts.length + 89;
    const receiptNo = `ABPPL/REC/25-26/${String(recCount).padStart(4, '0')}`;

    // Create Payment Receipt
    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNo,
      paymentId: `pay-${Date.now()}`,
      orderId: order.id,
      orderNo: order.orderNo,
      invoiceId: order.invoiceIds?.[0],
      invoiceNo: order.invoiceNos?.[0],
      customerId: order.customerId,
      customerName: order.customerName,
      amount,
      paymentDate: pDate,
      paymentMode: paymentData.paymentMode || 'BANK_TRANSFER',
      referenceNo: paymentData.referenceNo || 'NEFT-ONLINE',
      bankName: paymentData.bankName || 'HDFC Bank',
      status: 'SUCCESS',
      notes: paymentData.notes || `Payment received for Order #${order.orderNo}`,
      collectedBy: currentUser?.name || 'Accounts Dept',
      createdAt: now
    };

    this.db.receipts.unshift(receipt);

    // Update order payment stats
    const newPaid = Number(order.paidAmount || 0) + amount;
    const newBal = Math.max(0, order.grandTotal - newPaid);
    order.paidAmount = newPaid;
    order.balanceDue = newBal;
    if (newBal <= 0) order.paymentStatus = 'PAID';
    else if (newPaid > 0) order.paymentStatus = 'PARTIAL';

    order.receiptIds = [...(order.receiptIds || []), receipt.id];
    order.receiptNos = [...(order.receiptNos || []), receipt.receiptNo];
    order.updatedAt = now;

    // Update Party balance
    if (order.customerId) {
      const party = this.getPartyById(order.customerId);
      if (party) {
        party.outstandingBalance = Math.max(0, (party.outstandingBalance || 0) - amount);
        this.saveParty(party);
      }
    }

    const idx = this.db.salesOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.db.salesOrders[idx] = order;
      this.saveData();
    }

    this.recordOrderStatusHistory({
      orderId: order.id,
      orderNo: order.orderNo,
      fromStatus: order.status,
      toStatus: order.status,
      action: `Payment of ₹${amount.toLocaleString('en-IN')} Received (${paymentData.paymentMode})`,
      performedBy: currentUser?.name || 'Accounts Head',
      performedByRole: currentUser?.role || 'accounts',
      notes: `Issued Receipt #${receiptNo}. Ref: ${paymentData.referenceNo || 'N/A'}. Balance Due: ₹${newBal.toLocaleString('en-IN')}`
    });

    this.recordAuditLog({
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Accounts Head',
      userRole: currentUser?.role || 'accounts',
      action: 'PAYMENT_RECEIVED',
      entityType: 'RECEIPT',
      entityId: receipt.id,
      entityNo: receiptNo,
      details: `Received ₹${amount.toLocaleString('en-IN')} for Order #${order.orderNo}. Receipt #${receiptNo}`
    });

    return { order, receipt };
  }

  deleteSalesOrder(id: string): boolean {
    const idx = this.db.salesOrders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    const order = this.db.salesOrders[idx];
    if (order.status === 'INVOICED' || (order.invoiceIds && order.invoiceIds.length > 0)) {
      throw new Error(`Cannot delete Sales Order #${order.orderNo} because it has already been invoiced.`);
    }
    this.db.salesOrders.splice(idx, 1);
    this.saveData();
    return true;
  }

  // --- Order Status History Timeline ---
  getOrderActivityTimeline(orderId: string): OrderStatusHistoryEntry[] {
    if (!this.db.orderStatusHistory) this.db.orderStatusHistory = [];
    return this.db.orderStatusHistory
      .filter(h => h.orderId === orderId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  recordOrderStatusHistory(entry: Partial<OrderStatusHistoryEntry>): OrderStatusHistoryEntry {
    if (!this.db.orderStatusHistory) this.db.orderStatusHistory = [];
    const newEntry: OrderStatusHistoryEntry = {
      id: entry.id || `osh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId: entry.orderId || '',
      orderNo: entry.orderNo || '',
      fromStatus: entry.fromStatus || 'DRAFT',
      toStatus: entry.toStatus || 'SUBMITTED',
      action: entry.action || 'Status Updated',
      performedBy: entry.performedBy || 'System',
      performedByRole: entry.performedByRole || 'staff',
      timestamp: entry.timestamp || new Date().toISOString(),
      notes: entry.notes || ''
    };
    this.db.orderStatusHistory.push(newEntry);
    this.saveData();
    return newEntry;
  }

  // --- Audit Logs ---
  getAuditLogs(filter?: { entityType?: string; action?: string; userId?: string; limit?: number }): AuditLog[] {
    if (!this.db.auditLogs) this.db.auditLogs = [];
    let logs = [...this.db.auditLogs];

    if (filter) {
      if (filter.entityType) logs = logs.filter(l => l.entityType === filter.entityType);
      if (filter.action) logs = logs.filter(l => l.action === filter.action);
      if (filter.userId) logs = logs.filter(l => l.userId === filter.userId);
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filter?.limit) logs = logs.slice(0, filter.limit);
    return logs;
  }

  recordAuditLog(entry: Partial<AuditLog>): AuditLog {
    if (!this.db.auditLogs) this.db.auditLogs = [];
    const newLog: AuditLog = {
      id: entry.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      userId: entry.userId || 'usr-1',
      userName: entry.userName || 'System',
      userRole: entry.userRole || 'staff',
      action: entry.action || 'ACTION',
      entityType: entry.entityType || 'SYSTEM',
      entityId: entry.entityId,
      entityNo: entry.entityNo,
      details: entry.details || ''
    };
    this.db.auditLogs.unshift(newLog);
    this.saveData();
    return newLog;
  }

  // --- Deliveries & Packing Slips ---
  getDeliveries(filter?: { orderId?: string; customerId?: string }): DeliveryChallan[] {
    if (!this.db.deliveries) this.db.deliveries = [];
    let list = [...this.db.deliveries];
    if (filter?.orderId) list = list.filter(d => d.orderId === filter.orderId);
    if (filter?.customerId) list = list.filter(d => d.customerId === filter.customerId);
    return list;
  }

  getDeliveryById(id: string): DeliveryChallan | undefined {
    return this.getDeliveries().find(d => d.id === id || d.challanNo === id);
  }

  // --- Receipts ---
  getReceipts(filter?: { orderId?: string; customerId?: string }): PaymentReceipt[] {
    if (!this.db.receipts) this.db.receipts = [];
    let list = [...this.db.receipts];
    if (filter?.orderId) list = list.filter(r => r.orderId === filter.orderId);
    if (filter?.customerId) list = list.filter(r => r.customerId === filter.customerId);
    return list;
  }

  getReceiptById(id: string): PaymentReceipt | undefined {
    return this.getReceipts().find(r => r.id === id || r.receiptNo === id);
  }

  // --- Customer & Distributor Price Lists ---
  getCustomerPriceLists(partyId?: string): CustomerPriceList[] {
    if (!this.db.customerPriceLists) this.db.customerPriceLists = [];
    if (partyId) {
      return this.db.customerPriceLists.filter(p => p.partyId === partyId);
    }
    return this.db.customerPriceLists;
  }

  saveCustomerPriceList(item: Partial<CustomerPriceList>, currentUser?: any): CustomerPriceList {
    if (!this.db.customerPriceLists) this.db.customerPriceLists = [];
    const now = new Date().toISOString();

    const priceItem: CustomerPriceList = {
      id: item.id || `pl-${Date.now()}`,
      partyId: item.partyId || '',
      partyName: item.partyName || 'Customer',
      partyType: item.partyType || 'CUSTOMER',
      productId: item.productId || '',
      productName: item.productName || 'Paper Product',
      category: (item.category as any) || 'COPIER_PAPER',
      gsm: Number(item.gsm || 0),
      sizeInches: item.sizeInches || '',
      standardRate: Number(item.standardRate || 0),
      specialRate: Number(item.specialRate || 0),
      discountPct: Number(item.discountPct || 0),
      minOrderQty: Number(item.minOrderQty || 1),
      effectiveFrom: item.effectiveFrom || now.split('T')[0],
      effectiveTo: item.effectiveTo,
      notes: item.notes || '',
      updatedBy: currentUser?.name || 'Super Admin',
      updatedAt: now
    };

    if (item.id) {
      const idx = this.db.customerPriceLists.findIndex(p => p.id === item.id);
      if (idx !== -1) {
        this.db.customerPriceLists[idx] = priceItem;
        this.saveData();
        return priceItem;
      }
    }

    this.db.customerPriceLists.unshift(priceItem);
    this.saveData();
    return priceItem;
  }

  deleteCustomerPriceList(id: string): boolean {
    const idx = this.db.customerPriceLists.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.db.customerPriceLists.splice(idx, 1);
    this.saveData();
    return true;
  }

  // --- Live Order Stats ---
  getOrderStats(filter?: { customerId?: string; distributorId?: string }): OrderStats {
    const orders = this.getSalesOrders(filter);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'SUBMITTED' || o.status === 'APPROVED' || o.status === 'STOCK_RESERVED' || o.status === 'PROCESSING' || o.status === 'PACKED').length;
    const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED' || o.status === 'PARTIALLY_DELIVERED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED' || o.status === 'RETURNED').length;

    const totalSalesValue = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalCollected = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalSalesValue - totalCollected);

    const reservedProducts = this.db.products.filter(p => (p.reservedStock || 0) > 0);
    const totalReservedReams = reservedProducts.reduce((sum, p) => sum + (p.reservedStock || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      dispatchedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSalesValue,
      totalCollected,
      totalOutstanding,
      totalReservedReams
    };
  }

  // --- Invoices & Quotations ---
  getInvoices(): Invoice[] {
    const today = new Date().toISOString().split('T')[0];
    return (this.db.invoices || []).map(inv => {
      let paymentStatus = inv.paymentStatus;
      if (inv.type === 'INVOICE' && inv.status !== 'CANCELLED') {
        const due = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.grandTotal - inv.paidAmount);
        if (due <= 0 && inv.grandTotal > 0) {
          paymentStatus = 'PAID';
        } else if (inv.dueDate && inv.dueDate < today && due > 0) {
          paymentStatus = 'OVERDUE';
        } else if (inv.paidAmount > 0) {
          paymentStatus = 'PARTIAL';
        } else {
          paymentStatus = 'UNPAID';
        }
      }
      return { 
        ...inv, 
        paymentStatus, 
        invoiceStatus: inv.invoiceStatus || (inv.paidAmount >= inv.grandTotal && inv.grandTotal > 0 ? 'PAID' : 'GENERATED'),
        balanceDue: inv.balanceDue ?? Math.max(0, inv.grandTotal - inv.paidAmount) 
      };
    });
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find(i => i.id === id);
  }

  updateInvoiceStatus(
    id: string, 
    invoiceStatus: InvoiceStatus, 
    details?: { trackingNo?: string; lrGrNo?: string; vehicleNumber?: string; deliveryNotes?: string; dispatchDate?: string }
  ): Invoice {
    const inv = this.getInvoiceById(id);
    if (!inv) {
      throw new Error(`Invoice with ID ${id} not found.`);
    }

    inv.invoiceStatus = invoiceStatus;
    if (details) {
      if (details.lrGrNo) inv.lrGrNo = details.lrGrNo;
      if (details.vehicleNumber) inv.vehicleNumber = details.vehicleNumber;
      if (details.deliveryNotes) inv.deliveryNotes = details.deliveryNotes;
      if (details.dispatchDate) inv.dispatchDate = details.dispatchDate;
    }

    const idx = this.db.invoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.db.invoices[idx] = inv;
      this.saveData();
    }
    return inv;
  }

  createInvoiceFromSalesOrder(salesOrderId: string, customData?: Partial<Invoice>): Invoice {
    const so = this.getSalesOrderById(salesOrderId);
    if (!so) {
      throw new Error(`Sales Order with ID ${salesOrderId} not found.`);
    }

    const newInvoiceData: Partial<Invoice> = {
      type: 'INVOICE',
      invoiceStatus: 'GENERATED',
      salesOrderId: so.id,
      salesOrderNo: so.orderNo,
      orderReference: so.customerPoNumber ? `${so.orderNo} (PO: ${so.customerPoNumber})` : so.orderNo,
      deliveryDispatchRef: so.deliveryDispatchRef || `CH-${so.orderNo.slice(-6)}`,
      customerId: so.customerId,
      customerName: so.customerName,
      customerGstin: so.customerGstin,
      customerPhone: so.customerPhone,
      customerEmail: so.customerEmail,
      customerAddress: so.customerAddress,
      billTo: so.billTo,
      shipTo: so.shipTo,
      poNumber: so.customerPoNumber,
      poDate: so.customerPoDate,
      paymentTerms: so.paymentTerms,
      transporterId: so.transporterId,
      transporterName: so.transporterName,
      transporterGovtId: so.transporterGovtId,
      vehicleNumber: so.vehicleNumber,
      lrGrNo: so.lrGrNo,
      lrGrDate: so.lrGrDate,
      freightAmount: so.freightAmount,
      freightPaidBy: so.freightPaidBy,
      deliveryNotes: so.dispatchNotes,
      items: so.items,
      subtotal: so.subtotal,
      discountTotal: so.discountTotal,
      taxableAmount: so.taxableAmount,
      cgstTotal: so.cgstTotal,
      sgstTotal: so.sgstTotal,
      igstTotal: so.igstTotal,
      gstTotal: so.gstTotal,
      freightCharges: so.freightCharges,
      otherCharges: so.otherCharges,
      roundOff: so.roundOff,
      grandTotal: so.grandTotal,
      paidAmount: 0,
      balanceDue: so.grandTotal,
      paymentStatus: 'UNPAID',
      notes: so.notes,
      terms: so.terms,
      ...customData
    };

    return this.saveInvoice(newInvoiceData);
  }

  saveInvoice(invoiceData: Partial<Invoice> & { allowNegativeStockOverride?: boolean }): Invoice {
    if (!this.db.invoices) this.db.invoices = [];

    const now = new Date().toISOString();
    const type = invoiceData.type || 'INVOICE';
    
    let prefix = this.db.settings.invoicePrefix;
    if (type === 'QUOTATION') prefix = this.db.settings.quotationPrefix;

    const count = this.db.invoices.filter(i => i.type === type).length + 143;
    const invoiceNo = invoiceData.invoiceNo || `${prefix}${String(count).padStart(4, '0')}`;

    // Process items ensuring accurate Quantity in Kgs and 18% standard paper GST
    const items = (invoiceData.items || []).map(item => {
      const gsm = Number(item.gsm || 0);
      const size = (item.sizeInches || '').toLowerCase();
      let autoKgs = item.quantityKgs || 0;
      if (!autoKgs && gsm > 0 && size.includes('x')) {
        const parts = size.split('x').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const singleReamKg = (parts[0] * parts[1] * gsm) / 3100;
          autoKgs = Math.round(singleReamKg * Number(item.quantity || 0) * 100) / 100;
        }
      }

      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const discountPct = Number(item.discountPct || 0);
      const itemBase = quantity * rate;
      const discountAmt = (itemBase * discountPct) / 100;
      const taxableValue = Number((itemBase - discountAmt).toFixed(2));
      const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;
      const gstAmount = Number(((taxableValue * gstRate) / 100).toFixed(2));
      const cgst = Number((gstAmount / 2).toFixed(2));
      const sgst = Number((gstAmount / 2).toFixed(2));
      const igst = 0;
      const netAmount = Number((taxableValue + gstAmount).toFixed(2));

      return {
        ...item,
        quantity,
        quantityKgs: autoKgs,
        rate,
        discountPct,
        taxableValue,
        gstRate,
        cgst,
        sgst,
        igst,
        gstAmount,
        netAmount
      };
    });

    const subtotal = Number(invoiceData.subtotal !== undefined ? invoiceData.subtotal : items.reduce((sum, it) => sum + (it.quantity * it.rate), 0));
    const discountTotal = Number(invoiceData.discountTotal !== undefined ? invoiceData.discountTotal : items.reduce((sum, it) => sum + ((it.quantity * it.rate * it.discountPct) / 100), 0));
    const taxableAmount = Number(invoiceData.taxableAmount !== undefined ? invoiceData.taxableAmount : items.reduce((sum, it) => sum + it.taxableValue, 0));
    const gstTotal = Number(invoiceData.gstTotal !== undefined ? invoiceData.gstTotal : items.reduce((sum, it) => sum + it.gstAmount, 0));
    const cgstTotal = Number(invoiceData.cgstTotal !== undefined ? invoiceData.cgstTotal : items.reduce((sum, it) => sum + it.cgst, 0));
    const sgstTotal = Number(invoiceData.sgstTotal !== undefined ? invoiceData.sgstTotal : items.reduce((sum, it) => sum + it.sgst, 0));
    const igstTotal = Number(invoiceData.igstTotal !== undefined ? invoiceData.igstTotal : items.reduce((sum, it) => sum + it.igst, 0));
    const freightCharges = Number(invoiceData.freightCharges || invoiceData.freightAmount || 0);
    const otherCharges = Number(invoiceData.otherCharges || 0);

    const calculatedGrand = Math.round(taxableAmount + gstTotal + freightCharges + otherCharges);
    const grandTotal = Number(invoiceData.grandTotal !== undefined && invoiceData.grandTotal > 0 ? invoiceData.grandTotal : calculatedGrand);
    const paidAmount = Number(invoiceData.paidAmount || 0);
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: Invoice['paymentStatus'] = 'UNPAID';
    if (balanceDue === 0 && grandTotal > 0) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';

    let invoiceStatus: InvoiceStatus = invoiceData.invoiceStatus || (paymentStatus === 'PAID' ? 'PAID' : 'GENERATED');

    const billTo = invoiceData.billTo || {
      name: invoiceData.customerName || 'Customer',
      companyName: invoiceData.customerName || 'Company',
      contactPerson: invoiceData.customerName || '',
      address: invoiceData.customerAddress || '',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400001',
      gstin: invoiceData.customerGstin || '',
      phone: invoiceData.customerPhone || '',
      email: invoiceData.customerEmail || ''
    };

    const shipTo = invoiceData.shipTo || billTo;

    const newInvoice: Invoice = {
      id: invoiceData.id || `inv-${Date.now()}`,
      invoiceNo,
      type,
      quotationStatus: invoiceData.quotationStatus || (type === 'QUOTATION' ? 'SENT' : undefined),
      invoiceStatus,
      salesOrderId: invoiceData.salesOrderId,
      salesOrderNo: invoiceData.salesOrderNo,
      orderReference: invoiceData.orderReference || (invoiceData.salesOrderNo ? invoiceData.salesOrderNo : invoiceData.poNumber),
      deliveryDispatchRef: invoiceData.deliveryDispatchRef || (invoiceData.salesOrderNo ? `CH-${invoiceData.salesOrderNo.slice(-6)}` : ''),
      dispatchDate: invoiceData.dispatchDate || (invoiceStatus === 'DISPATCHED' ? now.split('T')[0] : undefined),
      ewayBillNo: invoiceData.ewayBillNo,
      customerId: invoiceData.customerId || '',
      customerName: invoiceData.customerName || billTo.companyName || billTo.name,
      billTo,
      shipTo,
      customerGstin: invoiceData.customerGstin || billTo.gstin || '',
      customerPhone: invoiceData.customerPhone || billTo.phone || '',
      customerEmail: invoiceData.customerEmail || billTo.email || '',
      customerAddress: invoiceData.customerAddress || billTo.address || '',
      date: invoiceData.date || now.split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30*24*3600*1000).toISOString().split('T')[0],
      paymentTerms: invoiceData.paymentTerms || 'Net 30 Days',
      poNumber: invoiceData.poNumber || '',
      poDate: invoiceData.poDate || '',

      transporterId: invoiceData.transporterId,
      transporterName: invoiceData.transporterName,
      transporterGovtId: invoiceData.transporterGovtId,
      vehicleNumber: invoiceData.vehicleNumber,
      lrGrNo: invoiceData.lrGrNo,
      lrGrDate: invoiceData.lrGrDate,
      freightAmount: Number(invoiceData.freightAmount || 0),
      freightPaidBy: invoiceData.freightPaidBy || 'BUYER',
      deliveryNotes: invoiceData.deliveryNotes || '',

      items,
      subtotal,
      discountTotal,
      freightCharges,
      otherCharges,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      gstTotal,
      roundOff: grandTotal - (taxableAmount + gstTotal + freightCharges + otherCharges),
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus,
      status: invoiceData.status || 'ACTIVE',
      notes: invoiceData.notes || '',
      terms: invoiceData.terms || this.db.settings.defaultTerms,
      createdAt: invoiceData.createdAt || now
    };

    // Stock check and deduction if INVOICE (not QUOTATION)
    if (type === 'INVOICE' && newInvoice.status !== 'CANCELLED') {
      if (newInvoice.items && newInvoice.items.length > 0) {
        // First check stock availability unless admin override is true
        if (!invoiceData.allowNegativeStockOverride) {
          for (const item of newInvoice.items) {
            if (item.productId) {
              const prod = this.getProductById(item.productId);
              if (prod && prod.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${item.quantity} ${item.unit}. (Admin override required to bypass).`);
              }
            }
          }
        }

        // Deduct stock and record movement
        newInvoice.items.forEach(item => {
          if (item.productId) {
            const prod = this.getProductById(item.productId);
            if (prod) {
              prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
              this.saveProduct(prod);

              this.db.stockMovements.unshift({
                id: `mov-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                movementNo: `STK-${Date.now().toString().slice(-6)}`,
                productId: prod.id,
                productName: prod.name,
                productCode: prod.code,
                category: prod.category,
                gsm: prod.gsm,
                sizeInches: prod.sizeInches,
                type: 'DISPATCH',
                quantity: item.quantity,
                unit: item.unit || prod.unit,
                stockBefore: prod.currentStock + item.quantity,
                stockAfter: prod.currentStock,
                warehouseId: 'wh-1',
                warehouseName: 'Bhiwandi Central Godown',
                referenceDocType: 'SALES_DISPATCH',
                referenceNo: invoiceNo,
                reasonCode: 'SALES_DISPATCH',
                reason: `Sales Invoice #${invoiceNo} to ${newInvoice.customerName}`,
                performedBy: 'Sales & Dispatch Dept',
                performedByRole: 'Dispatch Incharge',
                date: now
              });
            }
          }
        });
      }
    }

    // Auto Freight record if applicable
    if (newInvoice.freightAmount && newInvoice.freightAmount > 0) {
      this.saveFreight({
        freightType: 'OUTWARD',
        transporterId: newInvoice.transporterId,
        transporterName: newInvoice.transporterName || 'Dispatched Logistics',
        invoiceNo,
        lrGrNo: newInvoice.lrGrNo || 'LR-OUTWARD',
        vehicleNumber: newInvoice.vehicleNumber || '',
        freightAmount: newInvoice.freightAmount,
        paidAmount: 0,
        paidBy: newInvoice.freightPaidBy || 'BUYER',
        notes: `Outward dispatch freight for Sales Invoice #${invoiceNo}`
      });
    }

    // Connect & Update Sales Order status if linked
    if (newInvoice.salesOrderId) {
      const soIdx = this.db.salesOrders.findIndex(o => o.id === newInvoice.salesOrderId);
      if (soIdx !== -1) {
        const so = this.db.salesOrders[soIdx];
        so.status = 'INVOICED';
        if (!so.invoiceIds) so.invoiceIds = [];
        if (!so.invoiceNos) so.invoiceNos = [];
        if (!so.invoiceIds.includes(newInvoice.id)) so.invoiceIds.push(newInvoice.id);
        if (!so.invoiceNos.includes(newInvoice.invoiceNo)) so.invoiceNos.push(newInvoice.invoiceNo);
        so.updatedAt = now;
      }
    }

    if (invoiceData.id) {
      const idx = this.db.invoices.findIndex(i => i.id === invoiceData.id);
      if (idx !== -1) {
        this.db.invoices[idx] = newInvoice;
        this.saveData();
        return newInvoice;
      }
    }

    this.db.invoices.unshift(newInvoice);
    this.saveData();
    return newInvoice;
  }

  deleteInvoice(id: string): boolean {
    const inv = this.getInvoiceById(id);
    if (!inv) return false;

    // Void/Cancel instead of hard delete to keep financial audit records clean
    inv.status = 'CANCELLED';

    // Restore stock if it was a sales invoice
    if (inv.type === 'INVOICE' && inv.items) {
      inv.items.forEach(item => {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.currentStock += item.quantity;
          this.saveProduct(prod);

          this.db.stockMovements.unshift({
            id: `mov-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            productId: prod.id,
            productName: prod.name,
            type: 'STOCK_IN',
            quantity: item.quantity,
            unit: item.unit || prod.unit,
            referenceNo: inv.invoiceNo,
            reason: `Sales Invoice Cancellation #${inv.invoiceNo}`,
            performedBy: 'System Audit',
            date: new Date().toISOString()
          });
        }
      });
    }

    this.saveData();
    return true;
  }

  // --- Payments ---
  getPayments(): PaymentRecord[] {
    return this.db.payments || [];
  }

  recordPayment(paymentData: Partial<PaymentRecord>): PaymentRecord {
    if (!this.db.payments) this.db.payments = [];

    const amount = Number(paymentData.amount || 0);
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const paymentNo = paymentData.paymentNo || `${this.db.settings.paymentPrefix}${new Date().getFullYear()}/${String(this.db.payments.length + 311).padStart(4, '0')}`;

    const newPayment: PaymentRecord = {
      id: paymentData.id || `pay-${Date.now()}`,
      paymentNo,
      partyType: paymentData.partyType || 'CUSTOMER',
      partyId: paymentData.partyId || '',
      partyName: paymentData.partyName || 'Party',
      invoiceId: paymentData.invoiceId,
      purchaseId: paymentData.purchaseId,
      freightId: paymentData.freightId,
      amount,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      method: paymentData.method || 'BANK_TRANSFER',
      referenceNo: paymentData.referenceNo || 'REF-N/A',
      remarks: paymentData.remarks || '',
      recordedBy: paymentData.recordedBy || 'Accounts Team',
      createdAt: new Date().toISOString()
    };

    this.db.payments.unshift(newPayment);

    // Update invoice balance if payment linked to invoice
    if (newPayment.invoiceId) {
      const inv = this.getInvoiceById(newPayment.invoiceId);
      if (inv) {
        inv.paidAmount += newPayment.amount;
        inv.balanceDue = Math.max(0, inv.grandTotal - inv.paidAmount);
        inv.paymentStatus = inv.balanceDue === 0 ? 'PAID' : 'PARTIAL';
        this.saveInvoice(inv);
      }
    }

    // Update purchase balance if payment linked to purchase
    if (newPayment.purchaseId) {
      const po = this.db.purchases.find(p => p.id === newPayment.purchaseId);
      if (po) {
        po.paidAmount += newPayment.amount;
        po.balanceDue = Math.max(0, po.grandTotal - po.paidAmount);
        po.paymentStatus = po.balanceDue === 0 ? 'PAID' : 'PARTIAL';
        this.savePurchase(po);
      }
    }

    // Update freight record if linked
    if (newPayment.freightId) {
      const fr = (this.db.freights || []).find(f => f.id === newPayment.freightId);
      if (fr) {
        fr.paidAmount += newPayment.amount;
        fr.dueAmount = Math.max(0, fr.freightAmount - fr.paidAmount);
        fr.paymentStatus = fr.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
        this.saveFreight(fr);
      }
    }

    this.saveData();
    return newPayment;
  }

  // --- Ledgers ---
  getLedger(partyType: 'CUSTOMER' | 'SUPPLIER', partyId: string): LedgerEntry[] {
    const party = this.getPartyById(partyId);
    const entries: LedgerEntry[] = [];

    let runningBalance = party?.openingBalance || 0;

    // Add opening balance entry
    if (party && party.openingBalance > 0) {
      entries.push({
        id: `led-opb-${party.id}`,
        partyType,
        partyId,
        date: party.createdAt.split('T')[0],
        referenceNo: 'OPENING',
        type: 'OPENING_BALANCE',
        description: `Opening Balance (${party.balanceType})`,
        debit: party.balanceType === 'RECEIVABLE' ? party.openingBalance : 0,
        credit: party.balanceType === 'PAYABLE' ? party.openingBalance : 0,
        runningBalance
      });
    }

    if (partyType === 'CUSTOMER') {
      const custInvoices = this.db.invoices.filter(i => i.customerId === partyId && i.type === 'INVOICE' && i.status !== 'CANCELLED');
      const custPayments = this.db.payments.filter(p => p.partyType === 'CUSTOMER' && p.partyId === partyId);

      const allEvents = [
        ...custInvoices.map(inv => ({
          date: inv.date,
          referenceNo: inv.invoiceNo,
          type: 'INVOICE' as const,
          description: `Sales Invoice #${inv.invoiceNo}`,
          debit: inv.grandTotal,
          credit: 0
        })),
        ...custPayments.map(p => ({
          date: p.paymentDate,
          referenceNo: p.paymentNo,
          type: 'PAYMENT_RECEIVED' as const,
          description: `Receipt (${p.method} - Ref: ${p.referenceNo || 'N/A'})`,
          debit: 0,
          credit: p.amount
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      allEvents.forEach((ev, idx) => {
        runningBalance += (ev.debit - ev.credit);
        entries.push({
          id: `led-${idx}`,
          partyType: 'CUSTOMER',
          partyId,
          date: ev.date,
          referenceNo: ev.referenceNo,
          type: ev.type,
          description: ev.description,
          debit: ev.debit,
          credit: ev.credit,
          runningBalance
        });
      });
    } else {
      const suppPurchases = this.db.purchases.filter(p => p.supplierId === partyId && p.status !== 'CANCELLED');
      const suppPayments = this.db.payments.filter(p => p.partyType === 'SUPPLIER' && p.partyId === partyId);

      const allEvents = [
        ...suppPurchases.map(po => ({
          date: po.date,
          referenceNo: po.purchaseNo,
          type: 'PURCHASE' as const,
          description: `Purchase Bill #${po.purchaseNo}`,
          debit: 0,
          credit: po.grandTotal
        })),
        ...suppPayments.map(p => ({
          date: p.paymentDate,
          referenceNo: p.paymentNo,
          type: 'PAYMENT_MADE' as const,
          description: `Payment (${p.method} - Ref: ${p.referenceNo || 'N/A'})`,
          debit: p.amount,
          credit: 0
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      allEvents.forEach((ev, idx) => {
        runningBalance += (ev.credit - ev.debit);
        entries.push({
          id: `led-${idx}`,
          partyType: 'SUPPLIER',
          partyId,
          date: ev.date,
          referenceNo: ev.referenceNo,
          type: ev.type,
          description: ev.description,
          debit: ev.debit,
          credit: ev.credit,
          runningBalance
        });
      });
    }

    return entries;
  }

  // --- Due Reminders ---
  getDueReminders(): DueReminder[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const reminders: DueReminder[] = [];

    // Customer Invoices Outstanding
    this.getInvoices().forEach(inv => {
      if (inv.type === 'INVOICE' && inv.status !== 'CANCELLED') {
        const due = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.grandTotal - inv.paidAmount);
        if (due > 0) {
          const dueDateObj = new Date(inv.dueDate);
          const diffTime = today.getTime() - dueDateObj.getTime();
          const daysOverdue = Math.floor(diffTime / (1000 * 3600 * 24));

          let status: DueReminder['status'] = 'DUE_SOON';
          if (inv.dueDate === todayStr) status = 'DUE_TODAY';
          else if (daysOverdue > 0) status = 'OVERDUE';

          const party = this.getPartyById(inv.customerId);

          reminders.push({
            id: `rem-inv-${inv.id}`,
            type: 'CUSTOMER_RECEIVABLE',
            partyId: inv.customerId,
            partyName: inv.customerName,
            phone: party?.phone || inv.customerPhone || '',
            invoiceNo: inv.invoiceNo,
            invoiceDate: inv.date,
            dueDate: inv.dueDate,
            totalAmount: inv.grandTotal,
            paidAmount: inv.paidAmount,
            dueAmount: due,
            daysOverdue: Math.max(0, daysOverdue),
            status
          });
        }
      }
    });

    // Supplier Purchases Outstanding
    this.getPurchases().forEach(po => {
      if (po.status !== 'CANCELLED') {
        const due = po.balanceDue !== undefined ? po.balanceDue : Math.max(0, po.grandTotal - po.paidAmount);
        if (due > 0) {
          const dueDateObj = new Date(po.dueDate);
          const diffTime = today.getTime() - dueDateObj.getTime();
          const daysOverdue = Math.floor(diffTime / (1000 * 3600 * 24));

          let status: DueReminder['status'] = 'DUE_SOON';
          if (po.dueDate === todayStr) status = 'DUE_TODAY';
          else if (daysOverdue > 0) status = 'OVERDUE';

          const party = this.getPartyById(po.supplierId);

          reminders.push({
            id: `rem-po-${po.id}`,
            type: 'SUPPLIER_PAYABLE',
            partyId: po.supplierId,
            partyName: po.supplierName,
            phone: party?.phone || '',
            invoiceNo: po.purchaseNo,
            invoiceDate: po.date,
            dueDate: po.dueDate,
            totalAmount: po.grandTotal,
            paidAmount: po.paidAmount,
            dueAmount: due,
            daysOverdue: Math.max(0, daysOverdue),
            status
          });
        }
      }
    });

    return reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  // --- Global Search ---
  globalSearch(query: string): GlobalSearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: GlobalSearchResult[] = [];

    // Parties
    this.getParties().forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.companyName.toLowerCase().includes(q) || p.phone.includes(q) || (p.gstin && p.gstin.toLowerCase().includes(q))) {
        results.push({
          id: p.id,
          title: p.companyName,
          subtitle: `${p.partyType} • ${p.phone} • GST: ${p.gstin || 'N/A'}`,
          category: 'Party',
          module: p.partyType === 'SUPPLIER' ? 'suppliers' : 'customers'
        });
      }
    });

    // Products
    this.getProducts().forEach(prod => {
      if (prod.name.toLowerCase().includes(q) || prod.code.toLowerCase().includes(q) || prod.category.toLowerCase().includes(q) || prod.brand.toLowerCase().includes(q) || String(prod.gsm).includes(q)) {
        results.push({
          id: prod.id,
          title: prod.name,
          subtitle: `Code: ${prod.code} • GSM: ${prod.gsm} • Stock: ${prod.currentStock} ${prod.unit}`,
          category: 'Product',
          module: 'products'
        });
      }
    });

    // Invoices
    this.getInvoices().forEach(inv => {
      if (inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || (inv.poNumber && inv.poNumber.toLowerCase().includes(q))) {
        results.push({
          id: inv.id,
          title: `${inv.type}: ${inv.invoiceNo}`,
          subtitle: `Customer: ${inv.customerName} • Total: ₹${inv.grandTotal.toLocaleString('en-IN')}`,
          category: 'Sales Invoice',
          module: inv.type === 'QUOTATION' ? 'quotations' : 'sales'
        });
      }
    });

    // Purchases
    this.getPurchases().forEach(po => {
      if (po.purchaseNo.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q) || (po.supplierInvoiceNo && po.supplierInvoiceNo.toLowerCase().includes(q))) {
        results.push({
          id: po.id,
          title: `Purchase: ${po.purchaseNo}`,
          subtitle: `Supplier: ${po.supplierName} • Total: ₹${po.grandTotal.toLocaleString('en-IN')}`,
          category: 'Purchase Order',
          module: 'purchases'
        });
      }
    });

    // Transporters
    this.getTransporters().forEach(tr => {
      if (tr.name.toLowerCase().includes(q) || tr.companyName.toLowerCase().includes(q) || (tr.vehicleNumber && tr.vehicleNumber.toLowerCase().includes(q))) {
        results.push({
          id: tr.id,
          title: tr.companyName,
          subtitle: `Transporter • Vehicle: ${tr.vehicleNumber || 'N/A'} • Phone: ${tr.phone}`,
          category: 'Transporter',
          module: 'transporters'
        });
      }
    });

    return results.slice(0, 15);
  }

  // --- Dashboard Summary ---
  getDashboardSummary(): DashboardSummary {
    const parties = this.getParties();
    const customers = this.getCustomers();
    const suppliers = this.getSuppliers();
    const users = this.getUsers();
    const products = this.getProducts();
    const invoices = this.getInvoices().filter(i => i.type === 'INVOICE' && i.status !== 'CANCELLED');
    const purchases = this.getPurchases().filter(p => p.status !== 'CANCELLED');
    const freights = this.getFreights();

    const todayStr = new Date().toISOString().split('T')[0];

    const todaySales = invoices
      .filter(i => i.date === todayStr)
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const todayPurchases = purchases
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + p.grandTotal, 0);

    const totalSalesAmount = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);

    const totalReceivables = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

    const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);

    const dueReminders = this.getDueReminders();
    const overdueList = dueReminders.filter(r => r.status === 'OVERDUE');
    const upcomingList = dueReminders.filter(r => r.status === 'DUE_SOON' || r.status === 'DUE_TODAY');

    const pendingFreightAmount = freights.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

    const monthlySalesData = [
      { month: 'Apr', sales: 1850000, purchases: 1400000 },
      { month: 'May', sales: 2200000, purchases: 1800000 },
      { month: 'Jun', sales: 1950000, purchases: 1500000 },
      { month: 'Jul', sales: 2600000, purchases: 2100000 },
      { month: 'Aug', sales: totalSalesAmount || 3120000, purchases: totalPurchaseAmount || 2450000 }
    ];

    return {
      totalCustomersCount: customers.length,
      totalSuppliersCount: suppliers.length,
      totalPartiesCount: parties.length,
      totalUsersCount: users.length,
      totalProductsCount: products.length,
      lowStockCount: lowStockProducts.length,
      
      todaySales,
      todayPurchases,
      totalSalesAmount,
      totalPurchaseAmount,

      totalReceivables,
      totalPayables,

      overdueInvoicesCount: overdueList.length,
      overdueInvoicesAmount: overdueList.reduce((sum, r) => sum + r.dueAmount, 0),
      upcomingDueCount: upcomingList.length,
      upcomingDueAmount: upcomingList.reduce((sum, r) => sum + r.dueAmount, 0),
      pendingFreightAmount,

      recentInvoices: invoices.slice(0, 5),
      lowStockProducts,
      monthlySalesData
    };
  }
}

export const dataStore = new DataStore();

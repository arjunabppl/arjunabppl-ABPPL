import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './server/dataStore.js';
import {
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  destroyUserSessions,
  sanitizeUser,
  getPermissionsForRole,
  hasPermission,
  Permission
} from './server/authUtils.js';

interface AuthenticatedRequest extends Request {
  user?: any;
  permissions?: Permission[];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- MIDDLEWARES ---

  const getBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
  };

  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
    }

    const storedUser = dataStore.getStoredUserById(session.userId);
    if (!storedUser || storedUser.status !== 'ACTIVE') {
      destroySession(token);
      return res.status(401).json({ error: 'Account is inactive or has been deleted.' });
    }

    req.user = sanitizeUser(storedUser);
    req.permissions = getPermissionsForRole(storedUser.role);
    next();
  };

  const requirePermission = (permission: Permission) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      requireAuth(req, res, () => {
        if (!req.user || !hasPermission(req.user.role, permission)) {
          return res.status(403).json({ error: `Access denied. Permission '${permission}' is required.` });
        }
        next();
      });
    };
  };

  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      }
      next();
    });
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', appName: 'ABPPL Web ERP', timestamp: new Date().toISOString() });
  });

  // Auth login
  app.post('/api/auth/login', (req, res) => {
    const { loginIdOrEmail, email, username, password } = req.body;
    const identifier = (loginIdOrEmail || email || username || '').toString().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both Login ID / Email and password' });
    }

    const storedUser = dataStore.findUserByLoginIdOrEmail(identifier);

    if (!storedUser) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const isMatch = verifyPassword(password, storedUser.passwordHash, storedUser.passwordSalt, storedUser.role, storedUser.username);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (storedUser.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact the administrator.' });
    }

    const token = createSession(storedUser.id, storedUser.role);
    const safeUser = sanitizeUser(storedUser);

    res.json({
      success: true,
      token,
      user: safeUser,
      permissions: getPermissionsForRole(storedUser.role)
    });
  });

  // Get current logged-in user
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      user: req.user,
      permissions: req.permissions || getPermissionsForRole(req.user?.role)
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const token = getBearerToken(req);
    if (token) {
      destroySession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // --- USER MANAGEMENT ROUTES (ADMIN ONLY) ---

  // Get all users (sanitized)
  app.get('/api/users', requireAdmin, (req, res) => {
    const users = dataStore.getUsers().map(sanitizeUser);
    res.json(users);
  });

  // Create user
  app.post('/api/users', requireAdmin, (req, res) => {
    try {
      const { name, username, email, role, status = 'ACTIVE', password } = req.body;
      if (!name || !username || !email || !role) {
        return res.status(400).json({ error: 'Full Name, Login ID (Username), Email, and Role are required' });
      }

      const created = dataStore.createUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        role,
        status: status || 'ACTIVE',
        password: password ? password.trim() : '123456'
      });

      res.status(201).json(sanitizeUser(created));
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create user' });
    }
  });

  // Update user
  app.put('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name, username, email, role, status, password } = req.body;

      // Prevent self-demotion or self-deactivation by the logged-in admin
      if (req.user?.id === id) {
        if (role && role !== 'admin') {
          return res.status(400).json({ error: 'You cannot change your own role away from Administrator.' });
        }
        if (status && status === 'INACTIVE') {
          return res.status(400).json({ error: 'You cannot deactivate your own logged-in account.' });
        }
      }

      const updated = dataStore.updateUser(id, {
        name: name ? name.trim() : undefined,
        username: username ? username.trim().toLowerCase() : undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        role,
        status,
        password: password && password.trim().length > 0 ? password.trim() : undefined
      });

      // If user was deactivated or password was changed, terminate their active sessions
      if (status === 'INACTIVE' || (password && password.trim().length > 0)) {
        destroyUserSessions(id);
      }

      res.json(sanitizeUser(updated));
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update user' });
    }
  });

  // Toggle user status (PATCH)
  app.patch('/api/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'ACTIVE' or 'INACTIVE'" });
      }

      if (req.user?.id === id && status === 'INACTIVE') {
        return res.status(400).json({ error: 'You cannot deactivate your own logged-in account.' });
      }

      const updated = dataStore.updateUser(id, { status });
      if (status === 'INACTIVE') {
        destroyUserSessions(id);
      }

      res.json(sanitizeUser(updated));
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update user status' });
    }
  });

  // Change user role (PATCH)
  app.patch('/api/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      if (req.user?.id === id && role !== 'admin') {
        return res.status(400).json({ error: 'You cannot change your own role away from Administrator.' });
      }

      const updated = dataStore.updateUser(id, { role });
      res.json(sanitizeUser(updated));
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update user role' });
    }
  });

  // Reset user password
  app.post('/api/users/:id/reset-password', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.trim().length === 0) {
        return res.status(400).json({ error: 'New password is required' });
      }

      const updated = dataStore.updateUser(id, { password: password.trim() });
      destroyUserSessions(id);

      res.json({ success: true, message: 'Password reset successfully', user: sanitizeUser(updated) });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reset password' });
    }
  });

  // Delete user
  app.delete('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({ error: 'You cannot delete your own logged-in admin account.' });
      }

      const success = dataStore.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }

      destroyUserSessions(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete user' });
    }
  });

  // --- COMPANY SETTINGS ---
  app.get('/api/settings', (req, res) => {
    res.json(dataStore.getSettings());
  });

  app.post('/api/settings', requireAdmin, (req, res) => {
    const updated = dataStore.updateSettings(req.body);
    res.json(updated);
  });

  // --- PARTIES (CUSTOMERS, SUPPLIERS, BOTH) ---
  app.get('/api/parties', (req, res) => {
    const { type } = req.query;
    res.json(dataStore.getParties(type as any));
  });

  app.get('/api/parties/:id', (req, res) => {
    const party = dataStore.getPartyById(req.params.id);
    if (!party) return res.status(404).json({ error: 'Party not found' });
    res.json(party);
  });

  app.post('/api/parties', (req, res) => {
    const party = dataStore.saveParty(req.body);
    res.json(party);
  });

  app.put('/api/parties/:id', (req, res) => {
    const party = dataStore.saveParty({ ...req.body, id: req.params.id });
    res.json(party);
  });

  app.delete('/api/parties/:id', (req, res) => {
    const ok = dataStore.deleteParty(req.params.id);
    res.json({ success: ok });
  });

  app.get('/api/parties/:id/ledger', (req, res) => {
    const party = dataStore.getPartyById(req.params.id);
    if (!party) return res.status(404).json({ error: 'Party not found' });
    const partyType = party.partyType === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER';
    const ledger = dataStore.getLedger(partyType, req.params.id);
    res.json(ledger);
  });

  // Legacy Customer & Supplier endpoints
  app.get('/api/customers', (req, res) => {
    res.json(dataStore.getCustomers());
  });

  app.get('/api/customers/:id', (req, res) => {
    const cust = dataStore.getCustomerById(req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  });

  app.post('/api/customers', (req, res) => {
    const cust = dataStore.saveCustomer(req.body);
    res.json(cust);
  });

  app.put('/api/customers/:id', (req, res) => {
    const cust = dataStore.saveCustomer({ ...req.body, id: req.params.id });
    res.json(cust);
  });

  app.delete('/api/customers/:id', (req, res) => {
    const ok = dataStore.deleteCustomer(req.params.id);
    res.json({ success: ok });
  });

  app.get('/api/customers/:id/ledger', (req, res) => {
    const ledger = dataStore.getLedger('CUSTOMER', req.params.id);
    res.json(ledger);
  });

  app.get('/api/suppliers', (req, res) => {
    res.json(dataStore.getSuppliers());
  });

  app.get('/api/suppliers/:id', (req, res) => {
    const supp = dataStore.getSupplierById(req.params.id);
    if (!supp) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supp);
  });

  app.post('/api/suppliers', (req, res) => {
    const supp = dataStore.saveSupplier(req.body);
    res.json(supp);
  });

  app.put('/api/suppliers/:id', (req, res) => {
    const supp = dataStore.saveSupplier({ ...req.body, id: req.params.id });
    res.json(supp);
  });

  app.delete('/api/suppliers/:id', (req, res) => {
    const ok = dataStore.deleteSupplier(req.params.id);
    res.json({ success: ok });
  });

  app.get('/api/suppliers/:id/ledger', (req, res) => {
    const ledger = dataStore.getLedger('SUPPLIER', req.params.id);
    res.json(ledger);
  });

  // --- TRANSPORTERS ---
  app.get('/api/transporters', (req, res) => {
    res.json(dataStore.getTransporters());
  });

  app.post('/api/transporters', (req, res) => {
    const tr = dataStore.saveTransporter(req.body);
    res.json(tr);
  });

  app.put('/api/transporters/:id', (req, res) => {
    const tr = dataStore.saveTransporter({ ...req.body, id: req.params.id });
    res.json(tr);
  });

  app.delete('/api/transporters/:id', (req, res) => {
    const ok = dataStore.deleteTransporter(req.params.id);
    res.json({ success: ok });
  });

  // --- FREIGHT RECORDS & BILLS ---
  app.get('/api/freight', (req, res) => {
    res.json(dataStore.getFreights());
  });

  app.post('/api/freight', (req, res) => {
    const fr = dataStore.saveFreight(req.body);
    res.json(fr);
  });

  app.put('/api/freight/:id', (req, res) => {
    const fr = dataStore.saveFreight({ ...req.body, id: req.params.id });
    res.json(fr);
  });

  app.delete('/api/freight/:id', (req, res) => {
    const ok = dataStore.deleteFreight(req.params.id);
    res.json({ success: ok });
  });

  // --- PAPER CATEGORIES MASTER ---
  app.get('/api/paper-categories', (req, res) => {
    res.json(dataStore.getPaperCategories());
  });

  app.post('/api/paper-categories', (req, res) => {
    try {
      const cat = dataStore.savePaperCategory(req.body);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save paper category' });
    }
  });

  app.delete('/api/paper-categories/:id', (req, res) => {
    const ok = dataStore.deletePaperCategory(req.params.id);
    res.json({ success: ok });
  });

  // --- PAPER SIZE PRESETS MASTER ---
  app.get('/api/paper-sizes', (req, res) => {
    res.json(dataStore.getPaperSizes());
  });

  app.post('/api/paper-sizes', (req, res) => {
    try {
      const sz = dataStore.savePaperSize(req.body);
      res.json(sz);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save paper size' });
    }
  });

  app.delete('/api/paper-sizes/:id', (req, res) => {
    const ok = dataStore.deletePaperSize(req.params.id);
    res.json({ success: ok });
  });

  // --- PRODUCTS / CENTRAL INVENTORY ---
  app.get('/api/products', (req, res) => {
    res.json(dataStore.getProducts());
  });

  app.post('/api/products', (req: AuthenticatedRequest, res) => {
    try {
      const prod = dataStore.saveProduct(req.body, req.user?.name || 'Admin');
      res.json(prod);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save product' });
    }
  });

  app.put('/api/products/:id', (req: AuthenticatedRequest, res) => {
    try {
      const prod = dataStore.saveProduct({ ...req.body, id: req.params.id }, req.user?.name || 'Admin');
      res.json(prod);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const ok = dataStore.deleteProduct(req.params.id);
    res.json({ success: ok });
  });

  // --- WAREHOUSES & STOCK CONTROL ---
  app.get('/api/inventory/summary', (req, res) => {
    res.json(dataStore.getInventorySummary());
  });

  app.get('/api/inventory/warehouses', (req, res) => {
    res.json(dataStore.getWarehouses());
  });

  app.post('/api/inventory/warehouses', (req, res) => {
    try {
      const wh = dataStore.saveWarehouse(req.body);
      res.json(wh);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create warehouse' });
    }
  });

  app.put('/api/inventory/warehouses/:id', (req, res) => {
    try {
      const wh = dataStore.saveWarehouse({ ...req.body, id: req.params.id });
      res.json(wh);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update warehouse' });
    }
  });

  app.delete('/api/inventory/warehouses/:id', (req, res) => {
    try {
      const ok = dataStore.deleteWarehouse(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete warehouse' });
    }
  });

  // --- STOCK MOVEMENTS (AUDIT TRAIL) ---
  app.get('/api/inventory/movements', (req, res) => {
    const { productId, warehouseId, type, startDate, endDate } = req.query as any;
    res.json(dataStore.getStockMovements({ productId, warehouseId, type, startDate, endDate }));
  });

  app.post('/api/inventory/movements', (req: AuthenticatedRequest, res) => {
    try {
      const performedBy = req.body.performedBy || req.user?.name || 'Inventory Officer';
      const mov = dataStore.recordStockMovement({ ...req.body, performedBy });
      res.json(mov);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record stock movement' });
    }
  });

  // --- STOCK TRANSFERS ---
  app.get('/api/inventory/transfers', (req, res) => {
    res.json(dataStore.getStockTransfers());
  });

  app.post('/api/inventory/transfers', (req: AuthenticatedRequest, res) => {
    try {
      const performedBy = req.body.performedBy || req.user?.name || 'Warehouse Manager';
      const transfer = dataStore.createStockTransfer({ ...req.body, performedBy });
      res.json(transfer);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create stock transfer' });
    }
  });

  // --- STOCK ADJUSTMENTS ---
  app.get('/api/inventory/adjustments', (req, res) => {
    res.json(dataStore.getStockAdjustments());
  });

  app.post('/api/inventory/adjustments', (req: AuthenticatedRequest, res) => {
    try {
      const performedBy = req.body.performedBy || req.user?.name || 'Inventory Auditor';
      const adj = dataStore.createStockAdjustment({ ...req.body, performedBy });
      res.json(adj);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create stock adjustment' });
    }
  });

  // --- STOCK RESERVATIONS ---
  app.get('/api/inventory/reservations', (req, res) => {
    res.json(dataStore.getStockReservations());
  });

  app.post('/api/inventory/reservations', (req: AuthenticatedRequest, res) => {
    try {
      const reservedBy = req.body.reservedBy || req.user?.name || 'Sales Staff';
      const resv = dataStore.createStockReservation({ ...req.body, reservedBy });
      res.json(resv);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create stock reservation' });
    }
  });

  app.patch('/api/inventory/reservations/:id/release', (req, res) => {
    try {
      const { action, reason } = req.body;
      const ok = dataStore.releaseStockReservation(req.params.id, action || 'FULFILLED', reason);
      res.json({ success: ok, message: `Reservation marked as ${action || 'FULFILLED'}` });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to release reservation' });
    }
  });

  // --- OPENING STOCK ---
  app.post('/api/inventory/opening-stock', (req: AuthenticatedRequest, res) => {
    try {
      const performedBy = req.body.performedBy || req.user?.name || 'Admin';
      const prod = dataStore.updateOpeningStock({ ...req.body, performedBy });
      res.json(prod);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update opening stock' });
    }
  });

  // --- SALES ORDERS & B2B ORDER LIFECYCLE ---
  app.get('/api/sales-orders', (req: AuthenticatedRequest, res) => {
    try {
      const { customerId, distributorId, status, search } = req.query as any;
      // If user is a customer, automatically filter by their customerId/partyId
      let finalCustomerId = customerId;
      if (req.user?.role === 'customer' && req.user?.partyId) {
        finalCustomerId = req.user.partyId;
      }
      let finalDistributorId = distributorId;
      if (req.user?.role === 'distributor' && req.user?.partyId) {
        finalDistributorId = req.user.partyId;
      }
      res.json(dataStore.getSalesOrders({ customerId: finalCustomerId, distributorId: finalDistributorId, status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch sales orders' });
    }
  });

  app.get('/api/sales-orders/stats', (req: AuthenticatedRequest, res) => {
    try {
      let customerId = req.query.customerId as string;
      if (req.user?.role === 'customer' && req.user?.partyId) customerId = req.user.partyId;
      let distributorId = req.query.distributorId as string;
      if (req.user?.role === 'distributor' && req.user?.partyId) distributorId = req.user.partyId;

      res.json(dataStore.getOrderStats({ customerId, distributorId }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch order statistics' });
    }
  });

  app.get('/api/sales-orders/:id', (req, res) => {
    try {
      const order = dataStore.getSalesOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Sales Order not found' });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch sales order' });
    }
  });

  app.get('/api/sales-orders/:id/timeline', (req, res) => {
    try {
      const timeline = dataStore.getOrderActivityTimeline(req.params.id);
      res.json(timeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch order timeline' });
    }
  });

  app.post('/api/sales-orders', (req: AuthenticatedRequest, res) => {
    try {
      const order = dataStore.saveSalesOrder(req.body, req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save sales order' });
    }
  });

  app.put('/api/sales-orders/:id', (req: AuthenticatedRequest, res) => {
    try {
      const order = dataStore.saveSalesOrder({ ...req.body, id: req.params.id }, req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update sales order' });
    }
  });

  app.delete('/api/sales-orders/:id', (req, res) => {
    try {
      const ok = dataStore.deleteSalesOrder(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete sales order' });
    }
  });

  app.post('/api/sales-orders/:id/approve', (req: AuthenticatedRequest, res) => {
    try {
      const order = dataStore.approveSalesOrder(req.params.id, req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to approve sales order' });
    }
  });

  app.post('/api/sales-orders/:id/reject', (req: AuthenticatedRequest, res) => {
    try {
      const { reason } = req.body;
      const order = dataStore.rejectSalesOrder(req.params.id, reason || 'Rejected by Admin', req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reject sales order' });
    }
  });

  app.post('/api/sales-orders/:id/pack', (req: AuthenticatedRequest, res) => {
    try {
      const order = dataStore.packSalesOrder(req.params.id, req.body, req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update packing status' });
    }
  });

  app.post('/api/sales-orders/:id/dispatch', (req: AuthenticatedRequest, res) => {
    try {
      const result = dataStore.dispatchSalesOrder(req.params.id, req.body, req.user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to dispatch sales order' });
    }
  });

  app.post('/api/sales-orders/:id/deliver', (req: AuthenticatedRequest, res) => {
    try {
      const order = dataStore.markOrderDelivered(req.params.id, req.body, req.user);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to mark order as delivered' });
    }
  });

  app.post('/api/sales-orders/:id/pay', (req: AuthenticatedRequest, res) => {
    try {
      const result = dataStore.recordOrderPayment(req.params.id, req.body, req.user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record payment receipt' });
    }
  });

  app.post('/api/sales-orders/:id/create-invoice', (req, res) => {
    try {
      const invoice = dataStore.createInvoiceFromSalesOrder(req.params.id, req.body);
      res.json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to convert sales order to invoice' });
    }
  });

  // --- DELIVERIES & PACKING SLIPS ---
  app.get('/api/deliveries', (req: AuthenticatedRequest, res) => {
    try {
      const { orderId, customerId } = req.query as any;
      let finalCustomerId = customerId;
      if (req.user?.role === 'customer' && req.user?.partyId) {
        finalCustomerId = req.user.partyId;
      }
      res.json(dataStore.getDeliveries({ orderId, customerId: finalCustomerId }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch deliveries' });
    }
  });

  app.get('/api/deliveries/:id', (req, res) => {
    try {
      const dc = dataStore.getDeliveryById(req.params.id);
      if (!dc) return res.status(404).json({ error: 'Delivery Challan not found' });
      res.json(dc);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch delivery challan' });
    }
  });

  // --- PAYMENT RECEIPTS ---
  app.get('/api/receipts', (req: AuthenticatedRequest, res) => {
    try {
      const { orderId, customerId } = req.query as any;
      let finalCustomerId = customerId;
      if (req.user?.role === 'customer' && req.user?.partyId) {
        finalCustomerId = req.user.partyId;
      }
      res.json(dataStore.getReceipts({ orderId, customerId: finalCustomerId }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch receipts' });
    }
  });

  app.get('/api/receipts/:id', (req, res) => {
    try {
      const rec = dataStore.getReceiptById(req.params.id);
      if (!rec) return res.status(404).json({ error: 'Receipt not found' });
      res.json(rec);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch receipt' });
    }
  });

  // --- CUSTOMER & DISTRIBUTOR PRICE LISTS ---
  app.get('/api/price-lists', (req, res) => {
    try {
      const { partyId } = req.query as any;
      res.json(dataStore.getCustomerPriceLists(partyId));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch price lists' });
    }
  });

  app.post('/api/price-lists', (req: AuthenticatedRequest, res) => {
    try {
      const pl = dataStore.saveCustomerPriceList(req.body, req.user);
      res.json(pl);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save price list' });
    }
  });

  app.delete('/api/price-lists/:id', (req, res) => {
    try {
      const ok = dataStore.deleteCustomerPriceList(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete price list' });
    }
  });

  // --- AUDIT LOGS ---
  app.get('/api/audit-logs', (req, res) => {
    try {
      const { entityType, action, userId, limit } = req.query as any;
      res.json(dataStore.getAuditLogs({ entityType, action, userId, limit: limit ? Number(limit) : 50 }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
    }
  });

  // --- SALES INVOICES & QUOTATIONS ---
  app.get('/api/invoices', (req, res) => {
    const { type } = req.query;
    let list = dataStore.getInvoices();
    if (type) {
      list = list.filter(i => i.type === type);
    }
    res.json(list);
  });

  app.get('/api/invoices/:id', (req, res) => {
    const inv = dataStore.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json(inv);
  });

  app.post('/api/invoices', (req, res) => {
    try {
      const inv = dataStore.saveInvoice(req.body);
      res.json(inv);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save sales invoice' });
    }
  });

  app.put('/api/invoices/:id', (req, res) => {
    try {
      const inv = dataStore.saveInvoice({ ...req.body, id: req.params.id });
      res.json(inv);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update sales invoice' });
    }
  });

  app.patch('/api/invoices/:id/status', (req, res) => {
    try {
      const { invoiceStatus, details } = req.body;
      const inv = dataStore.updateInvoiceStatus(req.params.id, invoiceStatus, details);
      res.json(inv);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update invoice status' });
    }
  });

  app.delete('/api/invoices/:id', (req, res) => {
    const ok = dataStore.deleteInvoice(req.params.id);
    res.json({ success: ok });
  });

  // --- PURCHASE & IMPORT MANAGEMENT SUITE ---
  app.get('/api/purchase/stats', (req: AuthenticatedRequest, res) => {
    try {
      res.json(dataStore.getPurchaseStats());
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch purchase stats' });
    }
  });

  // 1. Requisitions
  app.get('/api/purchase-requisitions', (req: AuthenticatedRequest, res) => {
    try {
      const { status, priority, search } = req.query as any;
      res.json(dataStore.getPurchaseRequisitions({ status, priority, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch purchase requisitions' });
    }
  });

  app.get('/api/purchase-requisitions/:id', (req: AuthenticatedRequest, res) => {
    try {
      const r = dataStore.getPurchaseRequisitionById(req.params.id);
      if (!r) return res.status(404).json({ error: 'Purchase requisition not found' });
      res.json(r);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch requisition' });
    }
  });

  app.post('/api/purchase-requisitions', (req: AuthenticatedRequest, res) => {
    try {
      const r = dataStore.savePurchaseRequisition(req.body, req.user);
      res.json(r);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save purchase requisition' });
    }
  });

  app.post('/api/purchase-requisitions/:id/approve', (req: AuthenticatedRequest, res) => {
    try {
      const r = dataStore.approvePurchaseRequisition(req.params.id, req.user);
      res.json(r);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to approve purchase requisition' });
    }
  });

  app.post('/api/purchase-requisitions/:id/reject', (req: AuthenticatedRequest, res) => {
    try {
      const r = dataStore.rejectPurchaseRequisition(req.params.id, req.body.reason || 'Not approved', req.user);
      res.json(r);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reject purchase requisition' });
    }
  });

  // 2. Quotation Comparisons (RFQ)
  app.get('/api/supplier-quotations', (req: AuthenticatedRequest, res) => {
    try {
      const { status, search } = req.query as any;
      res.json(dataStore.getSupplierQuotations({ status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch quotations' });
    }
  });

  app.post('/api/supplier-quotations', (req: AuthenticatedRequest, res) => {
    try {
      const q = dataStore.saveSupplierQuotation(req.body, req.user);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save supplier quotation matrix' });
    }
  });

  app.post('/api/supplier-quotations/:id/select', (req: AuthenticatedRequest, res) => {
    try {
      const { supplierId, decisionNotes } = req.body;
      const q = dataStore.selectSupplierQuote(req.params.id, supplierId, decisionNotes || 'Selected best terms', req.user);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to award quotation' });
    }
  });

  // 3. Purchase Orders
  app.get('/api/purchases', (req: AuthenticatedRequest, res) => {
    try {
      const { supplierId, status, isImport, approvalStatus, search } = req.query as any;
      res.json(dataStore.getPurchases({
        supplierId,
        status,
        isImport: isImport !== undefined ? isImport === 'true' : undefined,
        approvalStatus,
        search
      }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch purchase orders' });
    }
  });

  app.get('/api/purchases/:id', (req: AuthenticatedRequest, res) => {
    try {
      const po = dataStore.getPurchaseById(req.params.id);
      if (!po) return res.status(404).json({ error: 'Purchase order not found' });
      res.json(po);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch purchase order' });
    }
  });

  app.post('/api/purchases', (req: AuthenticatedRequest, res) => {
    try {
      const po = dataStore.savePurchase(req.body, req.user);
      res.json(po);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save purchase order' });
    }
  });

  app.post('/api/purchases/:id/approve', (req: AuthenticatedRequest, res) => {
    try {
      const po = dataStore.approvePurchaseOrder(req.params.id, req.user);
      res.json(po);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to approve purchase order' });
    }
  });

  app.post('/api/purchases/:id/reject', (req: AuthenticatedRequest, res) => {
    try {
      const po = dataStore.rejectPurchaseOrder(req.params.id, req.body.reason || 'Rejected by Admin', req.user);
      res.json(po);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reject purchase order' });
    }
  });

  app.delete('/api/purchases/:id', (req: AuthenticatedRequest, res) => {
    try {
      const ok = dataStore.cancelPurchase(req.params.id, req.user);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to cancel purchase order' });
    }
  });

  // 4. Goods Receipt Notes (GRN)
  app.get('/api/goods-receipt-notes', (req: AuthenticatedRequest, res) => {
    try {
      const { poId, status, search } = req.query as any;
      res.json(dataStore.getGoodsReceiptNotes({ poId, status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch GRNs' });
    }
  });

  app.get('/api/goods-receipt-notes/:id', (req: AuthenticatedRequest, res) => {
    try {
      const grn = dataStore.getGoodsReceiptNoteById(req.params.id);
      if (!grn) return res.status(404).json({ error: 'GRN not found' });
      res.json(grn);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch GRN' });
    }
  });

  app.post('/api/goods-receipt-notes', (req: AuthenticatedRequest, res) => {
    try {
      const grn = dataStore.saveGoodsReceiptNote(req.body, req.user);
      res.json(grn);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save GRN' });
    }
  });

  app.post('/api/goods-receipt-notes/:id/confirm', (req: AuthenticatedRequest, res) => {
    try {
      const grn = dataStore.confirmGoodsReceiptNote(req.params.id, req.user);
      res.json(grn);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to confirm GRN and post stock' });
    }
  });

  // 5. Three-Way Matching
  app.get('/api/three-way-matches', (req: AuthenticatedRequest, res) => {
    try {
      const { status, search } = req.query as any;
      res.json(dataStore.getThreeWayMatches({ status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch 3-way matches' });
    }
  });

  app.post('/api/three-way-matches', (req: AuthenticatedRequest, res) => {
    try {
      const match = dataStore.performThreeWayMatch(req.body, req.user);
      res.json(match);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to perform 3-way match' });
    }
  });

  app.post('/api/three-way-matches/:id/approve', (req: AuthenticatedRequest, res) => {
    try {
      const match = dataStore.approveThreeWayMatch(req.params.id, req.body.notes || 'Approved variance override', req.user);
      res.json(match);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to approve 3-way match' });
    }
  });

  // 6. Purchase Returns & Debit Notes
  app.get('/api/purchase-returns', (req: AuthenticatedRequest, res) => {
    try {
      const { status, search } = req.query as any;
      res.json(dataStore.getPurchaseReturns({ status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch purchase returns' });
    }
  });

  app.post('/api/purchase-returns', (req: AuthenticatedRequest, res) => {
    try {
      const prn = dataStore.savePurchaseReturn(req.body, req.user);
      res.json(prn);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to process purchase return and debit note' });
    }
  });

  // 7. Import Shipments
  app.get('/api/import-shipments', (req: AuthenticatedRequest, res) => {
    try {
      const { status, search } = req.query as any;
      res.json(dataStore.getImportShipments({ status, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch import shipments' });
    }
  });

  app.get('/api/import-shipments/:id', (req: AuthenticatedRequest, res) => {
    try {
      const s = dataStore.getImportShipmentById(req.params.id);
      if (!s) return res.status(404).json({ error: 'Import shipment not found' });
      res.json(s);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch import shipment' });
    }
  });

  app.post('/api/import-shipments', (req: AuthenticatedRequest, res) => {
    try {
      const s = dataStore.saveImportShipment(req.body, req.user);
      res.json(s);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save import shipment' });
    }
  });

  app.post('/api/import-shipments/:id/timeline', (req: AuthenticatedRequest, res) => {
    try {
      const { status, location, description } = req.body;
      const s = dataStore.updateShipmentTimeline(req.params.id, status, location, description, req.user);
      res.json(s);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update shipment timeline' });
    }
  });

  // 8. Landed Cost Engine
  app.get('/api/landed-cost', (req: AuthenticatedRequest, res) => {
    try {
      const { shipmentId, search } = req.query as any;
      res.json(dataStore.getLandedCostCalculations({ shipmentId, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch landed cost calculations' });
    }
  });

  app.get('/api/landed-cost/:id', (req: AuthenticatedRequest, res) => {
    try {
      const lc = dataStore.getLandedCostById(req.params.id);
      if (!lc) return res.status(404).json({ error: 'Landed cost calculation not found' });
      res.json(lc);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch landed cost' });
    }
  });

  app.get('/api/landed-cost/by-shipment/:shipmentId', (req: AuthenticatedRequest, res) => {
    try {
      const lc = dataStore.getLandedCostByShipmentId(req.params.shipmentId);
      res.json(lc || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch landed cost by shipment' });
    }
  });

  app.post('/api/landed-cost', (req: AuthenticatedRequest, res) => {
    try {
      const lc = dataStore.saveLandedCostCalculation(req.body, req.user);
      res.json(lc);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to save landed cost calculation' });
    }
  });

  app.post('/api/landed-cost/:id/finalize', (req: AuthenticatedRequest, res) => {
    try {
      const lc = dataStore.finalizeLandedCost(req.params.id, req.user);
      res.json(lc);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to finalize landed cost' });
    }
  });

  // 9. Supplier Payments
  app.get('/api/supplier-payments', (req: AuthenticatedRequest, res) => {
    try {
      const { supplierId, poId, search } = req.query as any;
      res.json(dataStore.getSupplierPayments({ supplierId, poId, search }));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch supplier payments' });
    }
  });

  app.post('/api/supplier-payments', (req: AuthenticatedRequest, res) => {
    try {
      const sp = dataStore.saveSupplierPayment(req.body, req.user);
      res.json(sp);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record supplier payment' });
    }
  });

  // --- PAYMENTS ---
  app.get('/api/payments', (req, res) => {
    res.json(dataStore.getPayments());
  });

  app.post('/api/payments', (req, res) => {
    try {
      const pay = dataStore.recordPayment(req.body);
      res.json(pay);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record payment' });
    }
  });

  // --- DUE REMINDERS ---
  app.get('/api/due-reminders', (req, res) => {
    res.json(dataStore.getDueReminders());
  });

  // --- GLOBAL SEARCH ---
  app.get('/api/global-search', (req, res) => {
    const q = (req.query.q || '').toString();
    res.json(dataStore.globalSearch(q));
  });

  // --- DASHBOARD SUMMARY ---
  app.get('/api/dashboard/summary', (req, res) => {
    res.json(dataStore.getDashboardSummary());
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ABPPL Web ERP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const Razorpay = require('razorpay');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]]) return;
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    });
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const os = require('os');
const dataDir = process.env.DATA_DIR || path.join(os.homedir(), '.thedreamgym_data');
const uploadsDir = path.join(dataDir, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Auto-migrate local uploads folder on startup if the destination is empty
const localUploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(localUploadsDir)) {
    try {
        const localFiles = fs.readdirSync(localUploadsDir);
        localFiles.forEach(file => {
            const src = path.join(localUploadsDir, file);
            const dest = path.join(uploadsDir, file);
            if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
            }
        });
        console.log('Uploads successfully migrated to persistent storage:', uploadsDir);
    } catch (err) {
        console.error('Failed to migrate uploads:', err);
    }
}
let razorpayClient = null;

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

let databaseStartupError = null;
let db;

try {
    db = require('./database');
} catch (error) {
    databaseStartupError = error;
    console.error('Database startup failed:', error);
    db = {
        all: (sql, params, cb) => {
            const callback = typeof params === 'function' ? params : cb;
            callback(databaseStartupError);
        },
        get: (sql, params, cb) => {
            const callback = typeof params === 'function' ? params : cb;
            callback(databaseStartupError);
        },
        run: (sql, params, cb) => {
            const callback = typeof params === 'function' ? params : cb;
            if (callback) callback(databaseStartupError);
        }
    };
}

const app = express();
app.use(compression({
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(cors());
app.use(express.json());

const staticCache = {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath).toLowerCase();
        if (fileName === 'robots.txt' || fileName === 'sitemap.xml' || fileName === 'dashboard.js' || ext === '.html') {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (ext) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
};

// Serve static files
app.use(express.static(__dirname, staticCache));
app.use('/uploads', express.static(uploadsDir, staticCache));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'the-dream-gym',
        time: new Date().toISOString(),
        database: databaseStartupError ? 'error' : 'ok',
        database_error: databaseStartupError ? databaseStartupError.message : null
    });
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const toPaise = (amount) => {
    const normalized = String(amount || '').replace(/[^\d.]/g, '');
    const value = Number(normalized);
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

const updatePaymentRequest = (id, fields) => new Promise((resolve, reject) => {
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return resolve();
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);
    db.run(`UPDATE payment_requests SET ${setClause} WHERE id = ?`, [...values, id], (err) => {
        if (err) reject(err);
        else resolve();
    });
});

const getPaymentRequest = (id) => new Promise((resolve, reject) => {
    db.get("SELECT * FROM payment_requests WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const listPaymentRequests = () => new Promise((resolve, reject) => {
    db.all("SELECT * FROM payment_requests ORDER BY created_at DESC", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const getRazorpayClient = () => {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        const error = new Error('Razorpay keys are not configured');
        error.statusCode = 503;
        throw error;
    }

    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET
        });
    }

    return razorpayClient;
};

const toPaiseFromSubunit = (amount) => {
    const value = Number(amount);
    return Number.isInteger(value) ? value : 0;
};

const handleRazorpayError = (res, error, fallbackMessage) => {
    const statusCode = error.statusCode || error.status || 500;
    const safeStatus = statusCode === 401 ? 401 : 500;
    const message = error.error?.description || error.message || fallbackMessage;
    res.status(safeStatus).json({ error: message });
};

const createRazorpayOrder = async ({ amountInPaise, currency = 'INR', receipt, payment_request_id, plan_name, billing_cycle }) => {
    if (!amountInPaise || amountInPaise < 100) {
        const error = new Error('Amount must be at least 100 paise');
        error.statusCode = 400;
        throw error;
    }

    const client = getRazorpayClient();
    const safeReceipt = String(receipt || `tdg_${payment_request_id || 'order'}_${Date.now()}`).slice(0, 40);

    return client.orders.create({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: safeReceipt,
        notes: {
            payment_request_id: payment_request_id ? String(payment_request_id) : '',
            plan: plan_name || '',
            billing_cycle: billing_cycle || ''
        }
    });
};

const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const actual = Buffer.from(String(razorpay_signature), 'hex');

    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const syncCapturedPayment = async (paymentRequestId) => {
    const paymentRequest = await getPaymentRequest(paymentRequestId);
    if (!paymentRequest) {
        const error = new Error('Payment request not found');
        error.statusCode = 404;
        throw error;
    }

    if (!paymentRequest.razorpay_order_id) {
        const error = new Error('No Razorpay order is linked to this request');
        error.statusCode = 400;
        throw error;
    }

    if (paymentRequest.status === 'PAID' && paymentRequest.razorpay_payment_id) {
        return {
            alreadyPaid: true,
            paymentRequest,
            razorpay_payment_id: paymentRequest.razorpay_payment_id,
            paid_at: paymentRequest.paid_at
        };
    }

    const client = getRazorpayClient();
    const payments = await client.orders.fetchPayments(paymentRequest.razorpay_order_id);
    const capturedPayment = (payments.items || []).find(payment => payment.status === 'captured' || payment.captured);

    if (!capturedPayment) {
        return {
            synced: false,
            paymentRequest,
            message: 'No captured Razorpay payment found for this order yet'
        };
    }

    const expectedAmount = toPaise(paymentRequest.amount);
    if (expectedAmount && Number(capturedPayment.amount) !== expectedAmount) {
        const error = new Error('Captured payment amount does not match this request');
        error.statusCode = 409;
        throw error;
    }

    const paidAt = capturedPayment.created_at
        ? new Date(capturedPayment.created_at * 1000).toISOString()
        : new Date().toISOString();

    await updatePaymentRequest(paymentRequestId, {
        status: 'PAID',
        razorpay_order_id: paymentRequest.razorpay_order_id,
        razorpay_payment_id: capturedPayment.id,
        razorpay_signature: null,
        paid_at: paidAt
    });

    return {
        synced: true,
        paymentRequest,
        razorpay_payment_id: capturedPayment.id,
        paid_at: paidAt
    };
};

const syncOpenPaymentRequests = async (paymentRequests) => {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return;

    const candidates = paymentRequests
        .filter(request =>
            request.razorpay_order_id &&
            !request.razorpay_payment_id &&
            request.status === 'ORDER_CREATED'
        )
        .slice(0, 10);

    if (candidates.length === 0) return;

    const results = await Promise.allSettled(candidates.map(request => syncCapturedPayment(request.id)));
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.warn(`Unable to auto-sync payment request ${candidates[index].id}:`, result.reason.message);
        }
    });
};

// --- API ROUTES ---

// GET Settings
app.get('/api/settings', (req, res) => {
    db.all("SELECT key, value FROM settings", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => { settings[row.key] = row.value; });
        res.json(settings);
    });
});

// POST Settings
app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?", [key, value, value], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET Pricing
app.get('/api/pricing', (req, res) => {
    db.all("SELECT * FROM pricing", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(row => {
            try { row.features = JSON.parse(row.features); } catch (e) { row.features = []; }
            row.is_popular = Number(row.is_popular) ? 1 : 0;
            row.show_home = Number(row.show_home) ? 1 : 0;
            row.is_active = row.is_active === undefined || row.is_active === null ? 1 : (Number(row.is_active) ? 1 : 0);
            row.sort_order = Number(row.sort_order ?? row.id ?? 0);
            row.cut_price = row.cut_price || '';
        });
        rows.sort((a, b) => a.sort_order - b.sort_order);
        res.json(rows);
    });
});

// PUT Pricing (Update a plan)
app.put('/api/pricing/:id', (req, res) => {
    const { name, category, period, price, cut_price, badge, features, is_popular, show_home, is_active, sort_order } = req.body;
    const featuresStr = JSON.stringify(features);
    db.run(`UPDATE pricing SET name=?, category=?, period=?, price=?, cut_price=?, badge=?, features=?, is_popular=?, show_home=?, is_active=?, sort_order=? WHERE id=?`,
        [name, category, period, price, cut_price || '', badge, featuresStr, is_popular ? 1 : 0, show_home ? 1 : 0, is_active === undefined ? 1 : (is_active ? 1 : 0), sort_order || 0, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// GET Gallery
app.get('/api/gallery', (req, res) => {
    db.all("SELECT * FROM gallery", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        res.json(rows);
    });
});

// POST Gallery (Add item)
app.post('/api/gallery', upload.single('image'), (req, res) => {
    const { type, title, grid_column, grid_row } = req.body;
    let content = req.body.content;
    
    if (type === 'image' && req.file) {
        content = '/uploads/' + req.file.filename;
    }

    db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES (?, ?, ?, ?, ?)`,
        [type, content, title, grid_column, grid_row],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// PUT Gallery (Edit item)
app.put('/api/gallery/:id', upload.single('image'), (req, res) => {
    const { type, title, grid_column, grid_row } = req.body;
    let content = req.body.content;

    if (type === 'image' && req.file) {
        content = '/uploads/' + req.file.filename;
    }

    db.get("SELECT * FROM gallery WHERE id = ?", [req.params.id], (getErr, currentItem) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        if (!currentItem) return res.status(404).json({ error: 'Gallery item not found' });

        const nextContent = content || currentItem.content;
        db.run(`UPDATE gallery SET type = ?, content = ?, title = ?, grid_column = ?, grid_row = ? WHERE id = ?`,
            [type, nextContent, title, grid_column, grid_row, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

// DELETE Gallery
app.delete('/api/gallery/:id', (req, res) => {
    db.run("DELETE FROM gallery WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET Reviews
app.get('/api/reviews', (req, res) => {
    db.all("SELECT * FROM reviews", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        res.json(rows);
    });
});

// POST Reviews (Add item)
app.post('/api/reviews', upload.single('image'), (req, res) => {
    const { name, role, content, rating } = req.body;
    let image = req.body.image_url; // fallback to URL if not uploaded
    
    if (req.file) {
        image = '/uploads/' + req.file.filename;
    }

    db.run(`INSERT INTO reviews (name, role, content, rating, image) VALUES (?, ?, ?, ?, ?)`,
        [name, role, content, rating, image],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, role, content, rating, image });
        });
});

// PUT Reviews
app.put('/api/reviews/:id', upload.single('image'), (req, res) => {
    const { name, role, content, rating } = req.body;
    let image = req.body.image_url;

    if (req.file) {
        image = '/uploads/' + req.file.filename;
    }

    if (image) {
        db.run(`UPDATE reviews SET name = ?, role = ?, content = ?, rating = ?, image = ? WHERE id = ?`,
            [name, role, content, rating, image, req.params.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    } else {
        db.run(`UPDATE reviews SET name = ?, role = ?, content = ?, rating = ? WHERE id = ?`,
            [name, role, content, rating, req.params.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    }
});

// DELETE Reviews
app.delete('/api/reviews/:id', (req, res) => {
    db.run("DELETE FROM reviews WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET About Images
app.get('/api/about_images', (req, res) => {
    db.all("SELECT * FROM about_images ORDER BY created_at ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST About Image
app.post('/api/about_images', upload.single('image'), (req, res) => {
    let image_url = req.body.image_url;
    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    if (!image_url) {
        return res.status(400).json({ error: 'Image URL or file required' });
    }

    db.run(`INSERT INTO about_images (image_url) VALUES (?)`, [image_url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// DELETE About Image
app.delete('/api/about_images/:id', (req, res) => {
    db.run("DELETE FROM about_images WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET Trainers
app.get('/api/trainers', (req, res) => {
    db.all("SELECT * FROM trainers", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST Trainer
app.post('/api/trainers', upload.single('image'), (req, res) => {
    const { name, role, delay } = req.body;
    let image_url = req.body.image_url;
    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    db.run(`INSERT INTO trainers (name, role, image_url, delay) VALUES (?, ?, ?, ?)`,
        [name, role, image_url, delay || '0s'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

// PUT Trainer
app.put('/api/trainers/:id', upload.single('image'), (req, res) => {
    const { name, role, delay } = req.body;
    let image_url = req.body.image_url;
    
    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
        db.run(`UPDATE trainers SET name = ?, role = ?, image_url = ?, delay = ? WHERE id = ?`,
            [name, role, image_url, delay, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
        });
    } else if (image_url) {
        db.run(`UPDATE trainers SET name = ?, role = ?, image_url = ?, delay = ? WHERE id = ?`,
            [name, role, image_url, delay, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
        });
    } else {
        db.run(`UPDATE trainers SET name = ?, role = ?, delay = ? WHERE id = ?`,
            [name, role, delay, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
        });
    }
});

// DELETE Trainer
app.delete('/api/trainers/:id', (req, res) => {
    db.run("DELETE FROM trainers WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET Contacts
app.get('/api/contacts', (req, res) => {
    db.all("SELECT * FROM contacts ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST Contact
app.post('/api/contacts', (req, res) => {
    const { name, email, phone, message } = req.body;
    db.run(`INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)`,
        [name, email, phone, message],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

// DELETE Contact
app.delete('/api/contacts/:id', (req, res) => {
    db.run("DELETE FROM contacts WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// GET Payment Requests
app.get('/api/payment-requests', async (req, res) => {
    try {
        const rows = await listPaymentRequests();
        await syncOpenPaymentRequests(rows);
        res.json(await listPaymentRequests());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Payment Request
app.post('/api/payment-requests', (req, res) => {
    const { plan_name, billing_cycle, amount, name, email, phone } = req.body;
    const createdAt = new Date().toISOString();

    if (!plan_name || !billing_cycle || !amount || !name || !email || !phone) {
        return res.status(400).json({ error: 'Missing required payment request fields' });
    }

    db.run(
        `INSERT INTO payment_requests (plan_name, billing_cycle, amount, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [plan_name, billing_cycle, amount, name, email, phone, createdAt],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID, created_at: createdAt });
        }
    );
});

// GET Razorpay public checkout config
app.get('/api/razorpay-key', (req, res) => {
    res.json({
        key_id: RAZORPAY_KEY_ID,
        orders_enabled: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)
    });
});

// POST Razorpay Standard Checkout Order
app.post('/api/create-order', async (req, res) => {
    const { amount, currency = 'INR', receipt, payment_request_id, plan_name, billing_cycle } = req.body;
    const amountInPaise = toPaiseFromSubunit(amount);

    try {
        const order = await createRazorpayOrder({
            amountInPaise,
            currency,
            receipt,
            payment_request_id,
            plan_name,
            billing_cycle
        });

        if (payment_request_id) {
            await updatePaymentRequest(payment_request_id, {
                status: 'ORDER_CREATED',
                razorpay_order_id: order.id
            });
        }

        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt
        });
    } catch (error) {
        if (error.statusCode === 400) return res.status(400).json({ error: error.message });
        if (error.statusCode === 503) return res.status(503).json({ error: error.message });
        handleRazorpayError(res, error, 'Unable to create Razorpay order');
    }
});

// Backwards-compatible order endpoint used by older frontend builds.
app.post('/api/razorpay-order', async (req, res) => {
    const { payment_request_id, amount, plan_name, billing_cycle } = req.body;
    const amountInPaise = toPaise(amount);

    if (!payment_request_id) {
        return res.status(400).json({ error: 'Missing payment request id' });
    }

    try {
        const order = await createRazorpayOrder({
            amountInPaise,
            currency: 'INR',
            payment_request_id,
            plan_name,
            billing_cycle
        });

        await updatePaymentRequest(payment_request_id, {
            status: 'ORDER_CREATED',
            razorpay_order_id: order.id
        });

        res.json(order);
    } catch (error) {
        if (error.statusCode === 400) return res.status(400).json({ error: error.message });
        if (error.statusCode === 503) return res.status(503).json({ error: error.message });
        handleRazorpayError(res, error, 'Unable to create Razorpay order');
    }
});

const handleVerifyPayment = async (req, res) => {
    const { payment_request_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    if (!RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Razorpay secret is not configured' });
    }

    if (!verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
        if (payment_request_id) {
            await updatePaymentRequest(payment_request_id, {
                status: 'FAILED',
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });
        }
        return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
    }

    const paidAt = new Date().toISOString();
    if (payment_request_id) {
        await updatePaymentRequest(payment_request_id, {
            status: 'PAID',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paid_at: paidAt
        });
    }

    res.json({ success: true, paid_at: paidAt });
};

// POST Razorpay Standard Checkout Payment Verification
app.post('/api/verify-payment', handleVerifyPayment);

// Backwards-compatible verification endpoint used by older frontend builds.
app.post('/api/razorpay-verify', handleVerifyPayment);

// POST Recover captured Razorpay payment if the checkout page was refreshed/closed.
app.post('/api/payment-requests/:id/sync', async (req, res) => {
    try {
        const result = await syncCapturedPayment(req.params.id);

        if (result.alreadyPaid) {
            return res.json({
                success: true,
                already_paid: true,
                razorpay_payment_id: result.razorpay_payment_id,
                paid_at: result.paid_at
            });
        }

        if (!result.synced) {
            return res.status(404).json({
                success: false,
                error: result.message
            });
        }

        res.json({
            success: true,
            razorpay_payment_id: result.razorpay_payment_id,
            paid_at: result.paid_at
        });
    } catch (error) {
        if ([400, 404, 409, 503].includes(error.statusCode)) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        handleRazorpayError(res, error, 'Unable to sync Razorpay payment');
    }
});

// DELETE Payment Request
app.delete('/api/payment-requests/:id', (req, res) => {
    db.run("DELETE FROM payment_requests WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// PATCH Payment Request Status
app.patch('/api/payment-requests/:id', async (req, res) => {
    const { status, razorpay_payment_id } = req.body;
    const allowedStatuses = ['PENDING', 'ORDER_CREATED', 'CANCELLED', 'FAILED', 'PAID_UNVERIFIED'];
    const nextStatus = status || 'PENDING';

    if (!allowedStatuses.includes(nextStatus)) {
        return res.status(400).json({ error: 'Use Razorpay verification to mark a payment as paid' });
    }

    try {
        const paidAt = nextStatus === 'PAID_UNVERIFIED' ? new Date().toISOString() : null;
        await updatePaymentRequest(req.params.id, {
            status: nextStatus,
            razorpay_payment_id: razorpay_payment_id || null,
            paid_at: paidAt
        });
        res.json({ success: true, paid_at: paidAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Simple hardcoded login for this local admin panel
    if (username === 'thedreamgym' && password === 'password123') {
        res.json({ success: true, token: 'fake-jwt-token' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});

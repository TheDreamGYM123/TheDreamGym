const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]]) return;
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    });
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SoOsL7LyE3YBwh';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        });
        res.json(rows);
    });
});

// PUT Pricing (Update a plan)
app.put('/api/pricing/:id', (req, res) => {
    const { monthly_price, monthly_cut_price, yearly_price, yearly_cut_price, features } = req.body;
    const featuresStr = JSON.stringify(features);
    db.run(`UPDATE pricing SET monthly_price=?, monthly_cut_price=?, yearly_price=?, yearly_cut_price=?, features=? WHERE id=?`,
        [monthly_price, monthly_cut_price, yearly_price, yearly_cut_price, featuresStr, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// GET Gallery
app.get('/api/gallery', (req, res) => {
    db.all("SELECT * FROM gallery", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
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
app.get('/api/payment-requests', (req, res) => {
    db.all("SELECT * FROM payment_requests ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
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

// POST Razorpay Order
app.post('/api/razorpay-order', async (req, res) => {
    const { payment_request_id, amount, plan_name, billing_cycle } = req.body;
    const amountInPaise = toPaise(amount);

    if (!payment_request_id || !amountInPaise) {
        return res.status(400).json({ error: 'Missing valid payment order fields' });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Razorpay server keys are not configured' });
    }

    try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `tdg_${payment_request_id}_${Date.now()}`,
                notes: {
                    payment_request_id: String(payment_request_id),
                    plan: plan_name || '',
                    billing_cycle: billing_cycle || ''
                }
            })
        });

        const order = await razorpayRes.json();
        if (!razorpayRes.ok) {
            return res.status(razorpayRes.status).json({ error: order.error?.description || 'Unable to create Razorpay order' });
        }

        await updatePaymentRequest(payment_request_id, {
            status: 'ORDER_CREATED',
            razorpay_order_id: order.id
        });

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Razorpay Payment Verification
app.post('/api/razorpay-verify', async (req, res) => {
    const { payment_request_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!payment_request_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    if (!RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Razorpay secret is not configured' });
    }

    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        await updatePaymentRequest(payment_request_id, {
            status: 'FAILED',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });
        return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
    }

        const paidAt = new Date().toISOString();
        await updatePaymentRequest(payment_request_id, {
            status: 'PAID',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paid_at: paidAt
        });

    res.json({ success: true, paid_at: paidAt });
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

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    // Top banner settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);
    
    // Default setting
    db.get("SELECT value FROM settings WHERE key = 'banner_text'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO settings (key, value) VALUES ('banner_text', 'OW & SAVE $50 ON INITIATION • ELITE MEMBERS')");
            db.run("INSERT INTO settings (key, value) VALUES ('banner_active', '1')");
        }
    });

    db.get("SELECT value FROM settings WHERE key = 'banner_speed'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO settings (key, value) VALUES ('banner_speed', '120')");
        }
    });

    db.get("SELECT value FROM settings WHERE key = 'hero_video_url'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO settings (key, value) VALUES ('hero_video_url', '')");
        }
    });

    // Pricing plans
    db.run(`CREATE TABLE IF NOT EXISTS pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        monthly_price TEXT,
        monthly_cut_price TEXT,
        yearly_price TEXT,
        yearly_cut_price TEXT,
        features TEXT,
        is_popular INTEGER DEFAULT 0
    )`);

    db.get("SELECT count(*) as count FROM pricing", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO pricing (name, monthly_price, monthly_cut_price, yearly_price, yearly_cut_price, features, is_popular) 
                VALUES ('BASIC', '599', '799', '5,999', '7,999', '["24/7 Gym Access", "Basic Equipment Access", "Locker Room Use"]', 0)`);
            db.run(`INSERT INTO pricing (name, monthly_price, monthly_cut_price, yearly_price, yearly_cut_price, features, is_popular) 
                VALUES ('PRO', '799', '999', '7,999', '8,999', '["All Basic Features", "Unlimited Group Classes", "Personal Workout Plan", "Sauna & Recovery Zone"]', 1)`);
            db.run(`INSERT INTO pricing (name, monthly_price, monthly_cut_price, yearly_price, yearly_cut_price, features, is_popular) 
                VALUES ('ELITE', '999', '1,099', '10,988', '11,999', '["All Pro Features", "1-on-1 Trainer (4/mo)", "Nutritional Consultation", "Exclusive Elite Lounge"]', 0)`);
        }
    });

    // Gallery items
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, -- 'image', 'youtube', 'instagram', 'text'
        content TEXT, -- URL or text
        title TEXT,
        grid_column TEXT, -- CSS grid-column value e.g., 'span 2'
        grid_row TEXT -- CSS grid-row value e.g., 'span 1'
    )`);

    db.get("SELECT count(*) as count FROM gallery", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlNg-mQEb-GK81LYxDXHT93YC6-iChggxvYqAvXFMW1AS5wLgRFu65X98B4fTKRAU8tJHVETBloL2aArawzPdKEZB1v6zeAGY_XwrUYD05MTfL7OZSbPOdlTR7gyiKfQ2WLqJQuJWeYrOnz0O5ywnijoum3VQ3XHhdfefldRly2xVPor1DcCPlLoIO4K21hV5X7N4refI20AszZnqgtmYaorEFN-3aiVDrIDE-joWie1Lwgv7zIIfzn2e62zy_EzMEmNAkZGFFa2k', '12 WEEK SHRED', 'span 2', 'span 1')`);
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('image', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop', 'STRENGTH EVOLUTION', 'span 1', 'span 2')`);
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('text', 'Push past your limits and discover your true potential at The Dream Gym. Join our elite community today.', 'PHILOSOPHY', 'span 1', 'span 1')`);
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('youtube', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'WORKOUT MOTIVATION', 'span 2', 'span 2')`);
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('instagram', 'https://www.instagram.com/p/C-vT6ZkS6U6/embed', 'REELS', 'span 1', 'span 2')`);
            db.run(`INSERT INTO gallery (type, content, title, grid_column, grid_row) VALUES ('image', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop', 'ELITE RECOMP', 'span 1', 'span 1')`);
        }
    });

    // Reviews items
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        role TEXT,
        content TEXT,
        rating INTEGER,
        image TEXT
    )`);

    db.get("SELECT count(*) as count FROM reviews", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO reviews (name, role, content, rating, image) 
                VALUES ('Mathe Wade', 'Marketing Director', '"THE DREAM GYM completely changed my perspective on fitness. The community is incredibly supportive, and the facilities are world-class but approachable."', 5, 'https://randomuser.me/api/portraits/women/44.jpg')`);
            db.run(`INSERT INTO reviews (name, role, content, rating, image) 
                VALUES ('Alex Johnson', 'Software Engineer', '"The trainers here actually care about your long-term health. It''s not just about lifting heavy; it''s about movement quality and longevity."', 5, 'https://randomuser.me/api/portraits/men/32.jpg')`);
            db.run(`INSERT INTO reviews (name, role, content, rating, image) 
                VALUES ('Sarah Lee', 'Professional Athlete', '"I''ve trained at gyms all over the world, but this place is different. The equipment is top-tier and the environment pushes you to be your absolute best."', 5, 'https://randomuser.me/api/portraits/women/68.jpg')`);
        }
    });

    // Contact submissions
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Payment requests captured before Razorpay handoff
    db.run(`CREATE TABLE IF NOT EXISTS payment_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_name TEXT,
        billing_cycle TEXT,
        amount TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'PENDING',
        razorpay_payment_id TEXT,
        razorpay_order_id TEXT,
        razorpay_signature TEXT,
        paid_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, () => {
        db.run("ALTER TABLE payment_requests ADD COLUMN razorpay_payment_id TEXT", () => {});
        db.run("ALTER TABLE payment_requests ADD COLUMN razorpay_order_id TEXT", () => {});
        db.run("ALTER TABLE payment_requests ADD COLUMN razorpay_signature TEXT", () => {});
        db.run("ALTER TABLE payment_requests ADD COLUMN paid_at TEXT", () => {});
    });

    // Trainers
    db.run(`CREATE TABLE IF NOT EXISTS trainers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        role TEXT,
        image_url TEXT,
        delay TEXT
    )`, (err) => {
        if (!err) {
            db.get("SELECT COUNT(*) as count FROM trainers", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO trainers (name, role, image_url, delay) VALUES 
                        ('Alex Rivera', 'Strength Specialist', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq7wRBcqnxsqHs8hkQHp2AG3baihXT7GFk-iNLwvlrPD3FO9Ra6ojXI8QMmCm9tc01kKA1xOz4gaMt0Xp6_uyNbPx0KIKNFuUZrHqjax8s43wZAMwsIBkRChVPwZEuit3ag7-9aNTPTE0xBm1dU5ST89_f9i40b4M9_fuMafSrokiBdlLCV8TeYpc-bqmICyhiaF-7D-mbRBJSk81_7S1Qog-cVVmN2E3uFzIBUi1KN9MCeUYpTVBYgX_7zK6shzONovqT9MVRVZM', '0s'),
                        ('Marcus Thorne', 'Bodybuilding Pro', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbmmN_BzbywYjOI7N8CSaU18LNTpltgeMS5xj7Dwl3SX0eQQfoFllvNo_qDLLYBNllOjQUL0jhrXx0RWpKN2xuOw-xfBEalmzfed_YkETSNy1_5gHHDL5RsDiHyKYnUVk_FqZzj524httIlWEBkzpcMmNQUTTJuAYtGx7vHZDLDdg51n-GyVBHzfiHeiJsEsntgrvn4DkKRwuYAsV7lPF4GJjWfce3xbwFg0iuDW_wLkgpfBjQ1BPiwDsZDj_tP8ZrE4Qt-NXgYuw', '0.1s'),
                        ('Sarah Chen', 'Mobility & Yoga', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB24L5aioT3aAl9wQT3S2PnRSA5Bq_5DImY39EWr630hDVFTN5SO-IiTJUkWSWPSPFBmgImgvA7ycn7CPezaHBDsQq_RwbD41K_MhzndyM-bZmKAU1SmHSGS_QMXHIaCkFXtmqd05S6JLnsS2SMyIquXlPKcQz0rBkGOQdMr-Zn5ArNUkdCp_bZEKr4K3c2FEvMlBuI8UMSYzM7rwf5Gm5KVfW4p3o8krHR-jlyX1kj399FU0BtLzbn0ighROUE0C1KhBndV-0hTx4', '0.2s'),
                        ('David Volkov', 'HIIT Master', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY8DIM-LLxrete1cZp0aAtt6VlHON3RuguGrM2b3u9uolOHCg1DhRC1wwMq_jix1vYRz8SQSlVQl4yhFGo2Fi4_nCR_cb6W1s5K12oIz7KXuvPQwO5BxoLpK7iq-TGBKBwxbcTkt6BRSCWOArBSNbUeCA4QqlXp2tSSsxXiqctmvJTNDztySk9vhoWPDaoxUvgUUV1fzWKIo7_g_4P1Mltl7D80aoXChng1ceQ8V0jm8Bqzbhl0-kL714idweOpBtRGCjMAXYF6uA', '0.3s')
                    `);
                }
            });
        }
    });

    // About Carousel Images
    db.run(`CREATE TABLE IF NOT EXISTS about_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (!err) {
            db.get("SELECT COUNT(*) as count FROM about_images", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO about_images (image_url) VALUES 
                        ('Photo/IMG_1881.JPG.jpeg'),
                        ('Photo/IMG_1882.JPG.jpeg'),
                        ('Photo/IMG_1886.JPG.jpeg'),
                        ('Photo/IMG_1917.JPG.jpeg'),
                        ('Photo/IMG_9449.JPG.jpeg'),
                        ('Photo/IMG_9450.JPG.jpeg'),
                        ('Photo/IMG_6450.jpg'),
                        ('Photo/IMG_7519.jpg')
                    `);
                }
            });
        }
    });
});

module.exports = db;

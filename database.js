const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

const initialData = {
    settings: {
        banner_text: 'NOW & SAVE $50 ON INITIATION - ELITE MEMBERS',
        banner_active: '1',
        banner_speed: '120',
        hero_video_url: ''
    },
    pricing: [
        { id: 1, name: 'BASIC', monthly_price: '599', monthly_cut_price: '799', yearly_price: '5,999', yearly_cut_price: '7,999', features: '["24/7 Gym Access", "Basic Equipment Access", "Locker Room Use"]', is_popular: 0 },
        { id: 2, name: 'PRO', monthly_price: '799', monthly_cut_price: '999', yearly_price: '7,999', yearly_cut_price: '8,999', features: '["All Basic Features", "Unlimited Group Classes", "Personal Workout Plan", "Sauna & Recovery Zone"]', is_popular: 1 },
        { id: 3, name: 'ELITE', monthly_price: '999', monthly_cut_price: '1,099', yearly_price: '10,988', yearly_cut_price: '11,999', features: '["All Pro Features", "1-on-1 Trainer (4/mo)", "Nutritional Consultation", "Exclusive Elite Lounge"]', is_popular: 0 }
    ],
    gallery: [
        { id: 1, type: 'image', content: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlNg-mQEb-GK81LYxDXHT93YC6-iChggxvYqAvXFMW1AS5wLgRFu65X98B4fTKRAU8tJHVETBloL2aArawzPdKEZB1v6zeAGY_XwrUYD05MTfL7OZSbPOdlTR7gyiKfQ2WLqJQuJWeYrOnz0O5ywnijoum3VQ3XHhdfefldRly2xVPor1DcCPlLoIO4K21hV5X7N4refI20AszZnqgtmYaorEFN-3aiVDrIDE-joWie1Lwgv7zIIfzn2e62zy_EzMEmNAkZGFFa2k', title: '12 WEEK SHRED', grid_column: 'span 2', grid_row: 'span 1' },
        { id: 2, type: 'image', content: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop', title: 'STRENGTH EVOLUTION', grid_column: 'span 1', grid_row: 'span 2' },
        { id: 3, type: 'text', content: 'Push past your limits and discover your true potential at The Dream Gym. Join our elite community today.', title: 'PHILOSOPHY', grid_column: 'span 1', grid_row: 'span 1' },
        { id: 4, type: 'youtube', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'WORKOUT MOTIVATION', grid_column: 'span 2', grid_row: 'span 2' },
        { id: 5, type: 'instagram', content: 'https://www.instagram.com/p/C-vT6ZkS6U6/embed', title: 'REELS', grid_column: 'span 1', grid_row: 'span 2' },
        { id: 6, type: 'image', content: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop', title: 'ELITE RECOMP', grid_column: 'span 1', grid_row: 'span 1' }
    ],
    reviews: [
        { id: 1, name: 'Mathe Wade', role: 'Marketing Director', content: '"THE DREAM GYM completely changed my perspective on fitness. The community is incredibly supportive, and the facilities are world-class but approachable."', rating: 5, image: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: 2, name: 'Alex Johnson', role: 'Software Engineer', content: '"The trainers here actually care about your long-term health. It\'s not just about lifting heavy; it\'s about movement quality and longevity."', rating: 5, image: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: 3, name: 'Sarah Lee', role: 'Professional Athlete', content: '"I\'ve trained at gyms all over the world, but this place is different. The equipment is top-tier and the environment pushes you to be your absolute best."', rating: 5, image: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ],
    contacts: [],
    payment_requests: [],
    trainers: [
        { id: 1, name: 'Alex Rivera', role: 'Strength Specialist', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq7wRBcqnxsqHs8hkQHp2AG3baihXT7GFk-iNLwvlrPD3FO9Ra6ojXI8QMmCm9tc01kKA1xOz4gaMt0Xp6_uyNbPx0KIKNFuUZrHqjax8s43wZAMwsIBkRChVPwZEuit3ag7-9aNTPTE0xBm1dU5ST89_f9i40b4M9_fuMafSrokiBdlLCV8TeYpc-bqmICyhiaF-7D-mbRBJSk81_7S1Qog-cVVmN2E3uFzIBUi1KN9MCeUYpTVBYgX_7zK6shzONovqT9MVRVZM', delay: '0s' },
        { id: 2, name: 'Marcus Thorne', role: 'Bodybuilding Pro', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbmmN_BzbywYjOI7N8CSaU18LNTpltgeMS5xj7Dwl3SX0eQQfoFllvNo_qDLLYBNllOjQUL0jhrXx0RWpKN2xuOw-xfBEalmzfed_YkETSNy1_5gHHDL5RsDiHyKYnUVk_FqZzj524httIlWEBkzpcMmNQUTTJuAYtGx7vHZDLDdg51n-GyVBHzfiHeiJsEsntgrvn4DkKRwuYAsV7lPF4GJjWfce3xbwFg0iuDW_wLkgpfBjQ1BPiwDsZDj_tP8ZrE4Qt-NXgYuw', delay: '0.1s' },
        { id: 3, name: 'Sarah Chen', role: 'Mobility & Yoga', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB24L5aioT3aAl9wQT3S2PnRSA5Bq_5DImY39EWr630hDVFTN5SO-IiTJUkWSWPSPFBmgImgvA7ycn7CPezaHBDsQq_RwbD41K_MhzndyM-bZmKAU1SmHSGS_QMXHIaCkFXtmqd05S6JLnsS2SMyIquXlPKcQz0rBkGOQdMr-Zn5ArNUkdCp_bZEKr4K3c2FEvMlBuI8UMSYzM7rwf5Gm5KVfW4p3o8krHR-jlyX1kj399FU0BtLzbn0ighROUE0C1KhBndV-0hTx4', delay: '0.2s' },
        { id: 4, name: 'David Volkov', role: 'HIIT Master', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY8DIM-LLxrete1cZp0aAtt6VlHON3RuguGrM2b3u9uolOHCg1DhRC1wwMq_jix1vYRz8SQSlVQl4yhFGo2Fi4_nCR_cb6W1s5K12oIz7KXuvPQwO5BxoLpK7iq-TGBKBwxbcTkt6BRSCWOArBSNbUeCA4QqlXp2tSSsxXiqctmvJTNDztySk9vhoWPDaoxUvgUUV1fzWKIo7_g_4P1Mltl7D80aoXChng1ceQ8V0jm8Bqzbhl0-kL714idweOpBtRGCjMAXYF6uA', delay: '0.3s' }
    ],
    about_images: [
        { id: 1, image_url: 'Photo/IMG_1881.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 2, image_url: 'Photo/IMG_1882.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 3, image_url: 'Photo/IMG_1886.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 4, image_url: 'Photo/IMG_1917.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 5, image_url: 'Photo/IMG_9449.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 6, image_url: 'Photo/IMG_9450.JPG.jpeg', created_at: new Date().toISOString() },
        { id: 7, image_url: 'Photo/IMG_6450.jpg', created_at: new Date().toISOString() },
        { id: 8, image_url: 'Photo/IMG_7519.jpg', created_at: new Date().toISOString() }
    ],
    counters: {
        pricing: 3,
        gallery: 6,
        reviews: 3,
        contacts: 0,
        payment_requests: 0,
        trainers: 4,
        about_images: 8
    }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

class JsonDatabase {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = this.load();
        this.save();
    }

    load() {
        if (!fs.existsSync(this.filePath)) return clone(initialData);
        try {
            const stored = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            return {
                ...clone(initialData),
                ...stored,
                settings: { ...initialData.settings, ...(stored.settings || {}) },
                counters: { ...initialData.counters, ...(stored.counters || {}) }
            };
        } catch (error) {
            console.error('Failed to read database.json, starting with defaults:', error);
            return clone(initialData);
        }
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    serialize(callback) {
        callback();
    }

    all(sql, params, callback) {
        if (typeof params === 'function') callback = params;
        try {
            const table = this.tableFrom(sql);
            let rows = table === 'settings'
                ? Object.entries(this.data.settings).map(([key, value]) => ({ key, value }))
                : clone(this.data[table] || []);

            if (/ORDER BY created_at DESC/i.test(sql)) {
                rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            } else if (/ORDER BY created_at ASC/i.test(sql)) {
                rows.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            }

            callback(null, rows);
        } catch (error) {
            callback(error);
        }
    }

    get(sql, params, callback) {
        if (typeof params === 'function') callback = params;
        try {
            const settingMatch = sql.match(/SELECT value FROM settings WHERE key = '([^']+)'/i);
            if (settingMatch) {
                const value = this.data.settings[settingMatch[1]];
                callback(null, value === undefined ? undefined : { value });
                return;
            }

            const countMatch = sql.match(/SELECT COUNT\(\*\) as count FROM (\w+)/i) || sql.match(/SELECT count\(\*\) as count FROM (\w+)/i);
            if (countMatch) {
                const rows = this.data[countMatch[1]] || [];
                callback(null, { count: rows.length });
                return;
            }

            callback(null, undefined);
        } catch (error) {
            callback(error);
        }
    }

    run(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        try {
            if (/^(CREATE|ALTER)\s/i.test(sql)) {
                if (callback) callback.call({ changes: 0 }, null);
                return;
            }

            if (/INSERT INTO settings/i.test(sql)) {
                const key = params[0] || this.literalValues(sql)[0];
                const value = params[1] || this.literalValues(sql)[1];
                this.data.settings[key] = value;
                this.save();
                if (callback) callback.call({ lastID: key, changes: 1 }, null);
                return;
            }

            if (/INSERT INTO/i.test(sql)) {
                const insert = sql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)/i);
                if (!insert) throw new Error(`Unsupported INSERT: ${sql}`);
                const table = insert[1];
                const fields = insert[2].split(',').map(field => field.trim());
                const row = {};
                fields.forEach((field, index) => {
                    row[field] = params[index];
                });
                row.id = this.nextId(table);
                if (table === 'contacts' || table === 'about_images') row.created_at = row.created_at || new Date().toISOString();
                if (table === 'payment_requests') {
                    row.status = row.status || 'PENDING';
                    row.created_at = row.created_at || new Date().toISOString();
                    row.razorpay_payment_id = row.razorpay_payment_id || null;
                    row.razorpay_order_id = row.razorpay_order_id || null;
                    row.razorpay_signature = row.razorpay_signature || null;
                    row.paid_at = row.paid_at || null;
                }
                this.data[table].push(row);
                this.save();
                if (callback) callback.call({ lastID: row.id, changes: 1 }, null);
                return;
            }

            if (/DELETE FROM/i.test(sql)) {
                const table = this.tableFrom(sql);
                const id = Number(params[0]);
                const before = this.data[table].length;
                this.data[table] = this.data[table].filter(row => Number(row.id) !== id);
                this.save();
                if (callback) callback.call({ changes: before - this.data[table].length }, null);
                return;
            }

            if (/UPDATE/i.test(sql)) {
                const table = this.tableFrom(sql);
                const id = Number(params[params.length - 1]);
                const row = this.data[table].find(item => Number(item.id) === id);
                if (!row) {
                    if (callback) callback.call({ changes: 0 }, null);
                    return;
                }
                const setPart = sql.match(/SET\s+(.+?)\s+WHERE/i)[1];
                const fields = setPart.split(',').map(item => item.trim().split('=')[0].trim());
                fields.forEach((field, index) => {
                    row[field] = params[index];
                });
                this.save();
                if (callback) callback.call({ changes: 1 }, null);
                return;
            }

            throw new Error(`Unsupported SQL: ${sql}`);
        } catch (error) {
            if (callback) callback(error);
        }
    }

    tableFrom(sql) {
        const match = sql.match(/(?:FROM|UPDATE|INTO)\s+(\w+)/i);
        if (!match) throw new Error(`Could not determine table from SQL: ${sql}`);
        return match[1];
    }

    nextId(table) {
        this.data.counters[table] = (this.data.counters[table] || 0) + 1;
        return this.data.counters[table];
    }

    literalValues(sql) {
        const match = sql.match(/VALUES\s*\((.+)\)/i);
        if (!match) return [];
        return match[1].split(',').map(value => value.trim().replace(/^'|'$/g, ''));
    }
}

module.exports = new JsonDatabase(dbPath);

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PORT = process.env.PORT || 8090;

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'ptms_uno';
const TABLE_PREFIX = process.env.TABLE_PREFIX || 'uno_';

// MySQL Connection Pool (Same host database as PTMS_UNO)
let dbPool = null;

async function getDbPool() {
    if (dbPool) return dbPool;

    const candidateHosts = [
        process.env.DB_HOST,
        '127.0.0.1',
        'localhost',
        'host.docker.internal',
        '172.17.0.1'
    ].filter(Boolean);

    const uniqueHosts = [...new Set(candidateHosts)];

    const candidatePasswords = [
        process.env.DB_PASSWORD,
        'BHAVIN467',
        ''
    ].filter(p => p !== undefined);

    const uniquePasswords = [...new Set(candidatePasswords)];
    const attemptLogs = [];

    for (const host of uniqueHosts) {
        for (const pass of uniquePasswords) {
            try {
                console.log(`[DB ATTEMPT] Trying host="${host}", user="${DB_USER}", pass="${pass ? '******' : 'NO'}", db="${DB_NAME}"...`);
                const testPool = mysql.createPool({
                    host: host,
                    port: DB_PORT,
                    user: DB_USER,
                    password: pass,
                    database: DB_NAME,
                    waitForConnections: true,
                    connectionLimit: 10,
                    timezone: '+05:30',
                    connectTimeout: 4000
                });

                const connection = await testPool.getConnection();
                connection.release();

                console.log(`[DATABASE SUCCESS] Connected to MySQL on host "${host}" using password "${pass ? 'YES' : 'NO'}" [Database: ${DB_NAME}]!`);
                dbPool = testPool;
                return dbPool;
            } catch (err) {
                const msg = `[Host "${host}", Pass: ${pass ? 'YES' : 'NO'} => ${err.code || 'ERR'}: ${err.message}]`;
                attemptLogs.push(msg);
                console.error(`[DATABASE ATTEMPT FAILED] ${msg}`);
            }
        }
    }

    const fullErrorMsg = attemptLogs.join(' | ');
    throw new Error(`MySQL Connection Failed: ${fullErrorMsg}`);
}

// Table name resolver helper
async function getTableName(pool, baseName) {
    const prefixedUno = `${TABLE_PREFIX}${baseName}`;
    const prefixedDataEvol = `dataevol_${baseName}`;
    try {
        const [rows] = await pool.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN (?, ?, ?)`,
            [DB_NAME, prefixedUno, prefixedDataEvol, baseName]
        );
        const found = rows.map(r => r.TABLE_NAME);
        if (found.includes(prefixedUno)) return prefixedUno;
        if (found.includes(prefixedDataEvol)) return prefixedDataEvol;
        if (found.includes(baseName)) return baseName;
    } catch (err) {
        console.warn(`Table resolver warning for ${baseName}:`, err.message);
    }
    return prefixedUno;
}

// MIME Types for static server
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.json': 'application/json'
};

// Main HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // --- API ROUTE 1: Check Availability ---
    if (pathname === '/api/check-availability' && req.method === 'GET') {
        const orgName = (parsedUrl.query.orgName || '').trim();
        const adminId = (parsedUrl.query.adminId || '').trim();

        try {
            const pool = await getDbPool();
            const usersTbl = await getTableName(pool, 'users');
            const orgsTbl = await getTableName(pool, 'organizations');

            let orgExists = false;
            let adminExists = false;

            if (orgName) {
                const [orgRows] = await pool.query(
                    `SELECT id FROM \`${orgsTbl}\` WHERE LOWER(TRIM(name)) = LOWER(?)`,
                    [orgName]
                );
                if (orgRows.length > 0) orgExists = true;
            }

            if (adminId) {
                const [adminRows] = await pool.query(
                    `SELECT id FROM \`${usersTbl}\` WHERE LOWER(TRIM(email)) = LOWER(?)`,
                    [adminId]
                );
                if (adminRows.length > 0) adminExists = true;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: true,
                orgAvailable: !orgExists,
                adminAvailable: !adminExists,
                message: orgExists ? `Organization "${orgName}" is already registered.` : (adminExists ? `Admin ID "${adminId}" is already taken.` : 'Available')
            }));
        } catch (err) {
            console.error('Check availability DB error:', err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, orgAvailable: true, adminAvailable: true }));
        }
    }

    if (pathname === '/api/register-org' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk.toString(); });
        req.on('end', async () => {
            let connection = null;
            try {
                const data = JSON.parse(bodyStr || '{}');
                const fname = (data.fname || '').trim();
                const lname = (data.lname || '').trim();
                const fullName = `${fname} ${lname}`.trim() || 'Admin User';
                const email = (data.email || '').trim().toLowerCase();
                const phone = (data.phone || '').trim();
                const designation = (data.designation || 'Administrator').trim();
                const orgName = (data.orgName || '').trim();
                const adminId = (data.adminId || email).trim().toLowerCase();
                const password = (data.password || '').trim();

                if (!orgName || !adminId || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Please provide Organization Name, Admin ID, and Password.' }));
                }

                const pool = await getDbPool();
                const usersTbl = await getTableName(pool, 'users');
                const orgsTbl = await getTableName(pool, 'organizations');
                const userOrgsTbl = await getTableName(pool, 'user_organizations');
                const countersTbl = await getTableName(pool, 'organization_task_counters');
                const projectsTbl = await getTableName(pool, 'projects');

                // --- Validation (before transaction) ---
                const [adminCheck] = await pool.query(
                    `SELECT id FROM \`${usersTbl}\` WHERE LOWER(TRIM(email)) = LOWER(?)`,
                    [adminId]
                );
                if (adminCheck.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: false,
                        error: `The Admin ID / Email "${adminId}" is already registered. Please choose a different Admin ID.`
                    }));
                }

                const [orgCheck] = await pool.query(
                    `SELECT id FROM \`${orgsTbl}\` WHERE LOWER(TRIM(name)) = LOWER(?)`,
                    [orgName]
                );
                if (orgCheck.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: false,
                        error: `The Organization Name "${orgName}" is already registered. Please choose a different name.`
                    }));
                }

                // Hash password before transaction
                const passwordHash = await bcrypt.hash(password, 12);

                // --- BEGIN TRANSACTION ---
                connection = await pool.getConnection();
                await connection.beginTransaction();
                console.log(`[TRANSACTION BEGIN] Registering org "${orgName}", admin "${adminId}"...`);

                // Step 1: Insert Organization
                const [orgResult] = await connection.query(
                    `INSERT INTO \`${orgsTbl}\` (name) VALUES (?)`,
                    [orgName]
                );
                const newOrgId = orgResult.insertId;
                console.log(`[TRANSACTION] Step 1 OK - Org inserted, ID: ${newOrgId}`);

                // Step 2: Insert Admin User
                const [userResult] = await connection.query(
                    `INSERT INTO \`${usersTbl}\` (role, name, email, password, phone, department, designation, organization_id, created_by) VALUES ('admin', ?, ?, ?, ?, 'Management', ?, ?, 1)`,
                    [fullName, adminId, passwordHash, phone, designation, newOrgId]
                );
                const newAdminUserId = userResult.insertId;
                console.log(`[TRANSACTION] Step 2 OK - Admin User inserted, ID: ${newAdminUserId}`);

                // Step 3: Link User to Organization
                await connection.query(
                    `INSERT IGNORE INTO \`${userOrgsTbl}\` (user_id, organization_id, role) VALUES (?, ?, 'admin')`,
                    [newAdminUserId, newOrgId]
                );
                console.log(`[TRANSACTION] Step 3 OK - User-Org link created`);

                // Step 4: Initialize Task Counter
                await connection.query(
                    `INSERT INTO \`${countersTbl}\` (organization_id, last_task_number) VALUES (?, 0) ON DUPLICATE KEY UPDATE organization_id=organization_id`,
                    [newOrgId]
                );
                console.log(`[TRANSACTION] Step 4 OK - Task counter initialized`);

                // Step 5: Create Default "Self Task" Project
                await connection.query(
                    `INSERT INTO \`${projectsTbl}\` (name, description, start_date, end_date, status, status_id, created_by, manager_id, organization_id) VALUES ('Self Task', 'System project for self-assigned tasks', CURDATE(), '2099-12-31', 1, 1, ?, ?, ?)`,
                    [newAdminUserId, String(newAdminUserId), newOrgId]
                );
                console.log(`[TRANSACTION] Step 5 OK - Default project created`);

                // --- COMMIT ---
                await connection.commit();
                connection.release();
                console.log(`[TRANSACTION COMMITTED] Org #${newOrgId} "${orgName}", Admin "${adminId}" saved successfully!`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    message: 'Organization & Admin Account created successfully!',
                    orgId: newOrgId,
                    orgName: orgName,
                    adminId: adminId
                }));

            } catch (err) {
                // --- ROLLBACK on any error ---
                if (connection) {
                    try {
                        await connection.rollback();
                        console.warn('[TRANSACTION ROLLED BACK] All changes reverted due to error.');
                    } catch (rbErr) {
                        console.error('[ROLLBACK ERROR]:', rbErr.message);
                    }
                    connection.release();
                }
                console.error('[REGISTER ORG DB ERROR]:', err);
                const officialErrorDetails = `Code: ${err.code || 'ERR'} | Message: ${err.message || String(err)}`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: false,
                    error: `Database Error: ${err.message || String(err)}`,
                    officialDetails: officialErrorDetails
                }));
            }
        });
        return;
    }

    // --- STATIC FILES SERVING ---
    let sanitizePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (sanitizePath === '/' || sanitizePath === '\\') {
        sanitizePath = '/index.html';
    }

    let filePath = path.join(__dirname, sanitizePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/html';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            fs.readFile(path.join(__dirname, 'index.html'), (e, fallback) => {
                if (e) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(fallback, 'utf-8');
                }
            });
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Landing Server running on http://0.0.0.0:${PORT} [Database: ${DB_NAME}]`);
});

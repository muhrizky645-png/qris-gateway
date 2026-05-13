const express = require("express");
const QRCode = require("qrcode");
const mysql = require("mysql2/promise");

const makeDynamicQRIS = require("./qris");

const app = express();

app.use(express.json());

/*
|--------------------------------------------------------------------------
| MYSQL CONFIG
|--------------------------------------------------------------------------
*/

const db = mysql.createPool({
    host: "srv1785.hstgr.io",
    user: "u608253779_admin",
    password: "Qris12345!",
    database: "u608253779_qris"
});

/*
|--------------------------------------------------------------------------
| CREATE TABLE
|--------------------------------------------------------------------------
*/

async function initDB() {

    await db.query(`
    
        CREATE TABLE IF NOT EXISTS transactions (

            id INT AUTO_INCREMENT PRIMARY KEY,

            invoice VARCHAR(255),
            product VARCHAR(255),
            amount INT,

            status VARCHAR(50),

            created_at DATETIME,
            paid_at DATETIME NULL

        )

    `);

    console.log("MySQL Connected");

}

initDB();

/*
|--------------------------------------------------------------------------
| QRIS STATIC
|--------------------------------------------------------------------------
*/

const qris =
"00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801662700160211716627001640303UMI51440014ID.CO.QRIS.WWW0215ID10243516740060303UMI5204274153033605802ID5915Pijat Mas Jamal6012Sleman (Kab)61055551362070703A016304194B";

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

    res.send("QRIS Gateway Running");

});

/*
|--------------------------------------------------------------------------
| PAY PAGE
|--------------------------------------------------------------------------
*/

app.get("/pay", async (req, res) => {

    const amount =
        req.query.amount || 1000;

    const result =
        makeDynamicQRIS(qris, amount);

    const qrImage =
        await QRCode.toDataURL(result);

    res.send(`
    
        <h1>QRIS Dynamic</h1>

        <p>
            Nominal:
            Rp${Number(amount).toLocaleString("id-ID")}
        </p>

        <img src="${qrImage}" />

    `);

});

/*
|--------------------------------------------------------------------------
| CREATE PAYMENT TEST
|--------------------------------------------------------------------------
*/

app.get("/create-payment-test", async (req, res) => {

    const product =
        req.query.product || "Produk";

    const amount =
        req.query.amount || 1000;

    const invoice =
        "INV-" + Date.now();

    await db.query(

        `
        INSERT INTO transactions
        (invoice, product, amount, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        `,

        [
            invoice,
            product,
            amount,
            "PENDING",
            new Date()
        ]

    );

    res.send({

        status: true,

        data: {
            invoice,
            product,
            amount,
            status: "PENDING",

            pay_url:
                `/pay?amount=${amount}`
        }

    });

});

/*
|--------------------------------------------------------------------------
| CREATE PAYMENT API
|--------------------------------------------------------------------------
*/

app.post("/create-payment", async (req, res) => {

    const { product, amount } =
        req.body;

    if (!product || !amount) {

        return res.send({
            status: false,
            message:
                "product dan amount wajib diisi"
        });

    }

    const invoice =
        "INV-" + Date.now();

    await db.query(

        `
        INSERT INTO transactions
        (invoice, product, amount, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        `,

        [
            invoice,
            product,
            amount,
            "PENDING",
            new Date()
        ]

    );

    res.send({

        status: true,

        data: {
            invoice,
            product,
            amount,
            status: "PENDING",

            pay_url:
                `/pay?amount=${amount}`
        }

    });

});

/*
|--------------------------------------------------------------------------
| ALL TRANSACTIONS
|--------------------------------------------------------------------------
*/

app.get("/transactions", async (req, res) => {

    const [rows] =
        await db.query(
            "SELECT * FROM transactions ORDER BY id DESC"
        );

    res.send({
        total: rows.length,
        data: rows
    });

});

/*
|--------------------------------------------------------------------------
| CHECK PAYMENT
|--------------------------------------------------------------------------
*/

app.get("/check-payment/:invoice", async (req, res) => {

    const invoice =
        req.params.invoice;

    const [rows] =
        await db.query(

            `
            SELECT * FROM transactions
            WHERE invoice=?
            `,

            [invoice]

        );

    if (rows.length === 0) {

        return res.send({
            status: false,
            message:
                "Invoice tidak ditemukan"
        });

    }

    res.send({
        status: true,
        data: rows[0]
    });

});

/*
|--------------------------------------------------------------------------
| CONFIRM PAYMENT
|--------------------------------------------------------------------------
*/

app.get("/confirm-payment/:invoice", async (req, res) => {

    const invoice =
        req.params.invoice;

    const [rows] =
        await db.query(

            `
            SELECT * FROM transactions
            WHERE invoice=?
            `,

            [invoice]

        );

    if (rows.length === 0) {

        return res.send({
            status: false,
            message:
                "Invoice tidak ditemukan"
        });

    }

    await db.query(

        `
        UPDATE transactions
        SET
            status=?,
            paid_at=?
        WHERE invoice=?
        `,

        [
            "PAID",
            new Date(),
            invoice
        ]

    );

    const [updated] =
        await db.query(

            `
            SELECT * FROM transactions
            WHERE invoice=?
            `,

            [invoice]

        );

    res.send({
        status: true,
        message:
            "Pembayaran berhasil dikonfirmasi",
        data: updated[0]
    });

});

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

app.listen(3000, () => {

    console.log(
        "Server running on port 3000"
    );

});

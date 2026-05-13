const express = require("express");
const QRCode = require("qrcode");
const fs = require("fs");

const makeDynamicQRIS = require("./qris");

const app = express();

app.use(express.json());

// file database
const DB_FILE = "./transactions.json";

// baca database
function readTransactions() {

    const data =
        fs.readFileSync(DB_FILE);

    return JSON.parse(data);

}

// simpan database
function saveTransactions(data) {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2)
    );

}

// QRIS statis merchant
const qris =
"00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801662700160211716627001640303UMI51440014ID.CO.QRIS.WWW0215ID10243516740060303UMI5204274153033605802ID5915Pijat Mas Jamal6012Sleman (Kab)61055551362070703A016304194B";

// homepage
app.get("/", (req, res) => {

    res.send("QRIS Gateway Running");

});

// generate QR payment
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

// create payment TEST
app.get("/create-payment-test", (req, res) => {

    const product =
        req.query.product || "Produk";

    const amount =
        req.query.amount || 1000;

    const invoice =
        "INV-" + Date.now();

    // ambil transaksi lama
    const transactions =
        readTransactions();

    // transaksi baru
    const transaction = {
        invoice,
        product,
        amount,
        status: "PENDING",
        created_at: new Date()
    };

    // push transaksi
    transactions.push(transaction);

    // simpan database
    saveTransactions(transactions);

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

// create payment API
app.post("/create-payment", (req, res) => {

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

    // baca transaksi
    const transactions =
        readTransactions();

    const transaction = {
        invoice,
        product,
        amount,
        status: "PENDING",
        created_at: new Date()
    };

    // tambah transaksi
    transactions.push(transaction);

    // simpan database
    saveTransactions(transactions);

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

// semua transaksi
app.get("/transactions", (req, res) => {

    const transactions =
        readTransactions();

    res.send({
        total: transactions.length,
        data: transactions
    });

});

// check invoice
app.get("/check-payment/:invoice", (req, res) => {

    const invoice =
        req.params.invoice;

    const transactions =
        readTransactions();

    const transaction =
        transactions.find(
            x => x.invoice === invoice
        );

    if (!transaction) {

        return res.send({
            status: false,
            message:
                "Invoice tidak ditemukan"
        });

    }

    res.send({
        status: true,
        data: transaction
    });

});

// confirm payment manual
app.get("/confirm-payment/:invoice", (req, res) => {

    const invoice =
        req.params.invoice;

    const transactions =
        readTransactions();

    const index =
        transactions.findIndex(
            x => x.invoice === invoice
        );

    if (index === -1) {

        return res.send({
            status: false,
            message:
                "Invoice tidak ditemukan"
        });

    }

    // ubah status
    transactions[index].status =
        "PAID";

    transactions[index].paid_at =
        new Date();

    // simpan
    saveTransactions(transactions);

    res.send({
        status: true,
        message:
            "Pembayaran berhasil dikonfirmasi",
        data: transactions[index]
    });

});

// server
app.listen(3000, () => {

    console.log(
        "Server running on port 3000"
    );

});

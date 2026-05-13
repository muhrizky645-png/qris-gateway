const express = require("express");
const QRCode = require("qrcode");

const makeDynamicQRIS = require("./qris");

const app = express();

app.use(express.json());

// database sementara
const transactions = [];

// QRIS statis merchant
const qris =
"00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801662700160211716627001640303UMI51440014ID.CO.QRIS.WWW0215ID10243516740060303UMI5204274153033605802ID5915Pijat Mas Jamal6012Sleman (Kab)61055551362070703A016304194B";

// homepage
app.get("/", (req, res) => {
    res.send("QRIS Gateway Running");
});

// generate QR payment
app.get("/pay", async (req, res) => {

    const amount = req.query.amount || 1000;

    const result = makeDynamicQRIS(qris, amount);

    const qrImage = await QRCode.toDataURL(result);

    res.send(`
        <h1>QRIS Dynamic</h1>

        <p>
            Nominal:
            Rp${Number(amount).toLocaleString("id-ID")}
        </p>

        <img src="${qrImage}" />
    `);

});

// create payment
app.post("/create-payment", (req, res) => {

    const { product, amount } = req.body;

    // validasi
    if (!product || !amount) {

        return res.send({
            status: false,
            message: "product dan amount wajib diisi"
        });

    }

    // generate invoice
    const invoice =
        "INV-" + Date.now();

    // buat transaksi
    const transaction = {
        invoice,
        product,
        amount,
        status: "PENDING",
        created_at: new Date()
    };

    // simpan transaksi
    transactions.push(transaction);

    // response
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

// check semua transaksi
app.get("/transactions", (req, res) => {

    res.send({
        total: transactions.length,
        data: transactions
    });

});

// check transaksi by invoice
app.get("/check-payment/:invoice", (req, res) => {

    const invoice =
        req.params.invoice;

    const transaction =
        transactions.find(
            x => x.invoice === invoice
        );

    if (!transaction) {

        return res.send({
            status: false,
            message: "Invoice tidak ditemukan"
        });

    }

    res.send({
        status: true,
        data: transaction
    });

});

// server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});

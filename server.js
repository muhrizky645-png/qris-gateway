const express = require("express");

const makeDynamicQRIS = require("./qris");

const app = express();

app.get("/", (req, res) => {

    const qris =
"00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801662700160211716627001640303UMI51440014ID.CO.QRIS.WWW0215ID10243516740060303UMI5204274153033605802ID5915Pijat Mas Jamal6012Sleman (Kab)61055551362070703A016304194B";

    const result = makeDynamicQRIS(qris, 15000);

    res.send({
        status: true,
        amount: 15000,
        qris: result
    });

});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

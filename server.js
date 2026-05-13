const express = require("express");
const toCRC16 = require("./crc16");

const app = express();

app.get("/", (req, res) => {

    const crc = toCRC16("TEST");

    res.send({
        message: "QRIS Gateway Running",
        crc: crc
    });

});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

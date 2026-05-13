const toCRC16 = require("./crc16");

function makeDynamicQRIS(qris, amount) {

    // hapus CRC lama
    qris = qris.slice(0, -4);

    // ubah static menjadi dynamic
    qris = qris.replace("010211", "010212");

    // buat tag nominal
    let amountStr = amount.toString();
    let amountTag = "54" +
        amountStr.length.toString().padStart(2, "0") +
        amountStr;

    // sisipkan sebelum country code
    qris = qris.replace("5802ID", amountTag + "5802ID");

    // hitung CRC baru
    let crc = toCRC16(qris);

    return qris + crc;
}

module.exports = makeDynamicQRIS;

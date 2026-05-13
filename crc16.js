function toCRC16(input) {
    let crc = 0xFFFF;

    for (let c = 0; c < input.length; c++) {
        crc ^= input.charCodeAt(c) << 8;

        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }

            crc &= 0xFFFF;
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}

module.exports = toCRC16;

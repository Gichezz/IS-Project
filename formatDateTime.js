function formatDateTime(timestamp) {
    const ts = timestamp.toString(); // Ensure it's a string
    const year = ts.substring(0, 4);
    const month = ts.substring(4, 6);
    const day = ts.substring(6, 8);
    const hour = ts.substring(8, 10);
    const minute = ts.substring(10, 12);
    const second = ts.substring(12, 14);
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

module.exports = formatDateTime;

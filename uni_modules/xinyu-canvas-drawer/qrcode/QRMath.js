class QRMath {
	static EXP_TABLE = new Array(256);
	static LOG_TABLE = new Array(256);
	static glog(n) {
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		return QRMath.LOG_TABLE[n];
	}
	static gexp(n) {
		while (n < 0) {
			n += 255;
		}
		while (n >= 256) {
			n -= 255;
		}
		return QRMath.EXP_TABLE[n];
	}
};
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath
		.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}
export default QRMath;
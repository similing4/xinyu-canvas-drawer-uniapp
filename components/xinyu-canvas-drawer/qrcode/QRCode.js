// 整改自 https://github.com/davidshimjs/qrcodejs
import QRErrorCorrectLevel from "./QRErrorCorrectLevel.js";
import QRCodeLimitLength from "./QRCodeLimitLength.js";
import QRCodeModel from "./QRCodeModel.js";
export default class QRCode {
	_htOption = {
		x: 0,
		y: 0,
		width: 256,
		height: 256,
		typeNumber: 4,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRErrorCorrectLevel.M
	};
	_oQRCode = null;
	_context = null;
	constructor(context, vOption) {
		if (typeof vOption === 'string') {
			vOption = {
				text: vOption
			};
		}
		if (vOption) {
			for (var i in vOption) {
				this._htOption[i] = vOption[i];
			}
		}
		this._context = context
	}

	makeCode(sText) {
		this._oQRCode = new QRCodeModel(this._getTypeNumber(sText, this._htOption.correctLevel), this._htOption
			.correctLevel);
		this._oQRCode.addData(sText);
		this._oQRCode.make();
		return this.makeImage();
	}
	/**
	 * Get the type by string length
	 * 
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	_getTypeNumber(sText, nCorrectLevel) {
		var nType = 1;
		var length = QRCode._getUTF8Length(sText);

		for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
			var nLimit = 0;

			switch (nCorrectLevel) {
				case QRErrorCorrectLevel.L:
					nLimit = QRCodeLimitLength[i][0];
					break;
				case QRErrorCorrectLevel.M:
					nLimit = QRCodeLimitLength[i][1];
					break;
				case QRErrorCorrectLevel.Q:
					nLimit = QRCodeLimitLength[i][2];
					break;
				case QRErrorCorrectLevel.H:
					nLimit = QRCodeLimitLength[i][3];
					break;
			}

			if (length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}

		if (nType > QRCodeLimitLength.length) {
			throw new Error("Too long data");
		}

		return nType;
	}

	static _getUTF8Length(sText) {
		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length != sText ? 3 : 0);
	}

	makeImage() {
		var _oContext = this._context
		var _htOption = this._htOption;
		var oQRCode = this._oQRCode
		var padding = 0;
		if (_htOption.padding)
			padding = _htOption.padding;

		var nCount = oQRCode.getModuleCount();
		var nWidth = Math.floor((_htOption.width - 2 * padding) / nCount);
		var nHeight = Math.floor((_htOption.height - 2 * padding) / nCount);
		console.log(nWidth,nHeight);
		for (var row = 0; row < nCount; row++) {
			for (var col = 0; col < nCount; col++) {
				var nLeft = col * nWidth + padding + _htOption.x;
				var nTop = row * nHeight + padding + _htOption.y;
				_oContext.setFillStyle(oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight)
				_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
			}
		}
		return {
			width: nWidth * nCount + 2 * padding,
			height: nHeight * nCount + 2 * padding
		}
	}
}

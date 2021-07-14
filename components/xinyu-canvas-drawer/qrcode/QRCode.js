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
		correctLevel: QRErrorCorrectLevel.H
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
		this.makeImage();
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

		var nCount = oQRCode.getModuleCount();
		var nWidth = _htOption.padding ? (_htOption.width - 2 * _htOption.padding) / nCount : _htOption.width /
			nCount;
		var nHeight = _htOption.padding ? (_htOption.height - 2 * _htOption.padding) / nCount : _htOption
			.height / nCount;
		var nRoundedHeight = Math.round(nHeight);
		var nRoundedWidth = Math.round(nWidth);

		for (var row = 0; row < nCount; row++) {
			for (var col = 0; col < nCount; col++) {
				var bIsDark = oQRCode.isDark(row, col);
				var nLeft = _htOption.padding ? col * nWidth + _htOption.padding : col * nWidth;
				var nTop = _htOption.padding ? row * nHeight + _htOption.padding : row * nHeight;
				nLeft += _htOption.x;
				nTop += _htOption.y;
				_oContext.setStrokeStyle(bIsDark ? _htOption.colorDark : _htOption.colorLight)
				_oContext.setLineWidth(1)
				_oContext.setFillStyle(bIsDark ? _htOption.colorDark : _htOption.colorLight)
				_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
				_oContext.strokeRect(
					Math.floor(nLeft) + 0.5,
					Math.floor(nTop) + 0.5,
					nRoundedHeight
				);

				_oContext.strokeRect(
					Math.ceil(nLeft) - 0.5,
					Math.ceil(nTop) - 0.5,
					nRoundedWidth,
					nRoundedHeight
				);
			}
		}
	}
}

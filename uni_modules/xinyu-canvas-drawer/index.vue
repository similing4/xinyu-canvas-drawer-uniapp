<template>
	<view class="CANVAS_DRAWER">
		<xinyu-cross-canvas :width.sync="widthTemp" :height.sync="heightTemp" :styleWidth="widthTemp"
			:styleHeight="heightTemp" id="CANVAS_DRAWER_TEMP" ref="CANVAS_DRAWER_TEMP"></xinyu-cross-canvas>
		<xinyu-cross-canvas :width.sync="width" :height.sync="height" :styleWidth="width" :styleHeight="height"
			id="CANVAS_DRAWER" ref="CANVAS_DRAWER"></xinyu-cross-canvas>
	</view>
</template>
<script>
	/**
	 * xinyu-canvas-drawer Canvas绘制器
	 * @description 本组件可用于所有需要进行Canvas绘图的场景。绘制的Canvas组件会被放置到屏幕外面，不会显示在屏幕上。调用draw方法后返回值为图片的base64。
	 * 【注意】本组件需要使用ref调用draw方法并await！
	 * @property {Number} width 待绘制的实际图片的宽度，不可以中途修改宽度与高度
	 * @property {Number} height 待绘制的实际图片的高度，不可以中途修改宽度与高度
	 * @example 
	 * <xinyu-canvas-drawer ref="poster" :width="750" :height="847"></xinyu-canvas-drawer>
	 */
	import XinyuCrossCanvas from "./xinyu-cross-canvas/xinyu-cross-canvas.vue";
	import QRCode from "./qrcode/QRCode.js";
	export default {
		name: 'xinyu-canvas-drawer',
		props: {
			width: Number, //待绘制的实际画布的宽度数值，实际画布宽度以px计
			height: Number //待绘制的实际画布的高度数值，实际画布高度以px计
		},
		data() {
			return {
				widthTemp: 255,
				heightTemp: 255,
				backgroundColor: "", //背景色，请使用setBackgroundColor方法设置。如果该值为空，则表示该canvas没有画背景色。
				waitingList: [] //所有待渲染数据。只有在调用draw方法时才会进行渲染。
			};
		},
		components: {
			XinyuCrossCanvas
		},
		methods: {
			/**
			 * init方法
			 * @description 本方法为初始化海报绘制组件方法，初始化后本组件的所有方法才可使用
			 * @example await init()
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			async init() {
				let canvas = this.$refs.CANVAS_DRAWER;
				let canvasTemp = this.$refs.CANVAS_DRAWER_TEMP;
				await canvas.init();
				await canvasTemp.init();
				this.canvas = canvas;
				this.canvas_temp = canvasTemp;
				return this;
			},
			/**
			 * setBackgroundColor方法
			 * @description 本方法设置待绘制的背景色
			 * @property {String} color 待绘制的背景颜色
			 * @example setBackgroundColor("#FFFFFF")
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			setBackgroundColor(color) {
				this.backgroundColor = color;
				return this;
			},
			/**
			 * addImage方法
			 * @description 本方法用于向Canvas上添加图片（添加的层级会按照链式顺序从下到上叠加，下同）
			 * @property {String} image 待绘制的图片，网络图片与本地图片均可（本地图片需要使用require("@/static/...")方式引入），网络图片在微信小程序中必须是要在微信download中信任的域名下的图片。
			 * @property {Number} x 待绘制的图片左上角的实际画布坐标X
			 * @property {Number} y 待绘制的图片左上角的实际画布坐标Y
			 * @property {Number} w 待绘制的图片在实际画布中的宽度
			 * @property {Number} h 待绘制的图片在实际画布中的高度
			 * @property {Boolean} isRound 是否是圆图，该项为真时直径为w，h参数将没有意义
			 * @example addImage("https://www.baidu.com/img/flexible/logo/pc/result.png",0,0,500,700);
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			addImage(image, x, y, w, h, isRound) {
				this.waitingList.push({
					type: "image",
					data: {
						image,
						x,
						y,
						w,
						h,
						isRound: !!isRound
					}
				});
				return this;
			},
			/**
			 * addQRCode方法
			 * @description 本方法用于向Canvas上添加二维码
			 * @property {String} text 待生成二维码的文本。
			 * @property {Number} x 待绘制的二维码左上角的实际画布坐标X
			 * @property {Number} y 待绘制的二维码左上角的实际画布坐标Y
			 * @property {Number} w 待绘制的二维码在实际画布中的宽度
			 * @property {Number} h 待绘制的二维码在实际画布中的高度
			 * @property {Object} extraConfig QRCode的额外配置项
			 * @example addQRCode("测试生成",0,0,500,700);
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			addQRCode(text, x, y, w, h, extraConfig) {
				if (!extraConfig)
					extraConfig = {};
				this.waitingList.push({
					type: "qrcode",
					data: {
						text,
						x,
						y,
						w,
						h,
						extraConfig
					}
				});
				return this;
			},
			/**
			 * addText方法
			 * @description 本方法用于向Canvas上添加文本
			 * @property {String} text 待绘制的文本，如果带有换行符\n或宽度超过maxWidth且isWrap为真时会根据lineHeight进行换行。如果宽度超过maxWidth但isWrap为假时超出部分会被省略号...代替。
			 * @property {Number} x 待绘制的文本左上角的实际画布坐标X
			 * @property {Number} y 待绘制的文本左上角的实际画布坐标Y
			 * @property {Number} size 待绘制的文本大小（单位与画布实际大小一致，为px）
			 * @property {String} color 待绘制的文本颜色
			 * @property {Number} maxWidth 待绘制的文本在实际画布中的限制宽度（单位与画布实际大小一致，为px），如果超过此宽度则根据isWrap进行换行或省略
			 * @property {Boolean} isWrap 待绘制的文本在超出限制宽度时是否换行，为真时换行，否则省略。
			 * @property {Number} lineHeight 待绘制的文本距离的顶部Y坐标下一行顶部Y坐标的距离（单位与画布实际大小一致，为px）。
			 * @example addText("百度一下,你就知道", 19, 708, 34, "#1A59FE", 453, false, 40);
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			addText(text, x, y, size, color, maxWidth, isWrap, lineHeight) {
				if (!maxWidth)
					maxWidth = 99999;
				if (!lineHeight)
					lineHeight = size;
				this.waitingList.push({
					type: "text",
					data: {
						text,
						x,
						y,
						size,
						color,
						maxWidth,
						isWrap: !!isWrap,
						lineHeight: lineHeight
					}
				});
				return this;
			},
			/**
			 * addRect方法
			 * @description 本方法用于向Canvas上添加矩形，通常用于设计图的背景色区域填充
			 * @property {Number} x 待绘制的矩形左上角的实际画布坐标X
			 * @property {Number} y 待绘制的矩形左上角的实际画布坐标Y
			 * @property {Number} w 待绘制的矩形在实际画布中的宽度
			 * @property {Number} h 待绘制的矩形在实际画布中的高度
			 * @property {String} color 待绘制的矩形颜色
			 * @example addRect(0, 690, 750, 158, "#FEFEFE")
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			addRect(x, y, w, h, color) {
				this.waitingList.push({
					type: "rect",
					data: {
						x,
						y,
						w,
						h,
						color
					}
				});
				return this;
			},
			/**
			 * addCustom方法
			 * @description 本方法用于满足自定义绘制的需求。
			 * 【注意】不要在该方法中进行绘制（调用draw方法），绘制应交给draw方法最终统一绘制。
			 * @property {Function} func 回调函数，参数为当前Canvas的Context对象。考虑到异步情况，请为该方法返回Promise对象或将该方法设置为async方法。
			 * @example addCustom(async (canvas)=>{
					await canvas.setContextProp("fillStyle", "#000000");
					await canvas.callContextMethod("moveTo", [10, 10]);
					await canvas.callContextMethod("rect", [10, 10, 100, 50]);
					await canvas.callContextMethod("lineTo", [110, 60]);
					await canvas.callContextMethod("stroke", []);
				});
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			addCustom(func) {
				this.waitingList.push({
					type: "custom",
					data: func
				});
				return this;
			},
			/**
			 * calcTextLinesWithNewLine方法
			 * @description 本方法用于获取文本在实际绘制时的所有行数组，用户可根据行数乘以行高计算出完整高度。
			 * @property {String} text 待绘制的文本，如果带有换行符\n或宽度超过maxWidth且isWrap为真时会根据lineHeight进行换行。如果宽度超过maxWidth但isWrap为假时超出部分会被省略号...代替。
			 * @property {Number} size 待绘制的文本大小（单位与画布实际大小一致，为px）
			 * @property {Number} maxWidth 待绘制的文本在实际画布中的限制宽度（单位与画布实际大小一致，为px），如果超过此宽度则根据isWrap进行换行或省略
			 * @property {Boolean} isWrap 待绘制的文本在超出限制宽度时是否换行，为真时换行，否则省略。
			 * @example addText("百度一下,你就知道", 34, 453, false);
			 * @return {Array} 包含每行文字的数组。例：["百度一下，你","就知道"]。当isWrap为false时数组中的最后一个字符串可能会以...结尾。
			 */
			async calcTextLinesWithNewLine(text, size, maxWidth, isWrap) {
				let lines = [];
				let arr = text.split("\n");
				for (let i = 0; i < arr.length; i++) {
					let line = arr[i];
					lines = lines.concat(await this.calcTextLines(line, size, maxWidth, isWrap));
				}
				return lines;
			},
			/**
			 * calcTextLines方法
			 * @description 本方法为不转换换行符时获取所有行。本方法为组件私有方法，请不要调用。
			 * @property {String} text 待绘制的文本，如果带有换行符\n或宽度超过maxWidth且isWrap为真时会根据lineHeight进行换行。如果宽度超过maxWidth但isWrap为假时超出部分会被省略号...代替。
			 * @property {Number} size 待绘制的文本大小（单位与画布实际大小一致，为px）
			 * @property {Number} maxWidth 待绘制的文本在实际画布中的限制宽度（单位与画布实际大小一致，为px），如果超过此宽度则根据isWrap进行换行或省略
			 * @property {Boolean} isWrap 待绘制的文本在超出限制宽度时是否换行，为真时换行，否则省略。
			 * @example calcTextLines("百度一下,你就知道", 34, 453, false);
			 * @return {Array} 包含每行文字的数组。例：["百度一下，你","就知道"]。当isWrap为false时数组中的最后一个字符串可能会以...结尾。
			 */
			async calcTextLines(text, size, maxWidth, isWrap) {
				await this.canvas.setContextProp('font', size + 'px sans-serif');
				let charArr = text.split("");
				let ret = [];
				if (!isWrap)
					maxWidth -= (await this.canvas.callContextMethod("measureText", ["..."])).width;
				while (charArr.length != 0) {
					let i;
					for (i = 0; i < charArr.length; i++) {
						let w = (await this.canvas.callContextMethod("measureText", [charArr.slice(0, i + 1).join(
								"")]))
							.width;
						if (w > maxWidth) {
							break;
						}
					}
					ret.push(charArr.splice(0, i + 1).join(""));
					if (!isWrap) {
						if (charArr.length != 0)
							return ret + "...";
						else
							return ret;
					}
				}
				return ret;
			},
			/**
			 * calcTextWidth方法
			 * @description 可以通过本方法获取对应文本绘制后的宽度。
			 * @property {String} text 待绘制的文本，如果带有换行符\n或宽度超过maxWidth且isWrap为真时会根据lineHeight进行换行。如果宽度超过maxWidth但isWrap为假时超出部分会被省略号...代替。
			 * @property {Number} size 待绘制的文本大小（单位与画布实际大小一致，为px）
			 * @example calcTextWidth("百度一下,你就知道", 34);
			 * @return {Number} 文字的宽度。
			 */
			async calcTextWidth(text, size) {
				await this.canvas.setContextProp('font', size + 'px sans-serif');
				return (await this.canvas.callContextMethod("measureText", [text])).width;
			},
			/**
			 * clear方法
			 * @description 本方法用于重置Canvas。
			 * @example clear();
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			async clear() {
				await this.canvas.callContextMethod("clearRect", [0, 0, this.width, this.height]);
				this.backgroundColor = "";
				this.waitingList = [];
				this.src = "";
				return this;
			},
			/**
			 * getImageInfo方法
			 * @description 本方法用于获取图片的宽高等信息，本地图片不能使用该方法。
			 * @property {String} src 图片完整url。
			 * @example getImageInfo("https://www.baidu.com/img/flexible/logo/pc/result.png");
			 * @return {Promise} Promise对象，成功时返回uni.getImageInfo的success情况下的回调对象，否则throw错误。
			 */
			async getImageInfo(src) {
				let that = this;
				return await new Promise((recv, recj) => {
					uni.getImageInfo({
						src: src,
						success: (res) => {
							if (res.errMsg == 'getImageInfo:ok') {
								res.key = src;
								recv(JSON.parse(JSON.stringify(res)));
							} else
								recj(res.errMsg);
						},
						fail(e) {
							recj(e);
						}
					});
				});
			},
			async loadImage(src) {
				return await this.canvas.loadImage(src);
			},
			/**
			 * draw方法
			 * @description 本方法用于实际加载网络图片及异步绘制。可以await该方法实现体验优化。
			 * @example draw();
			 * @return {Promise} 返回Promise对象，当图片下载错误或渲染错误时该方法会throw错误，请务必使用try catch来捕获！
			 */
			async draw() {
				let sid = 1;
				let list = [];
				for (let wid = 0; wid < this.waitingList.length; wid++) {
					let item = this.waitingList[wid];
					if (item.type == "image") {
						let ret = JSON.parse(JSON.stringify(item));
						if (ret.data.isRound) {
							let d = Math.min(ret.data.w, ret.data.h);
							let r = Math.floor(d / 2);
							await this.canvas_temp.refreshWidthHeight(d, d);
							await this.canvas_temp.callContextMethod('save', []);
							await this.canvas_temp.callContextMethod('clearRect', [0, 0, d, d]);
							await this.canvas_temp.callContextMethod('arc', [r, r, r, 0, 2 * Math.PI]);
							await this.canvas_temp.callContextMethod('fill', []);
							await this.canvas_temp.callContextMethod('clip', []);
							await this.canvas_temp.callContextMethod('drawImage', [ret.data.image, 0, 0, d, d]);
							ret.data.image = await this.canvas_temp.callContextMethod('toDataURL', []);
							await this.canvas_temp.callContextMethod('restore', []);
						}
						list.push(ret);
					} else if (item.type == "custom") {
						let t = JSON.parse(JSON.stringify(item));
						t.data = item.data;
						list.push(t);
					} else if (item.type == "qrcode") {
						let config = {
							x: 0,
							y: 0,
							width: 256,
							height: 256
						};
						for (let i in item.data.extraConfig)
							config[i] = item.data.extraConfig[i];
						await this.canvas_temp.refreshWidthHeight(256, 256);
						await this.canvas_temp.callContextMethod('clearRect', [0, 0, 256, 256]);
						await this.canvas_temp.setContextProp('fillStyle', "#FFFFFF");
						await this.canvas_temp.callContextMethod('fillRect', [0, 0, 256, 256]);
						let wh = await (new QRCode(this.canvas_temp, config)).calcCode(item.data.text);
						await this.canvas_temp.refreshWidthHeight(wh.width, wh.height);
						await this.canvas_temp.callContextMethod('clearRect', [0, 0, 256, 256]);
						let ret = JSON.parse(JSON.stringify(item));
						await (new QRCode(this.canvas_temp, config)).makeCode(item.data.text);
						ret.data.image = await this.canvas_temp.callContextMethod('toDataURL', []);
						list.push(ret);
					} else
						list.push(JSON.parse(JSON.stringify(item)));
				};
				if (this.backgroundColor != "") {
					await this.canvas.setContextProp('fillStyle', this.backgroundColor);
					await this.canvas.callContextMethod('fillRect', [0, 0, this.width, this.height]);
				}
				for (let itemIndex = 0; itemIndex < list.length; itemIndex++) {
					let item = list[itemIndex];
					if (item.type == "image") {
						await this.canvas.callContextMethod('drawImage', [item.data.image, item.data.x, item.data.y,
							item.data.w, item.data.h
						]);
					} else if (item.type == "text") {
						await this.canvas.setContextProp('textBaseline', 'top');
						await this.canvas.setContextProp('font', item.data.size + 'px sans-serif');
						await this.canvas.setContextProp('fillStyle', item.data.color);
						let textArr = await this.calcTextLinesWithNewLine(item.data.text, item.data.size, item.data
							.maxWidth, item.data.isWrap);
						for (let line = 0; line < textArr.length; line++)
							await this.canvas.callContextMethod('fillText', [textArr[line], item.data.x, item.data.y +
								line *
								item.data.lineHeight
							]);
					} else if (item.type == "rect") {
						await this.canvas.setContextProp('fillStyle', item.data.color);
						await this.canvas.callContextMethod('fillRect', [item.data.x, item.data.y, item.data.w, item
							.data.h
						]);
					} else if (item.type == "qrcode") {
						await this.canvas.callContextMethod('drawImage', [item.data.image, item.data.x, item.data.y,
							item.data.w, item.data.h
						]);
					} else if (item.type == "custom")
						await item.data(this.canvas);
				};
				return await this.canvas.callContextMethod('toDataURL', []);
			},
			/**
			 * saveImageToPhotosAlbum方法
			 * @description 本方法用于将本实例的src保存到本地相册种。
			 * @example saveImageToPhotosAlbum(src);
			 * @return {Promise} 返回Promise对象，当发生错误时该方法会throw错误，请务必使用try catch来捕获！
			 */
			saveImageToPhotosAlbum(src) {
				// #ifndef H5
				return new Promise(async (recv, recj) => {
					// #ifdef MP
					if (src.startsWith("data:image")) {
						let base64 = src.substring(src.indexOf(",") + 1);
						let tmpFile = wx.env.USER_DATA_PATH + "/" + Date.now() + ".png";
						await new Promise((recv1) => {
							uni.getFileSystemManager().writeFile({
								filePath: tmpFile,
								data: base64,
								encoding: 'base64',
								success: recv1
							})
						});
						src = tmpFile;
					}
					// #endif
					// #ifdef APP-PLUS
					if (src.startsWith("data:image")) {
						const url = "_doc/" + Date.now() + ".png";
						const bitmap = new plus.nativeObj.Bitmap("base64");
						await new Promise((recv1) => bitmap.loadBase64Data(src, recv1));
						await new Promise((recv1) => bitmap.save(url, {
							overwrite: true
						}, () => {
							bitmap.clear();
							recv1();
						}, () => {
							bitmap.clear();
							recj();
						}));
						src = url;
					}
					// #endif
					uni.saveImageToPhotosAlbum({
						filePath: src,
						success: () => {
							recv();
						},
						fail: (e) => {
							recj(e);
						}
					});
				});
				// #endif
				// #ifdef H5
				return new Promise((recv, recj) => {
					let base64 = src;
					let arr = base64.split(',');
					let bytes = atob(arr[1]);
					let ab = new ArrayBuffer(bytes.length);
					let ia = new Uint8Array(ab);
					for (let i = 0; i < bytes.length; i++) {
						ia[i] = bytes.charCodeAt(i);
					}
					let blob = new Blob([ab], {
						type: 'application/octet-stream'
					});
					let url = URL.createObjectURL(blob);
					let a = document.createElement('a');
					a.href = url;
					a.download = new Date().valueOf() + ".png";
					let e = document.createEvent('MouseEvents');
					e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0,
						null);
					a.dispatchEvent(e);
					URL.revokeObjectURL(url);
					recv();
				});
				// #endif
			}
		}
	}
</script>

<style scoped>
	.CANVAS_DRAWER {
		position: fixed;
		left: 750rpx;
		top: 0rpx;
	}
</style>

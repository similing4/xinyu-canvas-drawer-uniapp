<template>
	<view>
		<canvas style="width: 256px;height: 256px;" class="noSeeCanvas" canvas-id="CANVAS_EWM_DRAWER"
			id="CANVAS_EWM_DRAWER"></canvas>
		<canvas :style="{width: width + 'px', height: height + 'px'}" class="noSeeCanvas" canvas-id="CANVAS_DRAWER"
			id="CANVAS_DRAWER"></canvas>
		<slot :src="src"></slot>
	</view>
</template>

<script>
	/**
	 * xinyu-canvas-drawer Canvas绘制器
	 * @description 本组件可用于所有需要进行Canvas绘图的场景。绘制的Canvas组件会被放置到屏幕外面，不会显示在屏幕上。调用draw方法后插槽的src属性会附带绘制完成的图片url，可以进行直接渲染。
	 * 【注意】本组件需要使用ref调用draw方法并await！
	 * @property {Number} width 待绘制的实际图片的宽度
	 * @property {Number} height 待绘制的实际图片的高度
	 * @example 
	 * <xinyu-canvas-drawer ref="poster" :width="750" :height="847">
			<template v-slot="{src}">
				<image :src="src" v-if="src != ''" style="width: 750rpx;height: 847rpx;"></image>
			</template>
		</xinyu-canvas-drawer>
	 */
	import QRCode from "./qrcode/QRCode.js";
	export default {
		name: 'xinyu-canvas-drawer',
		props: {
			width: Number, //待绘制的实际画布的宽度数值，实际画布宽度以px计
			height: Number //待绘制的实际画布的高度数值，实际画布高度以px计
		},
		data() {
			return {
				id: "CANVAS_DRAWER", //这个ID是死的，不能在页面上使用:canvas-id设置canvas-id否则在小程序中会出现空白canvas问题。
				ewm_id: "CANVAS_EWM_DRAWER", //这个ID是死的，不能在页面上使用:canvas-id设置canvas-id否则在小程序中会出现空白canvas问题。
				src: '', //当且仅当draw方法成功调用时此属性才会为canvas当前的url。
				context: null, //当前canvas对象的CanvasContext对象，在组件加载成功后会自动赋值。
				context_ewm: null,
				backgroundColor: "", //背景色，请使用setBackgroundColor方法设置。如果该值为空，则表示该canvas没有画背景色。
				waitingList: [], //所有待渲染数据。只有在调用draw方法时才会进行渲染。
				imageCachePool: [] //图片缓存库，存储图片的信息以避免图片的二次加载
			};
		},
		mounted() {
			this.context = uni.createCanvasContext(this.id, this);
			this.context_ewm = uni.createCanvasContext(this.ewm_id, this);
		},
		methods: {
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
			 * @property {Function} func 回调函数，参数为当前Canvas的CanvasContext对象。考虑到异步情况，请为该方法返回Promise对象或将该方法设置为async方法。
			 * @example addCustom(async (context)=>{
					context.moveTo(10, 10);
					context.rect(10, 10, 100, 50);
					context.lineTo(110, 60);
					context.stroke();
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
			calcTextLinesWithNewLine(text, size, maxWidth, isWrap) {
				var lines = [];
				text.split("\n").map((line) => {
					lines = lines.concat(this.calcTextLines(line, size, maxWidth, isWrap));
				})
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
			calcTextLines(text, size, maxWidth, isWrap) {
				this.context.setFontSize(size);
				var charArr = text.split("");
				var ret = [];
				if (!isWrap)
					maxWidth -= this.context.measureText("...").width;
				while (charArr.length != 0) {
					(() => {
						var i;
						for (i = 0; i < charArr.length; i++) {
							var w = this.context.measureText(charArr.slice(0, i + 1).join("")).width;
							if (w > maxWidth) {
								break;
							}
						}
						ret.push(charArr.splice(0, i + 1).join(""));
					})();
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
			calcTextWidth(text, size) {
				this.context.setFontSize(size);
				return this.context.measureText(text).width;
			},
			/**
			 * clear方法
			 * @description 本方法用于重置Canvas。
			 * @example clear();
			 * @return {VueComponent} 当前实例对象，以便链式调用。
			 */
			clear() {
				this.context.clearRect(0, 0, this.width, this.height);
				this.backgroundColor = "";
				this.waitingList = [];
				this.src = "";
				return this;
			},
			/**
			 * saveImageToPhotosAlbum方法
			 * @description 本方法用于将本实例的src保存到本地相册种。
			 * @example saveImageToPhotosAlbum();
			 * @return {Promise} 返回Promise对象，当发生错误时该方法会throw错误，请务必使用try catch来捕获！
			 */
			saveImageToPhotosAlbum() {
				// #ifndef H5
				return new Promise((recv, recj) => {
					uni.saveImageToPhotosAlbum({
						filePath: this.src,
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
					var base64 = this.src;
					var arr = base64.split(',');
					var bytes = atob(arr[1]);
					let ab = new ArrayBuffer(bytes.length);
					let ia = new Uint8Array(ab);
					for (let i = 0; i < bytes.length; i++) {
						ia[i] = bytes.charCodeAt(i);
					}
					var blob = new Blob([ab], {
						type: 'application/octet-stream'
					});
					var url = URL.createObjectURL(blob);
					var a = document.createElement('a');
					a.href = url;
					a.download = new Date().valueOf() + ".png";
					var e = document.createEvent('MouseEvents');
					e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0,
						null);
					a.dispatchEvent(e);
					URL.revokeObjectURL(url);
					recv();
				});
				// #endif
			},
			/**
			 * getImageCache方法
			 * @description 本方法用于获取缓存过的图片对象（组件销毁后通过本方法不能获取缓存的图片）。
			 * @property {String} src 缓存的键，即缓存的图片完整url。
			 * @example getImageCache("https://www.baidu.com/img/flexible/logo/pc/result.png");
			 * @return {Object} 返回uni.getImageInfo的success情况下的回调对象，如果缓存不存在则返回null。
			 */
			getImageCache(src) {
				for (var i in this.imageCachePool)
					if (this.imageCachePool[i].key == src)
						return this.imageCachePool[i];
				return null;
			},
			/**
			 * getImageInfo方法
			 * @description 本方法用于获取图片的宽高等信息，本地图片不能使用该方法。
			 * @property {String} src 图片完整url。
			 * @example getImageInfo("https://www.baidu.com/img/flexible/logo/pc/result.png");
			 * @return {Promise} Promise对象，成功时返回uni.getImageInfo的success情况下的回调对象，否则throw错误。
			 */
			async getImageInfo(src) {
				var that = this;
				return await new Promise((recv, recj) => {
					uni.getImageInfo({
						src: src,
						success: (res) => {
							if (res.errMsg == 'getImageInfo:ok') {
								res.key = src;
								this.imageCachePool.push(res);
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
			//解决小程序编译器报错的问题
			toJSON() {
				//console.log(arguments);
			},
			/**
			 * draw方法
			 * @description 本方法用于实际加载网络图片及异步绘制。可以await该方法实现体验优化。
			 * @example draw();
			 * @return {Promise} 返回Promise对象，当图片下载错误或渲染错误时该方法会throw错误，请务必使用try catch来捕获！
			 */
			async draw() {
				var that = this;
				var sid = 1;
				var list = await Promise.all(this.waitingList.map((item) => {
					if (item.type == "image")
						return new Promise((recv, recj) => {
							var cache = this.getImageCache(item.data.image);
							if (cache) {
								var ret = JSON.parse(JSON.stringify(item));
								ret.data.image = cache.path;
								return recv(ret);
							}
							if (item.data.image.startsWith("data:")) {
								// #ifdef MP
								sid++;
								var env;
								// #ifdef MP-WEIXIN
								env = wx.env;
								// #endif
								// #ifdef MP-QQ
								env = qq.env;
								// #endif
								// #ifdef MP-TOUTIAO
								env = {
									USER_DATA_PATH: "ttfile://user"
								};
								// #endif
								// #ifdef MP-ALIPAY
								env = my.env;
								// #endif
								// #ifdef MP-360
								env = qh.env;
								// #endif
								// #ifdef MP-BAIDU
								env = swan.env;
								// #endif
								var filePath = env.USER_DATA_PATH + '/CANVASTEMP_' + sid +
									'.png';
								var buffer = uni.base64ToArrayBuffer(item.data.image.substring(item
									.data.image.indexOf(",") + 1));
								uni.getFileSystemManager().writeFile({
									filePath: filePath,
									data: buffer,
									encoding: "binary",
									success: () => {
										var ret = JSON.parse(JSON.stringify(item));
										ret.data.image = filePath;
										recv(ret);
									},
									fail: (e) => {
										console.log(e);
										recj(e);
									}
								});
								// #endif
								// #ifndef MP
								var ret = JSON.parse(JSON.stringify(item));
								//非小程序环境下base64本地图片不需要加载临时路径，直接渲染
								recv(ret);
								// #endif
							} else
								uni.getImageInfo({
									src: item.data.image,
									success: (res) => {
										if (res.errMsg == 'getImageInfo:ok') {
											res.key = item.data.image;
											this.imageCachePool.push(res);
											var ret = JSON.parse(JSON.stringify(item));
											ret.data.image = res.path;
											recv(ret);
										} else {
											recj(res.errMsg);
										}
									},
									fail(e) {
										recj(e);
									}
								});
						});
					else if (item.type == "custom")
						return new Promise((recv, recj) => {
							var t = JSON.parse(JSON.stringify(item));
							t.data = item.data;
							recv(t);
						});
					else if (item.type == "qrcode")
						return new Promise(async (recv, recj) => {
							var config = {
								x: 0,
								y: 0,
								width: 256,
								height: 256
							};
							for (var i in item.data.extraConfig)
								config[i] = item.data.extraConfig[i];
							this.context_ewm.clearRect(0, 0, 256, 256);
							this.context_ewm.setFillStyle("#FFFFFF");
							this.context_ewm.fillRect(0, 0, 256, 256);
							var rect = (new QRCode(this.context_ewm, config)).makeCode(item
								.data.text);
							await new Promise((recv) => {
								this.context_ewm.draw(true, (ret) => {
									recv(ret);
								});
							});
							uni.canvasToTempFilePath({
								x: 0,
								y: 0,
								width: rect.width,
								height: rect.height,
								destWidth: rect.width,
								destHeight: rect.height,
								canvasId: this.ewm_id,
								success: (res) => {
									var ret = JSON.parse(JSON.stringify(item));
									ret.data.image = res.tempFilePath;
									recv(ret);
								},
								fail(err) {
									recj(err);
								}
							}, this);
						});
					else
						return new Promise((recv, recj) => {
							recv(JSON.parse(JSON.stringify(item)));
						});
				}));
				if (this.backgroundColor != "") {
					this.context.setFillStyle(this.backgroundColor);
					this.context.fillRect(0, 0, this.width, this.height)
				}
				list.map((item) => {
					if (item.type == "image") {
						if (item.data.isRound) {
							this.context.save();
							var r = Math.floor(item.data.w / 2);
							var d = r * 2;
							var cx = item.data.x + r;
							var cy = item.data.y + r;
							this.context.arc(cx, cy, r, 0, 2 * Math.PI);
							this.context.fill();
							this.context.clip();
							this.context.drawImage(item.data.image, item.data.x, item.data.y, d, d);
							this.context.restore();
						} else
							this.context.drawImage(item.data.image, item.data.x, item.data.y, item.data.w, item
								.data.h);
					} else if (item.type == "text") {
						this.context.setTextBaseline('top')
						this.context.setFontSize(item.data.size);
						this.context.setFillStyle(item.data.color);
						var textArr = this.calcTextLinesWithNewLine(item.data.text, item.data.size, item.data
							.maxWidth, item.data.isWrap);
						for (var line = 0; line < textArr.length; line++)
							this.context.fillText(textArr[line], item.data.x, item.data.y + line * item.data
								.lineHeight);
					} else if (item.type == "rect") {
						this.context.setFillStyle(item.data.color);
						this.context.fillRect(item.data.x, item.data.y, item.data.w, item.data.h);
					} else if (item.type == "qrcode") {
						this.context.drawImage(item.data.image, item.data.x, item.data.y, item.data.w, item
							.data.h);
					} else if (item.type == "custom")
						item.data(this.context);
				});
				var res = await new Promise((recv) => {
					this.context.draw(true, (ret) => {
						recv(ret);
					});
				});
				var that = this;
				return new Promise((recv, recj) => {
					uni.canvasToTempFilePath({
						x: 0, // 起点坐标
						y: 0,
						width: that.width,
						height: that.height,
						destWidth: that.width,
						destHeight: that.height,
						canvasId: that.id,
						success: (res) => {
							that.src = res.tempFilePath;
							recv(that.src);
						},
						fail(e) {
							recj(e);
						}
					}, this)
				});
			}
		}
	}
</script>

<style scoped>
	.noSeeCanvas {
		position: fixed;
		left: 750rpx;
		top: 0rpx;
	}
</style>

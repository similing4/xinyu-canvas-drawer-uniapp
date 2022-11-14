<template>
	<view>
		<view
			:style="{width: styleWidth == -1 ? rpx(750) : rpx(styleWidth),height: styleHeight == -1 ? '100vh' : rpx(styleWidth)}">
			<!-- #ifdef MP-ALIPAY -->
			<canvas type="2d" :disable-scroll="true"
				:style="{width: styleWidth == -1 ? rpx(750) : rpx(styleWidth),height: styleHeight == -1 ? '100vh' : rpx(styleWidth)}"
				@touchstart="onTouch('start', $event)" @touchmove="onTouch('move', $event)"
				@touchend="onTouch('end', $event)" id="xinyu_cross_canvas" @ready="onCanvasInitReadyAlipay"></canvas>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN -->
			<canvas type="2d" :disable-scroll="true"
				:style="{width: styleWidth == -1 ? rpx(750) : rpx(styleWidth),height: styleHeight == -1 ? '100vh' : rpx(styleWidth)}"
				@touchstart="onTouch('start', $event)" @touchmove="onTouch('move', $event)"
				@touchend="onTouch('end', $event)" id="xinyu_cross_canvas"></canvas>
			<!-- #endif -->
			<!-- #ifndef MP -->
			<view :renderjs_data="renderjsContextProp" :change:renderjs_data="xinyucrosscanvas.setContextPropRenderjs">
			</view>
			<view :renderjs_data="renderjsContextMethodCall"
				:change:renderjs_data="xinyucrosscanvas.callContextMethodRenderjs">
			</view>
			<view :renderjs_data="renderjsData" :change:renderjs_data="xinyucrosscanvas.refreshDataRenderjs"></view>
			<view :renderjs_data="renderJSMountedEvent" :change:renderjs_data="xinyucrosscanvas.onMountedRenderjs">
			</view>
			<view :renderjs_data="renderJSLoadImage" :change:renderjs_data="xinyucrosscanvas.loadImageRenderjs">
			</view>
			<view class="xinyucrosscanvas"></view>
			<!-- #endif -->
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			styleWidth: {
				type: Number,
				default: -1
			},
			styleHeight: {
				type: Number,
				default: -1
			},
			width: {
				type: Number,
				default: 750
			},
			height: {
				type: Number,
				default: 1506
			}
		},
		data() {
			return {
				renderjsData: null,
				renderJSMountedEvent: false,
				renderjsContextProp: null,
				renderjsContextMethodCall: null,
				renderJSLoadImage: null,
				canvas: null,
				context: null,
				inited: false,
				recvMethod: {},
				imageHash: [],
				currentGenerateIndex: 0,
				downXY: {
					x: 0,
					y: 0
				},
			};
		},
		async mounted() {
			this.refreshRenderJS();
			this.renderJSMountedEvent = true;
			// #ifdef MP-WEIXIN
			await this.onCanvasInitReady();
			this.inited = true;
			// #endif
		},
		methods: {
			generateObject(obj) {
				obj.__ = Date.now() + "_" + this.currentGenerateIndex++;
				return obj;
			},
			rpx(rpx) {
				return uni.upx2px(rpx) + 'px';
			},
			onInitFinished() {
				this.inited = true;
			},
			onRenderCallback(callbackObject) {
				let {
					func,
					param
				} = callbackObject;
				if (this.recvMethod[func])
					this.recvMethod[func].apply(this.recvMethod[func], [param]);
			},
			onTouchREvent(e) {
				this.$emit("ctouch", e);
			},
			onTClick(e) {
				this.$emit("cclick", e);
			},
			onTouch(type, e) {
				const px = Math.round(e.changedTouches[0].x / uni.getSystemInfoSync().screenWidth * this.width);
				const py = Math.round(e.changedTouches[0].y / uni.getSystemInfoSync().screenHeight * this.height);
				this.$emit("touch", {
					type,
					px,
					py
				});
				if (type == "start") {
					this.downXY.x = px;
					this.downXY.y = py;
				} else if (type == "end") {
					if ((this.downXY.x - px) * (this.downXY.x - px) + (this.downXY.y - py) * (this.downXY.y - py) < 64)
						this.onTClick({
							px,
							py
						});
					this.downXY.x = 0;
					this.downXY.y = 0;
				}
			},
			getImageHash(src) {
				let ret = this.imageHash.filter((t) => t.key == src);
				if (ret.length > 0)
					return ret[0].val;
				return null;
			},
			setImageHash(src, image) {
				this.imageHash.push({
					key: src,
					val: image
				});
			},
			async loadImage(src) {
				// #ifdef MP
				await new Promise((recv) => {
					if (this.getImageHash(src))
						return recv(this.getImageHash(src));
					const img = this.canvas.createImage();
					this.setImageHash(src, img);
					img.onload = () => {
						recv(img);
					};
					img.src = src;
				});
				// #endif
				// #ifndef MP
				await new Promise((recv) => {
					if (src == this.renderJSLoadImage)
						return recv();
					this.renderJSLoadImage = src;
					this.recvMethod.loadImageRenderJSCallback = recv;
				});
				delete this.recvMethod.loadImageRenderJSCallback;
				// #endif
				return src;
			},
			async loadImageCacheMP(src) {
				return await new Promise((recv) => {
					if (this.getImageHash(src))
						return recv(this.getImageHash(src));
					const img = this.canvas.createImage();
					this.setImageHash(src, img);
					img.onload = () => {
						recv(img);
					};
					img.src = src;
				});
			},
			async drawImage(src, methodParams) {
				// #ifdef MP
				let image = await this.loadImageCacheMP(src);
				this.context["drawImage"].apply(this.context, [image].concat(methodParams));
				// #endif
				// #ifndef MP
				await new Promise((recv) => {
					this.renderjsContextMethodCall = this.generateObject({
						methodName: "drawImage",
						methodParams: [src].concat(methodParams)
					});
					this.recvMethod.callContextMethodCallback = recv;
				});
				delete this.recvMethod.callContextMethodCallback;
				// #endif
			},
			async init() {
				while (true) {
					if (this.inited)
						return;
					await new Promise((t) => setTimeout(t, 200));
				}
			},
			async onCanvasInitReady() {
				await new Promise((recv) => {
					uni.createSelectorQuery()
						.in(this)
						.select("#xinyu_cross_canvas")
						.fields({
							node: true,
							size: true
						})
						.exec((res) => {
							this.canvas = res[0].node;
							this.canvas.width = this.width;
							this.canvas.height = this.height;
							this.context = this.canvas.getContext("2d");
							recv();
						});
				});
			},
			async onCanvasInitReadyAlipay() {
				await new Promise((recv) => {
					uni.createSelectorQuery()
						.in(this)
						.select("#xinyu_cross_canvas")
						.node()
						.exec((res) => {
							this.canvas = res[0].node;
							this.canvas.width = this.width;
							this.canvas.height = this.height;
							this.context = this.canvas.getContext("2d");
							this.inited = true;
							recv();
						});
				});
			},
			async refreshRenderJS() {
				await new Promise((recv) => {
					this.renderjsData = this.generateObject({
						styleWidthRenderJS: this.styleWidth == -1 ? uni.upx2px(750) : uni.upx2px(this
							.styleWidth),
						styleHeightRenderJS: this.styleHeight == -1 ? -1 : uni.upx2px(this
							.styleHeight),
						widthRenderJS: this.width,
						heightRenderJS: this.height
					});
					this.recvMethod.refreshRenderJSCallback = recv;
				});
				delete this.recvMethod.refreshRenderJSCallback;
			},
			async setContextProp(key, val) {
				// #ifdef MP
				this.context[key] = val;
				// #endif
				// #ifndef MP
				await new Promise((recv) => {
					this.renderjsContextProp = this.generateObject({
						key,
						val
					});
					this.recvMethod.setContextPropCallback = recv;
				});
				delete this.recvMethod.setContextPropCallback;
				// #endif
			},
			async callContextMethod(methodName, methodParams) {
				if (methodName == "drawImage")
					return await this.drawImage(methodParams[0], methodParams.slice(1));
				// #ifdef MP
				if (methodName == "toDataURL") {
					return this.canvas.toDataURL.apply(this.canvas, methodParams);
				}
				this.context[methodName].apply(this.context, methodParams);
				// #endif
				// #ifndef MP
				let ret = await new Promise((recv) => {
					this.renderjsContextMethodCall = this.generateObject({
						methodName,
						methodParams
					});
					this.recvMethod.callContextMethodCallback = recv;
				});
				delete this.recvMethod.callContextMethodCallback;
				return ret;
				// #endif
			}
		}
	}
</script>

<script module="xinyucrosscanvas" lang="renderjs">
	// #ifndef MP
	export default {
		data() {
			return {
				canvasRenderJS: null,
				contextRenderJS: null,
				styleWidthRenderJS: -1,
				styleHeightRenderJS: -1,
				widthRenderJS: 750,
				heightRenderJS: 1506,
				initedRenderJS: false,
				downXYRenderJS: {
					x: 0,
					y: 0
				},
				imageHashRenderJS: []
			};
		},
		methods: {
			getImageHashRenderjs(src) {
				let ret = this.imageHashRenderJS.filter((t) => t.key == src);
				if (ret.length > 0)
					return ret[0].val;
				return null;
			},
			setImageHashRenderjs(src, image) {
				this.imageHashRenderJS.push({
					key: src,
					val: image
				});
			},
			onMountedRenderjs(bool) {
				if (!bool || this.initedRenderJS)
					return;
				this.initedRenderJS = true;
				this.canvasRenderJS = document.createElement("canvas");
				this.canvasRenderJS.style.width = this.styleWidthRenderJS + 'px';
				this.canvasRenderJS.style.height = (this.styleHeightRenderJS == -1 ? window.innerHeight : this
					.styleHeightRenderJS) + 'px';
				this.canvasRenderJS.width = this.widthRenderJS;
				this.canvasRenderJS.height = this.heightRenderJS;
				this.contextRenderJS = this.canvasRenderJS.getContext('2d');
				this.canvasRenderJS.ontouchstart = (e) => {
					this.onRenderjsTouch('start', e);
				};
				this.canvasRenderJS.ontouchmove = (e) => {
					this.onRenderjsTouch('move', e);
				};
				this.canvasRenderJS.ontouchend = (e) => {
					this.onRenderjsTouch('end', e);
				};
				document.getElementsByClassName("xinyucrosscanvas")[0].appendChild(this.canvasRenderJS);
				this.$ownerInstance.callMethod("onInitFinished");
			},
			refreshDataRenderjs(data) {
				if (data == null)
					return;
				Object.assign(this, data);
				this.$nextTick(() => {
					this.$ownerInstance.callMethod("onRenderCallback", {
						func: "refreshRenderJSCallback",
						param: null
					});
				});
			},
			async loadImageRenderjs(src) {
				await this.loadRenderJSImageCache(src);
				this.$ownerInstance.callMethod("onRenderCallback", {
					func: "loadImageRenderJSCallback",
					param: null
				});
			},
			async loadRenderJSImageCache(src) {
				return await new Promise((recv) => {
					if (this.getImageHashRenderjs(src))
						return recv(this.getImageHashRenderjs(src));
					const img = new Image();
					this.setImageHashRenderjs(src, img);
					img.onload = () => {
						recv(img);
					};
					img.src = src;
					if (img.complete)
						recv(img);
				});
			},
			setContextPropRenderjs(prop) {
				if (prop == null)
					return;
				this.contextRenderJS[prop.key] = prop.val;
				this.$ownerInstance.callMethod("onRenderCallback", {
					func: "setContextPropCallback",
					param: null
				});
			},
			async callContextMethodRenderjs(prop) {
				if (prop == null)
					return;
				let ret = null;
				if (prop.methodName == "drawImage") {
					let param = prop.methodParams.slice(0);
					param[0] = await this.loadRenderJSImageCache(param[0]);
					ret = this.contextRenderJS.drawImage.apply(this.contextRenderJS, param);
				} else if (prop.methodName == "toDataURL") {
					ret = this.canvasRenderJS.toDataURL.apply(this.canvasRenderJS, prop.methodParams);
				} else
					ret = this.contextRenderJS[prop.methodName].apply(this.contextRenderJS, prop.methodParams);
				this.$ownerInstance.callMethod("onRenderCallback", {
					func: "callContextMethodCallback",
					param: ret
				});
			},
			onRenderjsTouch(type, e) {
				let canvasPosition = this.canvasRenderJS.getBoundingClientRect();
				const px = Math.round((e.changedTouches[0].clientX - canvasPosition.x) / uni.getSystemInfoSync()
					.screenWidth * this.width);
				const py = Math.round((e.changedTouches[0].clientY - canvasPosition.y) / uni.getSystemInfoSync()
					.screenHeight * this.height);
				this.$ownerInstance.callMethod("onTouchREvent", {
					type,
					px,
					py
				});
				if (type == "start") {
					this.downXYRenderJS.x = px;
					this.downXYRenderJS.y = py;
				} else if (type == "end") {
					if ((this.downXYRenderJS.x - px) * (this.downXYRenderJS.x - px) + (this.downXYRenderJS.y - py) * (this
							.downXYRenderJS.y - py) < 64)
						this.$ownerInstance.callMethod("onTClick", {
							px,
							py
						});
					this.downXYRenderJS.x = 0;
					this.downXYRenderJS.y = 0;
				}
			}
		}
	};
	// #endif
</script>

<style>
</style>

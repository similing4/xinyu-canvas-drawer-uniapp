<template>
	<view>
		<xinyu-canvas-drawer ref="poster" :width="750" :height="750">
			<template v-slot="{src}">
				<image :src="src" style="width: 750rpx;height: 750rpx;"></image>
			</template>
		</xinyu-canvas-drawer>
		<view class="bottomButton fixedBottom">
			<view class="button" @click="saveImageToPhotosAlbum">
				下载海报
			</view>
		</view>
	</view>
</template>

<script>
	import XinyuCanvasDrawer from "@/components/xinyu-canvas-drawer/index.vue";
	export default {
		data() {
			return {
				isCanvasLoading: false,
				posterRef: null
			}
		},
		components: {
			XinyuCanvasDrawer
		},
		async mounted() {
			this.posterRef = this.$refs.poster;
			uni.showLoading({
				title: "渲染海报中"
			});
			var img = await this.posterRef
				.setBackgroundColor("#F4F4F4") //指定渲染图片的背景色
				.addRect(0, 0, 750, 198, "#FEFEFE") //绘制矩形
				.addImage(require("@/static/logo.jpg"), 32, 48, 98, 98, true) //绘制圆图片，如果不绘制圆图片最后一个参数可以不传或传false，当最后一个参数为true时圆形的直径为w，h参数将没有意义
				.addQRCode("http://www.shengxinyustudio.com", 585, 22, 130, 130) //绘制二维码（不要太长否则会扫不出来）
				.addText("扫码查看我的主页", 581, 159, 20, "#333333") //绘制文本
				.addImage(require("@/static/logo.jpg"), 19, 219, 707, 451) //绘制云端图片时第一个参数直接传云端图片地址即可，不需要require。注意不要跨域
				.addRect(0, 690, 750, 158, "#FEFEFE")
				.addText("欢迎来到我的网站", 19, 708, 34, "#1A59FE", 453, false)
				.draw();
			this.isCanvasLoading = true;
			uni.hideLoading();
		},
		methods: {
			saveImageToPhotosAlbum() {
				if (!this.isCanvasLoading)
					return this.alert("稍安勿躁，图片还没有加载完哦~");
				this.posterRef.saveImageToPhotosAlbum();
			}
		}
	}
</script>
<style>
	page{
		background-color: #F4F4F4;
	}
</style>

<style lang="less" scoped>
	.bottomButton {
		width: 100%;
		height: 100rpx;
		padding: 9rpx;
		background-color: #FFFFFF;
		border-top: 1px solid #F4F4F4;
		display: flex;
		flex-direction: row;

		.button {
			width: 100%;
			height: 100%;
			border-radius: 8rpx;
			background: #1A59FE;
			font-size: 36rpx;
			font-weight: bold;
			color: #FFFFFF;
			line-height: 52rpx;
			display: flex;
			flex-direction: row;
			justify-content: center;
			align-items: center;
		}
	}

	.fixedBottom {
		position: fixed;
		bottom: 0;
	}
</style>

# xinyu-canvas-drawer-uniapp
uniapp中使用canvas绘制图片的一款组件，可用于海报、分享图等各种图的绘制，多端通用，内聚了所有图片加载处理的过程

# 引入教程：
在页面中引入组件并注册：
```js
import XinyuCanvasDrawer from "@/components/xinyu-canvas-drawer/index.vue";
export default{
	components: {
		XinyuCanvasDrawer
	}
}
```
在页面中使用：
```html
<xinyu-canvas-drawer ref="poster" :width="750" :height="750">
	<template v-slot="{src}">
		<image :src="src" style="width: 750rpx;height: 750rpx;"></image>
	</template>
</xinyu-canvas-drawer>
```

# 组件介绍
其中width为待绘制的图片目标宽度，height为目标高度，单位为px。这个尺寸的canvas不会显示在页面上，渲染过程会在页面外部进行。
slot的部分为待显示的部分，src为渲染的图片，当没有进行渲染操作时src是空字符串，你可以通过src是否为空来判定视图的显示状态

# 渲染过程
渲染过程采用链式操作方法，此方法只能在mounted之后运行，因为没有mounted时$refs.poster是undefined：
```js
this.posterRef = this.$refs.poster;
uni.showLoading({
	title: "渲染海报中"
});
var img = await this.posterRef
	.setBackgroundColor("#F4F4F4") //指定渲染图片的背景色
	.addRect(0, 0, 750, 198, "#FEFEFE") //绘制矩形
	.addImage(require("@/static/logo.jpg"), 32, 48, 98, 98) //绘制本地图片
	.addQRCode("http://www.shengxinyustudio.com", 585, 22, 130, 130) //绘制二维码（不要太长否则会扫不出来）
	.addText("扫码查看我的主页", 581, 159, 20, "#333333") //绘制文本
	.addImage(require("@/static/logo.jpg"), 19, 219, 707, 451) //绘制云端图片时第一个参数直接传云端图片地址即可，不需要require。注意不要跨域
	.addRect(0, 690, 750, 158, "#FEFEFE")
	.addText("欢迎来到我的网站", 19, 708, 34, "#1A59FE", 453, false)
	.draw();
uni.hideLoading();
```
链式操作内置了背景图设置、矩形的绘制、本地/云端图片的绘制、二维码绘制与文本绘制五种绘制功能。最终draw方法返回的是Promise对象，也只有调用draw方法await成功后才可以认为渲染完成了。

# 保存图片
保存图片过程我已经集成了，只需要通过ref调用即可~
```js
this.posterRef = this.$refs.poster;
this.posterRef.saveImageToPhotosAlbum();
```
注意！只有draw方法await成功之后才可以保存图片！否则保存的会是一片空白！

# 更多
更多的内容就不细说了。组件中有完整的代码注释哦~ 本代码我会持续更新！
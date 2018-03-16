# wxappUnpacker
Wechat App(微信小程序,.wxapkg)解包及相关文件(.wxss,.json,.wxs,.wxml)还原工具

## 当前功能如下
- `node wuConfig.js <files...>` 将 app-config.json 中的内容拆分到各个文件对应的.json和app.json，并通过搜索 app-config.jso n所在文件夹下的一些图片文件尝试将 iconData 还原为 iconPath 。
- `node wuJs.js <files...>` 将 app-service.js (或小游戏中的 game.js ) 拆分成一系列原先独立的 javascript 文件，并使用 Uglify-ES 美化，从而尽可能还原编译前的情况。
- `node wuWxml.js <files...>` 将编译/混合到 page-frame.html 中的 wxml 和 wxs 文件还原为独立的、未编译的文件。
- `node wuWxss.js <dirs...>` 通过获取文件夹下的 page-frame.html 和其他 html 文件的内容，还原出编译前 wxss 文件的内容。
- `node wuWxapkg.js [-d] <files...>` 将 wxapkg 文件解包，并将包中上述命令中所提的被编译/混合的文件自动地恢复原状。如果加上 -d 指令，就会保留编译/混合后所生成的新文件，否则会自动删去这些文件。

### 局限
- 实现中很多功能基于特定的版本(wcc-v0.6vv_20180111_fbi)和字符串搜索，所以不能很好的适应各种特殊情况。
- wxml 文件拥有不同于 xml 和 html 文件的字符转义规则，且尚未公开（并非"没有"），因此未能很好的还原相关内容。
- js 文件被压缩后会丢失原始变量名等信息内容无法还原。
- wxs 文件会将所有的变量如 Math 改为 nv_Math ，这里仅通过字符串替换去除。
- 还原 iconPath 时，仅搜索 png 文件。

## 依赖
这些 node.js 程序除了自带的 API 外还依赖于一下包:
[cssbeautify](https://github.com/senchalabs/cssbeautify)、[CSSTree](https://github.com/codenothing/CSSTree)、[VM2](https://github.com/patriksimek/vm2)、[Esprima](https://github.com/jquery/esprima)、[UglifyES](https://github.com/mishoo/UglifyJS2/tree/harmony)

您需要安装这些包才能正确执行这些程序，为了做到这一点，您可以执行以下命令:

    npm install esprima -g
    npm install css-tree -g
    npm install cssbeautify -g
    npm install vm2 -g
    npm install uglify-es -g

此外，这些 node.js 程序之间也有一定的依赖关系，比如他们都依赖于 wuLib.js 。

## 参考
这些实现除了参考微信小程序开发文档、 wxapkg 文件解包后的内容以及通过开发者工具编译的一些 wxml 外，还参考了一些 github 上的相关内容的分析( [unwxapkg.py](https://gist.github.com/feix/32ab8f0dfe99aa8efa84f81ed68a0f3e)、[wechat-app-unpack](https://github.com/leo9960/wechat-app-unpack/) )，在此感谢他们。
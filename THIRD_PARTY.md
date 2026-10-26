# 来源与依赖

- Three.js 0.180.0：MIT，https://github.com/mrdoob/three.js 。使用OrbitControls、RoomEnvironment、GLTF/STL导入导出。
- React / React DOM 19.2.0：MIT，https://github.com/facebook/react 。
- Vite 7.1.0 / React plugin 5.0.4：MIT，https://github.com/vitejs/vite 。
- Phosphor React icons 2.1.10：MIT，https://github.com/phosphor-icons/react 。
- JSZip 3.10.1：MIT or GPLv3（本项目按MIT使用），https://github.com/Stuk/jszip 。

安装包的原始许可证保留在node_modules各包中。源码和构建资源均在本地，不依赖远程CDN。

CyberBrick Mini T组装说明（@DDWMAKER）是用户提供的本地装配参考。此次不复制原完整模型、遥控器协议或发射功能，依据装配关系重新建立参数化概念；新增四轮方案的内部同步传动是建议设计。原始PDF和模型均保留在03。

电机照片（Zave，6V/42:1/190rpm）由用户提供，现作为备选来源保留，不混入现用1:48参数。

控制模块按本机Mosaico voice_car工程的GPIO分配及停止/换向控制思路独立重写，未复制原语音/屏幕实现；ESP-IDF API参考官方文档。Fusion脚本依据Autodesk官方API文档编写。设计概念图使用内置Image Gen生成，保存于design/四轮工作台概念.png，实际三维几何均由代码生成。

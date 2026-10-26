# Maker Car · 四轮参数化工程工作台

本机打开：http://127.0.0.1:5180/ 。双击 `Launch Website.cmd` 启动已构建网页；保持终端运行。不要直接双击 dist/index.html。

GitHub 源码：https://github.com/sytt198/maker-car-studio

公开预览：https://sytt198.github.io/maker-car-studio/

## 从 GitHub 独立运行

```powershell
git clone https://github.com/sytt198/maker-car-studio.git
cd maker-car-studio
npm ci
npm test
npm run models
npm run build
npm start
```

仓库中的 `engineering/` 包含默认模型、自制概念件、BOM、Fusion 源码与控制模块，不依赖原电脑上的01/02/03文件夹。原本机布局存在时，模型脚本仍优先写入相邻的03文件夹；可通过 `MAKER_CAR_ENGINEERING_DIR` 指定工程资料目录。GitHub Actions 会自动检查、构建并发布 GitHub Pages，公开预览仅操作浏览器内的模型与草稿，不连接硬件。

## 最终设计

四个轮胎，无履带、无万向支撑。参考 CyberBrick Mini T 说明书的1:48减速齿轮包与左右独立驱动思路；新增建议的内置1:1同步带使同侧前后两轮联动。底盘默认110×76×2.4 mm，轴距70、轮距94、轮胎Ø40×8。同步带轮、轴承、轮毂和齿轮箱接口仍需按实物适配。

## 工作流程

1. **结构设计**：修改数值/滑杆，校验通过后同步更新三维、BOM和代码。无效输入保留在面板内并显示原因，画面仍显示最后有效配置。支持部件选择、显隐、爆炸、相机预设、PNG、GLB及预览STL。
2. **BOM选型**：14类零件，区分方案指定、待测、自制和建议件。填写单价自动计算已知部分合计，未知价格不记作免费。支持搜索及CSV下载。
3. **硬件接线**：双H桥信号和分路供电说明，可修改GPIO；重复/未允许GPIO被拦截。默认映射来自现有Mosaico小车代码，需要核对扩展模块占用。
4. **动作与代码**：按住方向按钮或显式启用方向键进行开环预览，松开、失焦或切换页面停止。实时生成ESP-IDF组件、配置头文件和集成说明，可复制/下载。
5. **Fusion建模**：下载配置和原生建模脚本，添加到Fusion“脚本和附加模块”，运行后新建参数化设计。原f3d不覆盖。

顶部“导出工程”生成ZIP：当前参数、BOM、自制概念件STL、装配GLB/STL、控制代码、Fusion脚本。它不打包浏览器隐私数据，不受爆炸/显隐状态影响。配置自动保存到当前浏览器，并支持JSON导入导出。

## 文件与单位

- 本项目完整源码、package-lock.json、dist及启动器均在此文件夹。
- `engineering/generated/`（原本机为 `../03 cyberbrick mini T/generated/`）：默认模型、参数、BOM、可打印概念件、模型回读结果。
- `engineering/fusion/MakerCar/`：Fusion脚本及说明。
- `engineering/control/`：当前默认参数生成的ESP-IDF组件。
- GLB以米、Y向上保存；STL以毫米、Z向上保存。网页以毫米、Z向上显示；Fusion装配坐标为XY各平移100 mm，所有相对尺寸相同。

## 尚待验证

Mosaico 60×60×18 mm、齿轮箱44×14×18 mm及3 mm轮轴为临时包络；160 rpm和6 V为可修改的估算/选型初值，并非现用1:48齿轮包实测规格。用户提供42:1电机照片作为备选资料保留，不借用其190 rpm认定现用齿轮包。

没有闭环编码器反馈、负载/滑移/碰撞/强度仿真。网页不连接或驱动硬件。固件组件未做原生ESP-IDF构建、烧录或实机验收。Fusion脚本通过Python语法和离线校验，但未在Fusion会话运行；不提供伪造f3d或把网格叫原生CAD。自制件STL是概念原型，实物量取、配合和紧固细节核定后再打印。

## 开发与再生成

需要Node.js 22.12或更新版本。

```powershell
npm install
npm test
npm run models
npm run build
npm start
```

开发模式：`npm run dev`（同样使用5180端口，先停止生产服务）。模型实际回读：`node scripts/verify-models.mjs`；Fusion离线检查：在上级目录执行 `python "03 cyberbrick mini T/fusion/test_builder.py"`。

技术：React、Three.js、Vite，打包资源本地提供，不使用CDN。01提供配置/几何/Fusion交接思路，02提供硬件、代码、预览的工程流程参考；未套用人形机器人或FoldBot几何及协议。依赖许可证详见THIRD_PARTY.md。

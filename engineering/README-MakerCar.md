# Maker Car 四轮参数化底盘

最终版本：4个轮胎，不用履带。左右各一套1:48齿轮包，通过建议的内置1:1同步带联动同侧前后轮。CyberBrick Mini T原组装说明作为装配关系参考，原1.stl、2.stl、mosaico-test.f3d均未覆盖。

- `generated/assembly.glb`：完整默认四轮装配，可在三维软件中查看（米，Y向上）。
- `generated/assembly-preview-mm.stl`：完整装配网格预览（毫米，Z向上），不是整车作为一件打印的文件。
- `generated/printable-concepts/`：底盘、Mosaico托架、支撑柱、夹持座和前轴支座的概念STL，量取实物并核查配合后再打印。
- `generated/MakerCar-project.json`：默认共用参数，网页可导入；实际修改后从网页保存新JSON。
- `generated/BOM.csv`：本车BOM，未确定零件与单价有独立状态，不用人形机器人BOM。
- `fusion/MakerCar/`：Fusion原生参数化建模脚本，新建文档，读取网页JSON。详见其README。
- `control/`：按同一配置生成的ESP-IDF控制模块和集成说明。

网页完整工程在相邻的 `maker-car web/`。双击其中 `Launch Website.cmd`，或在该目录运行 `npm start` 后打开 http://127.0.0.1:5180/ 。

尺寸初值：底盘110×76×2.4、轴距70、轮距94、轮胎Ø40×8、Mosaico包络60×60×18、齿轮箱包络44×14×18 mm。后两项、轴径、额定电压/电流与160rpm估算都待实测，不能将其当作购买或加工规格。

本次交付真实网格模型与可运行的原生建模脚本。尚未在Fusion执行脚本，因此没有声称生成了新的原生f3d；控制模块未做原生ESP-IDF构建/烧录，也未控制硬件。原生CAD的外观/结构细节与网页预览的差异见fusion说明。

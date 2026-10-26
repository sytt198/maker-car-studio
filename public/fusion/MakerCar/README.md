# Fusion 原生参数化重建

1. 在网页导出当前配置 JSON（或使用 ../../generated/MakerCar-project.json）。
2. Fusion 中打开“实用工具 → 脚本和附加模块”，添加整个 MakerCar 文件夹。运行 MakerCar 脚本并选择 JSON。
3. 脚本先校验配置，随后**新建独立设计**，原来的 mosaico-test.f3d 不会被改写。
4. 在“修改 → 更改参数”调整 chassis_length、chassis_width、wheelbase、wheel_track、wheel_diameter、board_length 等命名参数。草图尺寸、偏移平面和拉伸通过表达式关联；网页也可重新导出配置后重新运行生成新设计。
5. 检查时间线及配合后，自行“另存为”新的 .f3d，或在 Fusion 中导出原生 STEP。

当前脚本只通过 Python 语法和离线配置校验，未在 Fusion 原生会话执行。不能把本脚本当作已验证的 .f3d。若失败，原文档保留，新建的部分设计可能仍在，可关闭后修订脚本。

坐标：网页/STL以小车中心为XY原点、Z向上、毫米；Fusion 为了在正象限建立全驱动尺寸，装配整体在XY各平移+100 mm。轴距、轮距和各件相对位置不变。

原生设计的自制件保留可编辑特征。圆角、视觉胎纹/辐条、装饰性齿形和电路细节只在网页网格中表现；Fusion 对商业轮胎、轮毂、电池和齿轮包使用简单原生实体包络。同步带为包络示意，不是经过选型的齿数/节距/张紧设计。夹持座在原生设计中拆为独立壁和桥件特征；最终制造前应按实际需要合并和核查孔位。网页 STL 和 Fusion 原生体在这些外观/特征细节上有明确差异。

Mosaico 60×60×18、齿轮箱44×14×18、轴径3 mm为临时参数。1:48来自组装说明；原42:1电机图片不证明现用齿轮包的RPM、电压、轴形或堵转电流。必须量取实物后再做轮毂、轴承和夹具的配合。

API参考：https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_SketchDimensions_addDistanceDimension.htm
https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_DistanceExtentDefinition.htm

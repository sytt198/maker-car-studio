# Maker Car 四轮控制模块

状态：生成的集成模块，未编译、未烧录、未做新底盘实物验收。目标 ESP32-S31 / ESP-IDF，非 Arduino 草稿。

将本目录放到现有工程 components/maker_car/，将 integration_example.c 移到说明目录或由主应用按需调用（不由本组件自动编译）。CMakeLists.txt 仅编译 car_control.c。主应用引用 car_control.h，先初始化，再从已验证输入通道调用 car_command(m/s,rad/s)，停止与断开调用 car_stop()。

四轮通过同侧1:1同步传动共享左右两路命令，1:48为齿轮包减速比；参数中的 outputRPM 是减速后转速估算，不再除以48。无编码器，PWM与速度不构成精确线性关系。轮距94 mm、轮径40 mm。

默认左轮 GPIO11/10，右轮 GPIO46/47。四路信号连接双H桥逻辑输入，绝不能直接接电机。电机电源按实际额定电压适配（当前暂设6V），与Mosaico供电分路，共地。驱动nSLEEP/EN、输入逻辑与实际模块限流需要先按数据手册接好。驱动建议型号不是实物已适配结论。

LEDC timer3、channel4–7、8bit/16kHz由本模块独占；集成已有显示/舵机/音频工程前核对资源占用。通信超时400ms停止；换向前清零并等待40ms；最大占空比40%。这些机制必须在实际上板测试后验收。

网页仅做运动学预览，不发送USB/网络指令，也不会显示虚构连接状态。本模块没有假定某个已存在的串口协议；用现有语音工程的事件入口或自己实现的通信层调用它。

来源：本机 E:/ESP-Mosaico/test-esp-mosaico/voice_car 的双路GPIO/停止与换向思路；本模块为独立重写，不复制原语音、屏幕或电源初始化。GPIO官方参考：https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s31/esp-mosaico/user_guide.html
LEDC参考：https://docs.espressif.com/projects/esp-idf/en/latest/esp32s31/api-reference/peripherals/ledc.html

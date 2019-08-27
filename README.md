# community
一个基于玩家合作的桌面游戏框架;

A Framework of Desktop Game Based on Player Cooperation;

basictest目录下是后端java代码;

static目录下是前端代码;

application.yml是SpringBoot2配置文件;

pom.xml是Maven配置文件;

playground.mv.db和playground.trace.db是h2数据库文件;

完整工程上传到百度网盘https://pan.baidu.com/s/1R9-CEYG9UgmSxK74jE_v3Q

提取码：bb7m

其中target目录下有编译完成的jar包

执行basictest.bat即可启动服务端（需要先配置java运行环境并启动h2数据库），服务端监听8181和2323端口。

启动服务端后用浏览器依次打开

http://localhost:8181/HTML/PAGE/BasicTest.html#127.0.0.1@8181@2323@a@test3_a@yes@test3

http://localhost:8181/HTML/PAGE/BasicTest.html#127.0.0.1@8181@2323@b@test3_b@yes@test3

http://localhost:8181/HTML/PAGE/BasicTest.html#127.0.0.1@8181@2323@world@test3_world@yes@test3

即可运行测试场景。

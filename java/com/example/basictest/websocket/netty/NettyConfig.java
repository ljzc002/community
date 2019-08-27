package com.example.basictest.websocket.netty;

import com.example.basictest.websocket.pojo.WsUser;
import com.example.basictest.websocket.pojo.WsSession;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.util.concurrent.GlobalEventExecutor;

import java.util.HashMap;
import java.util.Map;

//Netty的配置属性和保存会话的group
/**
 * Created by lz on 2019/1/8.
 */
public class NettyConfig {
    // 存储所有连接的 channel
    public static ChannelGroup group = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    // host name 和监听的端口号，需要配置到配置文件中
    public static String WS_HOST = "127.0.0.1";
    public static int WS_PORT = 2323;
    //存储所有的在线用户，一个用户可能有多个ws会话
    public static Map<String, WsUser> mapUser=new HashMap<String, WsUser>();
    //建立一个和ChannelGroup同步的map session用来保存每个channel的信息
    public static Map<String,WsSession> mapSession=new HashMap<String, WsSession>();

}

package com.example.basictest.websocket.netty;

import com.example.basictest.websocket.pojo.WsMessage;
import com.example.basictest.websocket.pojo.WsSession;
import com.example.basictest.websocket.pojo.WsUser;
import com.example.basictest.websocket.util.MyNettyUtil;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.websocketx.*;
import io.netty.util.AsciiString;
import io.netty.util.AttributeKey;
import io.netty.util.CharsetUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

/**
 * Created by lz on 2019/1/8.
 */
//@Component
public class WebSocketServer extends SimpleChannelInboundHandler<Object> {
    //@Autowired
    //WebSocketHandler webSocketHandler;
    private WebSocketServerHandshaker handshaker;
    private AsciiString contentType = HttpHeaderValues.TEXT_PLAIN;
    // onmsg
    // 有信号进来时
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception
    {//ChannelHandlerContext在handler之间传递上下文
        if(msg instanceof FullHttpRequest){
            handHttpRequest(ctx, (FullHttpRequest) msg);
        }else if(msg instanceof WebSocketFrame){
            handWsMessage(ctx, (WebSocketFrame) msg);
        }
    }

    // onopen
    // Invoked when a Channel is active; the Channel is connected/bound and ready.
    // 当连接打开时，这里表示有数据将要进站。
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        NettyConfig.group.add(ctx.channel());//group中保存所有建立会话的channel
        WsSession wsSession=new WsSession();
        wsSession.ChannelId=ctx.channel().id().toString();

        NettyConfig.mapSession.put(wsSession.ChannelId,wsSession);//为连接通道关联一个session
    }

    // onclose
    // Invoked when a Channel leaves active state and is no longer connected to its remote peer.
    // 当连接要关闭时
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        //broadcastWsMsg( ctx, new WsMessage("oneChannelClose", ctx.channel().id().toString() ) );
        NettyConfig.group.remove(ctx.channel());
        NettyConfig.mapSession.remove(ctx.channel().id().toString());//同步删除session
    }

    // onmsgover
    // Invoked when a read operation on the Channel has completed.
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }

    // onerror
    // 发生异常时
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }

    // 集中处理 ws 中的消息
    private void handWsMessage(ChannelHandlerContext ctx, WebSocketFrame msg) {
        if(msg instanceof CloseWebSocketFrame){
            // 关闭指令
            handshaker.close(ctx.channel(), (CloseWebSocketFrame) msg.retain());
        }
        if(msg instanceof PingWebSocketFrame) {
            // ping 消息
            ctx.channel().write(new PongWebSocketFrame(msg.content().retain()));
        }else if(msg instanceof TextWebSocketFrame)
        {
            TextWebSocketFrame message = (TextWebSocketFrame) msg;
            // 文本消息
            //WsMessage wsMessage = JSON.parseObject(message.text(),WsMessage.class);//gson.fromJson(message.text(), WsMessage.class);
            WebSocketHandler webSocketHandler = new WebSocketHandler();
            webSocketHandler.SwitchMessageType(message.text(),ctx);

        }else {
            // donothing, 暂时不处理二进制消息
        }
    }

    private SimpleDateFormat df=new SimpleDateFormat("yyyy-MM-dd");
    private String str_gzrq=df.format(new Date());
    // 处理 http 请求，WebSocket 初始握手 (opening handshake ) 都始于一个 HTTP 请求
    private void handHttpRequest(ChannelHandlerContext ctx, FullHttpRequest  msg) {
        if(!msg.decoderResult().isSuccess())//如果解码失败
        {
            sendHttpResponse(ctx, new DefaultFullHttpResponse(HttpVersion.HTTP_1_1,
                    HttpResponseStatus.BAD_REQUEST));
            return;
        }
        else if(!("websocket".equals(msg.headers().get("Upgrade"))))
        {//这部分http的内容交给tomcat去做
            //如果不是ws握手请求
            //decoderResult是指解码是否成功，而不是实际的解码结果！
            //String str_res=msg.decoderResult().toString();
            //这个返回的是msg的描述信息，比如长度之类的！
            //String str_res=msg.content().toString();
            String str_uri=msg.uri();//发现favicon.ico的请求也会到达这里。。。

            String str_param=MyNettyUtil.convertByteBufToString(msg.content());//数据被netty整理成了类似get参数字符串的形式？？！！
            Map<String, String> mapParam = MyNettyUtil.SplitParam(str_param);
            String str_func=mapParam.get("func");
            //String str_res="";
            JSONObject obj_json=new JSONObject();

            DefaultFullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1,
                    HttpResponseStatus.OK,
                    Unpooled.wrappedBuffer(JSON.toJSONString(obj_json).getBytes()));
            HttpHeaders heads = response.headers();
            heads.add(HttpHeaderNames.CONTENT_TYPE, contentType + "; charset=UTF-8");
            heads.add(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
            heads.add(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
            ctx.write(response);
            return;
        }
        WebSocketServerHandshakerFactory factory = new WebSocketServerHandshakerFactory("ws://"
                + NettyConfig.WS_HOST + NettyConfig.WS_PORT, null, false);
        handshaker = factory.newHandshaker(msg);
        if(handshaker == null){
            WebSocketServerHandshakerFactory.sendUnsupportedVersionResponse(ctx.channel());
        } else {
            handshaker.handshake(ctx.channel(), msg);
        }
    }

    // 处理错误的Http请求
    private void sendHttpResponse(ChannelHandlerContext ctx, DefaultFullHttpResponse res) {
        if(res.status().code() != 200){
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
        }
        ChannelFuture f = ctx.channel().writeAndFlush(res);
        if(res.status().code() != 200){
            f.addListener(ChannelFutureListener.CLOSE);
        }
    }

    // 广播 websocket 消息（不给自己发）
    public static void broadcastWsMsg(String str_json,String ChannelId) {
        NettyConfig.group.stream()
                .filter(channel -> channel.id().toString() != ChannelId)
                .forEach(channel -> {
                    channel.writeAndFlush( new TextWebSocketFrame( str_json));
                });
    }
    // 向一个user的所有连接广播 websocket 消息
    public static void broadcastWsMsg2(String str_json,String UserId,String ChannelId) {
        NettyConfig.group.stream()
                .filter(channel -> ((NettyConfig.mapSession.get(channel.id().toString()).UserId.equals(UserId)&&channel.id().toString()!=ChannelId )))
                .forEach(channel -> {
                    channel.writeAndFlush( new TextWebSocketFrame( str_json));
                });
    }
    // 向一个user的第一个连接发送 websocket 消息
    public static void broadcastWsMsg3(String str_json,String UserId,String ChannelId) {

        NettyConfig.group.stream()
                .filter(channel -> ((NettyConfig.mapSession.get(channel.id().toString()).UserId.equals(UserId)&&!channel.id().toString().equals(ChannelId) )))
                .forEach(channel -> {
                    channel.writeAndFlush( new TextWebSocketFrame( str_json));
                    return ;
                });
    }
    //向一个user以外的所有连接发送websocket消息
    public static void broadcastWsMsg4(String str_json,String UserId,String ChannelId) {

        NettyConfig.group.stream()
                .filter(channel -> ((!NettyConfig.mapSession.get(channel.id().toString()).UserId.equals(UserId)
                        &&!channel.id().toString().equals(ChannelId) )))
                .forEach(channel -> {
                    channel.writeAndFlush( new TextWebSocketFrame( str_json));
                    return ;
                });
    }

    //针对某一连接的私聊
    public static void PrivateTalk(String str_json,String ChannelId)
    {
        NettyConfig.group.stream()
                .filter(channel -> channel.id().toString().equals(ChannelId) )//这里可能不只一个？？
                .forEach(channel -> {
                    channel.writeAndFlush( new TextWebSocketFrame( str_json));
                });
        /*for(Websocket item: webSocketSet)
        {
            if(item.sessionId.equals(sessionId))
            {
                try {
                    item.sendMessage(str_json);
                } catch (IOException e) {
                    e.printStackTrace();
                    //continue;
                }
                break;
            }
        }*/
    }

}

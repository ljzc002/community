package com.example.basictest.websocket.netty;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.stream.ChunkedWriteHandler;

/**
 * Created by lz on 2019/1/8.
 */
//使用 ChannelPipeline 将各种 ChannerHandler 串起来
public class ServerInitializer extends ChannelInitializer<Channel> {
    @Override
    protected void initChannel(Channel channel) throws Exception {
        ChannelPipeline pipeline = channel.pipeline();
        pipeline.addLast("http-codec", new HttpServerCodec());
        pipeline.addLast("aggregator",new HttpObjectAggregator(65536));
        pipeline.addLast("http-chunked", new ChunkedWriteHandler());
        pipeline.addLast("handler", new WebSocketServer());
    }
}

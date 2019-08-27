package com.example.basictest.websocket.netty;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;

/**
 * Created by lz on 2019/1/8.
 */
//启动和销毁 Netty 的程序
    @Component
    public class ServerBootStrap {
        private final EventLoopGroup bossGroup = new NioEventLoopGroup();
        private final EventLoopGroup workGroup = new NioEventLoopGroup();
        private Channel channel;

        public ChannelFuture start(InetSocketAddress address) {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ServerInitializer())//处理响应的channel
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true);

            ChannelFuture future = bootstrap.bind(address).syncUninterruptibly();
            channel = future.channel();
            return future;
        }

        public void destroy() {
            if(channel != null) {
                channel.close();
            }
            NettyConfig.group.close();
            workGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }


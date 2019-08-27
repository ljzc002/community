package com.example.basictest;

import com.alibaba.druid.pool.DruidDataSource;
import com.example.basictest.websocket.netty.NettyConfig;
import com.example.basictest.websocket.netty.ServerBootStrap;
import io.netty.channel.ChannelFuture;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;

import java.net.InetSocketAddress;

@SpringBootApplication
public class BasictestApplication implements CommandLineRunner{

    @Autowired
    private ServerBootStrap ws;
    public static DruidDataSource ds ;

    public static void main(String[] args) {
        ds  = new DruidDataSource();
        ds.setDriverClassName("org.h2.Driver");
        ds.setUrl("jdbc:h2:tcp://127.0.0.1/../../playground");
        ds.setUsername("playground");
        ds.setPassword("playground");
        ds.setMaxActive(100);

        SpringApplication.run(BasictestApplication.class, args);
    }
    @Override
    public void run(String... args) throws Exception {
        System.out.print("Netty开始监听："+NettyConfig.WS_PORT);
        InetSocketAddress address = new InetSocketAddress(NettyConfig.WS_HOST, NettyConfig.WS_PORT);
        ChannelFuture future = ws.start(address);

        Runtime.getRuntime().addShutdownHook(new Thread(){
            @Override
            public void run() {
                ws.destroy();
            }
        });

        future.channel().closeFuture().syncUninterruptibly();


    }
}

package com.example.basictest.websocket.util;

import io.netty.buffer.ByteBuf;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by lz on 2019/3/4.
 */
public class MyNettyUtil {
    //将字节缓冲转换为字符串
    public static String convertByteBufToString(ByteBuf buf) {
        String str;
        if(buf.hasArray()) { // 处理堆缓冲区
            str = new String(buf.array(), buf.arrayOffset() + buf.readerIndex(), buf.readableBytes());
        } else { // 处理直接缓冲区以及复合缓冲区
            byte[] bytes = new byte[buf.readableBytes()];
            buf.getBytes(buf.readerIndex(), bytes);
            str = new String(bytes, 0, buf.readableBytes());
        }
        return str;
    }

    /**
     * 解析出url参数中的键值对
     * 如 "index.jsp?Action=del&id=123"，解析出Action:del,id:123存入map中
     * @param strUrlParam  url请求参数部分
     * @return  url请求参数部分
     */
    public static Map<String, String> SplitParam(String strUrlParam)
    {
        Map<String, String> mapRequest = new HashMap<String, String>();

        String[] arrSplit=null;

        //String strUrlParam=TruncateUrlPage(URL);
        if(strUrlParam==null)
        {
            return mapRequest;
        }
        //每个键值为一组 www.2cto.com
        arrSplit=strUrlParam.split("[&]");
        for(String strSplit:arrSplit)
        {
            String[] arrSplitEqual=null;
            arrSplitEqual= strSplit.split("[=]");

            //解析出键值
            if(arrSplitEqual.length>1)
            {
                //正确解析
                mapRequest.put(arrSplitEqual[0], arrSplitEqual[1]);

            }
            else
            {
                if(arrSplitEqual[0]!="")
                {
                    //只有参数没有值，不加入
                    mapRequest.put(arrSplitEqual[0], "");
                }
            }
        }
        return mapRequest;
    }

    //从map中按key取值，如为空则返回""
    public static String GetStringFromMap(Map<String,Object> map,String key)
    {
        Object obj_temp=map.get(key);
        String res_str=obj_temp!=null?obj_temp.toString():"";
        return res_str;
    }
}


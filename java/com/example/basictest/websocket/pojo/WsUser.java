package com.example.basictest.websocket.pojo;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by lz on 2019/2/28.
 */
//代替数据库存储数据的用户类，一个用户可能同时使用好几个ws连接
    //@Data 注解由 lombok 提供，它会自动帮我们生产 getter/setter 方法
@Data
public class WsUser {
    public String userId;//一个用户的id
    public String passWord;//这个用户的密码，这个类是用来在服务端代替数据库的
    public int alive;//1表示活着，可以参与互动
    public String json_data;//这个用户的配置信息
    public String token;
    public List<JSONObject> arr_handcard;
    public List<JSONObject> arr_union;

    //用户的图片信息如何保存？-》在文件系统中，用文件流访问？用文件名区分
    //构造方法
    public WsUser(String userId, String passWord) {
        this.userId = userId;
        this.passWord = passWord;
        this.alive=1;//默认都是参与者，特别设定后变为旁观者
        this.json_data = "";
        arr_handcard=new ArrayList<JSONObject>();//一开始为空，稍后由用户自己选择填充
        arr_union=new ArrayList<JSONObject>();//包括背面向上放入的情况《-全部平躺放入？->还是站立更好
    }

    /*如果是多人编程，建议使用setget方法，可以在get和set中方一些校验方法，防止别人随便修改自己的对象
   */
}

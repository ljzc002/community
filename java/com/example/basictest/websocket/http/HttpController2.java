package com.example.basictest.websocket.http;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.example.basictest.websocket.netty.NettyConfig;
import com.example.basictest.websocket.netty.WebSocketServer;
import com.example.basictest.websocket.pojo.WsUser;
import com.example.basictest.websocket.util.MyNettyUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Created by lz on 2019/3/7.
 */
@Controller
@ResponseBody
public class HttpController2 {
    private SimpleDateFormat df=new SimpleDateFormat("yyyy-MM-dd");
    private String str_gzrq=df.format(new Date());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    //这是强行弄成像servlet一样了
    //尝试用数据库存储所有状态（假设前台提交频率较低），用数据库代替httpSession！！！！
    @RequestMapping("/Login.ashx")
    public String HandleLogin(@RequestBody String str_param)throws Exception
    {   //str_param是http请求的body，这里直接以字符串方式使用它
        Map<String, String> mapParam = MyNettyUtil.SplitParam(str_param);
        String str_func=mapParam.get("func");
        JSONObject obj_json=new JSONObject();
        try{
            switch(str_func)
            {
                case "get_login":
                {
                    String str_czyid=mapParam.get("czyid");
                    String str_czymm=mapParam.get("czymm");
                    //从数据库中寻找这个用户，如果有则返回它的token，认为最多有一个结果
                    String str_sql="SELECT uuid,password FROM tb_user WHERE userid=? AND sfky=1";
                    //这个方法查到0或超过1条会报错？!
                    //String str_res = jdbcTemplate.queryForObject(str_sql,String.class);
                    //这个方法只能查一列？
                    //List<String[]> list = jdbcTemplate.queryForList(str_sql,new Object[]{str_czyid},String[].class);
                    //这个方法处理不定列名时很麻烦，并且map的value为null时转String可能报错
                    List<Map<String, Object>> list = jdbcTemplate.queryForList(str_sql,str_czyid);
                    if(list.size()>0)
                    {
                        String password=(String) list.get(0).get("password");
                        if(str_czymm.equals(password))
                        {//如果用户名和密码匹配，则把这个用户的uuid作为token交给这个终端，
                            String token=(String) list.get(0).get("uuid");
                            obj_json.put("state","OK");
                            obj_json.put("token",token);
                        }
                        else
                        {
                            obj_json.put("state","Exception");
                            obj_json.put("content","这个用户名已经被占用，请换一个用户名或者输入正确的密码");
                        }
                    }
                    else
                    {
                        String uuid = UUID.randomUUID().toString();
                        Random rand = new Random();
                        String jsonstate="{\"posx\":"+(rand.nextInt(100)-50)+",\"posz\":"+(rand.nextInt(100)-50)+",\"posy\":10,\"rotx\":0,\"roty\":0,\"rotz\":0}";
                        String str_sql2="insert into tb_user values('"+uuid+"','"+str_czyid+"','"+str_czymm+"',1,'test',sysdate,null,'"+jsonstate+"')";
                        //如果在world已经登录的情况又建立了一个新的用户，则需要通知world这个用户的建立，刚建立的用户位于随机的位置，并且没有任何单位
                        int k=jdbcTemplate.update(str_sql2);
                        if(k==1)
                        {
                            obj_json.put("state","OK");
                            obj_json.put("token",uuid);

                            JSONObject obj_msg=new JSONObject();
                            obj_msg.put("type","addanewuser");
                            obj_msg.put("jsonstate",jsonstate);
                            obj_msg.put("id",str_czyid);
                            obj_msg.put("uuid",uuid);
                            //告诉world用户，有一个新用户进入
                            WebSocketServer.broadcastWsMsg3(JSON.toJSONString(obj_msg),"world","");
                        }
                        else
                        {
                            obj_json.put("state","Exception");
                            obj_json.put("content","登录失败！");
                        }
                    }
                    return JSON.toJSONString(obj_json);
                    //break;
                }
                case "check_session":
                {
                    String str_czyid=mapParam.get("czyid");
                    String str_token=mapParam.get("token");
                    String str_sql="SELECT userid FROM tb_user WHERE uuid='"+str_token+"' AND sfky=1";
                    List<String[]> list = jdbcTemplate.queryForList(str_sql,String[].class);
                    if(list.size()>0)
                    {
                        String userid=list.get(0)[0];
                        if(userid.equals(str_czyid))
                        {
                            obj_json.put("state","OK");
                            str_gzrq=df.format(new Date());
                            JSONObject obj_json2=new JSONObject();
                            obj_json2.put("dlrq",str_gzrq);
                            obj_json.put("content",obj_json2);
                        }
                        else
                        {
                            obj_json.put("state","NotOnline");
                            obj_json.put("content","token与user不符！");
                        }
                    }
                    else
                    {
                        obj_json.put("state","NotOnline");
                        obj_json.put("content","token失效");
                    }
                    return JSON.toJSONString(obj_json);
                    //break;
                }
                case "quit_session":
                {
                    String str_czyid=mapParam.get("czyid");
                    String str_token=mapParam.get("token");
                    if(!str_czyid.equals("world"))//不允许world下线！！！！
                    {
                        //这里不考虑当前是否可用？->还是考虑一下吧
                        String str_sql="UPDATE tb_user SET sfky=0 WHERE uuid='"+str_token+"' AND userid='"+str_czyid+"' AND sfky=1";
                        int k=jdbcTemplate.update(str_sql);
                        if(k==1)
                        {
                            obj_json.put("state","Logout");
                        }
                        else
                        {
                            obj_json.put("state","NotOnline");
                            obj_json.put("content","没有找到符合登出条件的用户，请重新登录吧");
                        }

                        JSONObject obj_msg=new JSONObject();
                        obj_msg.put("type","quituser");
                        //与登入不同，不需要由world先添加再通知其他人添加，而是直接通知所有人删除
                        //为了防止各个client不同步，导致和这个user有关的各种状态同步异常，还是应该先通知world删除，然后由world通知其他client删除！！！！
                        obj_msg.put("id",str_czyid);
                        //告诉world用户，有一个新用户进入
                        WebSocketServer.broadcastWsMsg3(JSON.toJSONString(obj_msg),"world","");
                    }
                    else
                    {
                        obj_json.put("state","NotOnline");
                        obj_json.put("content","不允许登出world用户");
                    }

                    break;
                }
                default:
                {
                    obj_json.put("state","Exception");
                    obj_json.put("content","没有找到请求的方法");
                    break;
                }
            }
        }
        catch(Exception e)
        {
            e.printStackTrace();
            obj_json.put("state","Exception");
            obj_json.put("content",e.toString());

        }
        return JSON.toJSONString(obj_json);
    }
}

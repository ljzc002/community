package com.example.basictest.websocket.netty;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.example.basictest.BasictestApplication;
import com.example.basictest.websocket.pojo.WsMessage;
import com.example.basictest.websocket.pojo.WsSession;
import com.example.basictest.websocket.pojo.WsUser;
import com.example.basictest.websocket.util.MyNettyUtil;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.util.AttributeKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by lz on 2019/4/2.
 */
@Controller
@ResponseBody
@Component
public class WebSocketHandler {

    //private String str_pgid="test";//暂时规定只有一个test playground
    //@Autowired

    private JdbcTemplate jdbcTemplate;


    public void SwitchMessageType(String str_json, ChannelHandlerContext ctx)
    {
        try {
            jdbcTemplate = new JdbcTemplate(BasictestApplication.ds);
            String ChannelId = ctx.channel().id().toString();
            WsSession wsSession = NettyConfig.mapSession.get(ChannelId);//获取建立连接时记录的身份对象
            // ，这里并没有httpsession，这个WsSession是存在后台java中的
            JSONObject obj_json=new JSONObject();
            String type="";
            try {
                obj_json = JSON.parseObject(str_json);//前台可能传来异常的JSON？
                type = obj_json.getString("type");
            }
            catch(Exception e)
            {
                e.printStackTrace();
                System.out.println(wsSession.UserId);
                System.out.println(str_json);
            }

            switch (type) {
                case "setuserid": // 在连接的身份对象中记录这个连接所属的用户的身份信息-》这个数据库查询改为world用户专用
                {
                    String userId = obj_json.getString("userId");
                    String token = obj_json.getString("token");
                    String pgid = obj_json.getString("pgid");
                    if(token.equals("test"))//如果是测试模式则不连接数据库，并返回空白的单位列表，一切由前台自行添加
                    {
                        JSONObject obj_msg = new JSONObject();
                        obj_msg.put("type", "setuseridok");
                        WebSocketServer.PrivateTalk(JSON.toJSONString(obj_msg), ChannelId);
                        return;
                    }
                    //如果不是测试模式则尝试从数据库验证身份，如果数据库中有，则说明这个token和userId的组合是有效的
                    // ，在身份map中确立这个身份，并允许使用这个身份的连接的后续访问
                    String str_sql = "SELECT userid,jsonstate FROM tb_user WHERE uuid='" + token + "' AND sfky=1 and userid='" + userId + "'";
                    List<Map<String, Object>> list = jdbcTemplate.queryForList(str_sql);
                    if (list.size() == 1) {
                        JSONObject obj_msg = new JSONObject();
                        obj_msg.put("type", "setuseridok");
                        obj_msg.put("jsonstate", MyNettyUtil.GetStringFromMap(list.get(0), "jsonstate"));
                        wsSession.UserId = userId;
                        wsSession.Token = token;
                        //查出用户的所有手牌，查出所有其他用户，查出所有其他用户暴露给本用户的单位
                        str_sql = "select a.uuid,a.jsonstate,a.ispublic,b.name,b.jsonp,b.mainpic,b.mainback,b.comment  from  tb_userunit2 a,tb_unittype b \n" +
                                "where a.ownerid=? and a.sfky=1 and pgid=?  and  a.unittypename=b.name";
                        List<Map<String, Object>> list2 = jdbcTemplate.queryForList(str_sql, userId, pgid);
                        List<JSONObject> arr_data = new ArrayList<JSONObject>();
                        int len = list2.size();//对于这个用户的每一张卡牌
                        int i = 0;
                        for (i = 0; i < len; i++) {
                            Map<String, Object> rs_row = list2.get(i);
                            JSONObject object = new JSONObject();
                            object.put("uuid", MyNettyUtil.GetStringFromMap(rs_row, "uuid"));
                            object.put("jsonstate", MyNettyUtil.GetStringFromMap(rs_row, "jsonstate"));
                            object.put("ispublic", MyNettyUtil.GetStringFromMap(rs_row, "ispublic"));
                            object.put("name", MyNettyUtil.GetStringFromMap(rs_row, "name"));
                            object.put("jsonp", MyNettyUtil.GetStringFromMap(rs_row, "jsonp"));
                            object.put("mainpic", MyNettyUtil.GetStringFromMap(rs_row, "mainpic"));
                            object.put("mainback", MyNettyUtil.GetStringFromMap(rs_row, "mainback"));
                            object.put("comment", MyNettyUtil.GetStringFromMap(rs_row, "comment"));
                            //object.put("uuid", MyNettyUtil.GetStringFromMap(rs_row,"uuid"));
                            arr_data.add(object);
                        }
                        obj_msg.put("myunits", arr_data);
                        str_sql = "SELECT uuid,userid,jsonstate FROM tb_user WHERE sfky=1 AND sysdate>ksrq AND userid!=? AND pgid=?";
                        List<Map<String, Object>> list3 = jdbcTemplate.queryForList(str_sql, userId, pgid);
                        //List<JSONObject> arr_data3=new ArrayList<JSONObject>();
                        len = list3.size();
                        i = 0;
                        List<JSONObject> arr_webuser = new ArrayList<JSONObject>();
                        for (i = 0; i < len; i++)//对于每一个web用户
                        {
                            Map<String, Object> rs_row = list3.get(i);
                            String webUserUuid = MyNettyUtil.GetStringFromMap(rs_row, "uuid");
                            String webUserId = MyNettyUtil.GetStringFromMap(rs_row, "userid");
                            //把所有世界信息都交给world用户管理！！
                            List<JSONObject> arr_data4 = new ArrayList<JSONObject>();
                            str_sql = "select a.uuid,a.jsonstate,a.ispublic,b.name,b.jsonp,b.mainpic,b.mainback,b.comment from  tb_userunit2 a,tb_unittype b \n" +
                                    "where a.ownerid=? and a.sfky=1 and pgid=?  and  a.unittypename=b.name";
                            List<Map<String, Object>> list4 = jdbcTemplate.queryForList(str_sql, webUserId, pgid);
                            int len4 = list4.size();//对于这个web用户的每一个单位
                            int j = 0;
                            for (j = 0; j < len4; j++) {
                                Map<String, Object> rs_row4 = list4.get(j);
                                JSONObject object = new JSONObject();
                                object.put("uuid", MyNettyUtil.GetStringFromMap(rs_row4, "uuid"));
                                object.put("jsonstate", MyNettyUtil.GetStringFromMap(rs_row4, "jsonstate"));
                                object.put("ispublic", MyNettyUtil.GetStringFromMap(rs_row4, "ispublic"));
                                object.put("name", MyNettyUtil.GetStringFromMap(rs_row4, "name"));
                                object.put("jsonp", MyNettyUtil.GetStringFromMap(rs_row4, "jsonp"));
                                object.put("mainpic", MyNettyUtil.GetStringFromMap(rs_row4, "mainpic"));
                                object.put("mainback", MyNettyUtil.GetStringFromMap(rs_row4, "mainback"));
                                object.put("comment", MyNettyUtil.GetStringFromMap(rs_row4, "comment"));
                                arr_data4.add(object);
                            }
                            JSONObject object_webuser = new JSONObject();
                            object_webuser.put("units", arr_data4);
                            object_webuser.put("id", webUserId);
                            object_webuser.put("uuid", webUserUuid);
                            object_webuser.put("jsonstate", MyNettyUtil.GetStringFromMap(rs_row, "jsonstate"));
                            arr_webuser.add(object_webuser);
                        }
                        obj_msg.put("webusers", arr_webuser);
                        WebSocketServer.PrivateTalk(JSON.toJSONString(obj_msg), ChannelId);//将所有用户的信息私聊告知world
                    } else {
                        JSONObject obj_msg = new JSONObject();
                        obj_msg.put("type", "tokenfaild");//身份验证失败，需要重新登录
                        WebSocketServer.PrivateTalk(JSON.toJSONString(obj_msg), ChannelId);
                    }
                    break;
                }
                case "setuserid2"://非world用户
                {
                    String userId = obj_json.getString("userId");
                    String token = obj_json.getString("token");
                    if(token.equals("test"))//如果是测试模式则不连接数据库，并返回空白的单位列表，一切由前台自行添加
                    {
                        JSONObject obj_msg = new JSONObject();
                        //不通过world用户直接允许test通过
                        obj_json.put("type", "setuseridok");//修改信息类型为初始验证通过
                        WebSocketServer.PrivateTalk(JSON.toJSONString(obj_json), ChannelId);
                        return;
                    }
                    //尝试从数据库验证身份！！！！如果数据库中有，则说明这个token和userId的组合是有效的
                    // ，在身份map中确立这个身份，并允许使用这个身份的连接的后续访问
                    String str_sql = "SELECT userid FROM tb_user WHERE uuid='" + token + "' AND sfky=1 and userid='" + userId + "'";
                    List<Map<String, Object>> list = jdbcTemplate.queryForList(str_sql);
                    if (list.size() == 1) {
                        wsSession.UserId = userId;
                        wsSession.Token = token;
                        JSONObject obj_msg = new JSONObject();
                        obj_msg.put("type", "getuserstate_init");//在world返回状态之后才算验证成功
                        obj_msg.put("userid", userId);
                        obj_msg.put("ChannelId", ChannelId);
                        WebSocketServer.broadcastWsMsg3(JSON.toJSONString(obj_msg), "world", ChannelId);//从第一个world获取信息（正常情况下也应该只有一个world！！）
                        //由world负责告知这个用户可以获知的信息
                    } else {
                        JSONObject obj_msg = new JSONObject();
                        obj_msg.put("type", "tokenfaild");//身份验证失败，需要重新登录
                        WebSocketServer.PrivateTalk(JSON.toJSONString(obj_msg), ChannelId);
                    }
                    break;
                }
                case "giveuserstate_init": {//后面就不进行身份验证了
                    obj_json.put("type", "setuseridok");//修改信息类型为初始验证通过
                    WebSocketServer.PrivateTalk(JSON.toJSONString(obj_json), obj_json.getString("ChannelId"));//私聊转告用户可以获知的信息
                    break;
                }
                //world通知其他用户新用户的进入
                case "bc_addanewuser": {
                    String userId = obj_json.getString("id");
                    WebSocketServer.broadcastWsMsg4(str_json, userId, ChannelId);//不需要重新通知world
                }
                //world通知其他用户有一个用户登出
                case "bc_quituser": {
                    //String userId=obj_json.getString("userId");
                    WebSocketServer.broadcastWsMsg(str_json, ChannelId);
                    break;
                }
                //一个用户向world申请抓牌
                case "catchcard": {
                    WebSocketServer.broadcastWsMsg3(str_json, "world", ChannelId);
                    break;
                }
                //world剥夺了用户的控制权，用户进入动画状态
                case "detachcontrol": {
                    String userId = obj_json.getString("userid");
                    WebSocketServer.broadcastWsMsg2(str_json, userId, ChannelId);
                    break;
                }
                case "attachcontrol": {
                    String userId = obj_json.getString("userid");
                    WebSocketServer.broadcastWsMsg2(str_json, userId, ChannelId);
                    break;
                }
                case "finish_catchcard": {//这里应该通知除world之外的所有用户，因为非belongto用户也要修改card的从属关系！！！！
                    String userId = obj_json.getString("userid");
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }

                //world向所有用户同步所有用户和所有单位的状态
                case "synchronizestate": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                //一个用户向world用户上报运动信息
                case "reportuserstate": {
                    WebSocketServer.broadcastWsMsg3(str_json, "world", ChannelId);
                    break;
                }
                case "playoutcard": {
                    WebSocketServer.broadcastWsMsg3(str_json, "world", ChannelId);
                    break;
                }
                case "bc_playoutcard": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                case "finish_playoutcard": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                case "releaseskill": {
                    WebSocketServer.broadcastWsMsg3(str_json, "world", ChannelId);
                    break;
                }
                case "bc_actionstart": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                case "finish_action": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                case "command_once": {
                    WebSocketServer.broadcastWsMsg4(str_json, "world", ChannelId);
                    break;
                }
                default:
                    break;

            }
        }
        catch(Exception e)
        {
            e.printStackTrace();
        }
    }
}

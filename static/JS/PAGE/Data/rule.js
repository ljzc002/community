//判断这个技能是否可以以这个mesh为target
function couldbeTarget(skill,mesh,picked_card)
{
    var skill_find=null;
    if(skill.skilltype=="selectarea"&&mesh.name.substr(0, 8) == "mesharea"&&Math.abs(picked_card.area.row-mesh.row)<=skill.range)//移动类
    {//还要加入和select有关的被动效果的判断，暂时不考虑地块的特殊效果
        skill_find=skill;
        skill_find.dis=Math.abs(picked_card.area.row-mesh.row);
    }
    else if(skill.skilltype=="selectunit"&&picked_card.mesh.id!=mesh.name&&mesh.name.substr(0, 9) == "mesh_card"&&Math.abs(picked_card.area.row-mesh.card.area.row)<=skill.range)
    {//攻击类
        var card_target=mesh.card;
        var arr_skillindex=card_target.arr_skillindex;
        var len=arr_skillindex.length;
        for(var i=0;i<len;i++)
        {
            var skill_temp=list_skilldata[arr_skillindex[i]]
            if(skill_temp.skilltype=="selecttarget")
            {
                skill_temp.do(card_target);
            }
        }
        var arr_skillindex=picked_card.arr_skillindex;
        var len=arr_skillindex.length;
        for(var i=0;i<len;i++)
        {
            var skill_temp=list_skilldata[arr_skillindex[i]]
            if(skill_temp.skilltype=="selecttarget")
            {
                skill_temp.do(card_target);
            }
        }

        skill_find=skill;
        skill_find.dis=Math.abs(picked_card.area.row-mesh.card.area.row);
        for(key in card_target.couldbeTarget)
        {
            if(card_target.couldbeTarget[key]==0)
            {
                skill_find=null;
                break;
            }
        }
    }
    return skill_find;
}
//搜索在skill执行之前，需要对unit执行的触发skill
//规定beforeAction执行动作发起者的被动，inAction执行动作承受者的被动
function beforeAction(unit,skill,targets,action)//需要同时考虑本体和对象的beforeAction，而且target还可能是一个数组！！！！
{//可能要修改action的一些属性

    //for()遍历自身的所有beforeAction被动（按顺序执行）
    action.targets=targets;
    var arr_skill_res=findSkillByType(unit,"beforeaction",null);
    var len=arr_skill_res.length;
    for(var i=0;i<len;i++)
    {
        arr_skill_res[i].do(unit,action);
    }
}
function inAction(obj_msg)
{
    if(obj_msg.actiontype=="moveAction")
    {
        sendMessage(JSON.stringify(obj_msg));
        afterAction(obj_msg);
    }
    else if(obj_msg.actiontype=="throwAction")//射弹到达目标位置
    {
        var len=obj_msg.targets.length;
        if(obj_msg.throwtype=="attack")
        {
            for(var i=0;i<len;i++)
            {
                //执行inaction的skill方法
                let card=obj_msg.targets[i];//对于每个攻击目标
                //var action_temp=obj_msg;
                var arr_skill_res=findSkillByType(card,"inaction",null);
                var len2=arr_skill_res.length;
                for(var j=0;j<len2;j++)
                {
                    arr_skill_res[j].do(card,obj_msg);
                }
                //ws通知
                card.ani_shake(function(){//此时target并不处于inani状态，所以world不会同步它的姿态！！！！
                    loseHP(card,obj_msg);
                });

            }
        }

    }
    else if(obj_msg.actiontype=="attacktoAction")
    {
        var card=obj_msg.target;//规定attacktoAction只会有一个目标
        var arr_skill_res=findSkillByType(card,"inaction",null);
        var len2=arr_skill_res.length;
        for(var j=0;j<len2;j++)
        {
            arr_skill_res[j].do(card,obj_msg);
        }
        //ws通知
        card.ani_shake(function(){//此时target并不处于inani状态，所以world不会同步它的姿态！！！！
            loseHP(card,obj_msg);
        });
    }
    else if(obj_msg.actiontype=="attackAction")
    {
        var card=obj_msg.target;//规定attackAction只会有一个目标
        var arr_skill_res=findSkillByType(card,"inaction",null);
        var len2=arr_skill_res.length;
        for(var j=0;j<len2;j++)
        {
            arr_skill_res[j].do(card,obj_msg);
        }
        //ws通知
        card.ani_shake(function(){//此时target并不处于inani状态，所以world不会同步它的姿态！！！！
            loseHP(card,obj_msg);
        });
    }
}
function afterAction(action)
{
    if(action.actiontype=="moveAction")
    {
        console.log(action.uuid+"完成移动");
    }
    else if(action.actiontype=="throwAction")
    {


        if(action.throwtype=="attack")
        {
            ifDead(action);
        }

        var obj_msg={};
        var card=action.unit;
        obj_msg.type="finish_action";
        obj_msg.actiontype="throwAction";
        obj_msg.webuserid=card.ownerid;
        obj_msg.uuid=card.uuid;
        card.state="inarea";
        sendMessage(JSON.stringify(obj_msg));
    }
    else if(action.actiontype=="attacktoAction")
    {
        var area_targetdead=ifDead(action);
        if(area_targetdead)//如果目标被摧毁，移动到目标位置
        {

        }else//如果目标没有被摧毁则只是普通的近战攻击
        {
            var obj_msg={};
            var card=action.unit;
            obj_msg.type="finish_action";
            obj_msg.actiontype="attacktoAction";
            obj_msg.webuserid=card.ownerid;
            obj_msg.uuid=card.uuid;
            card.state="inarea";
            sendMessage(JSON.stringify(obj_msg));
        }

    }
    else if(action.actiontype=="attackAction")
    {
        ifDead(action);

        var obj_msg={};
        var card=action.unit;
        obj_msg.type="finish_action";
        obj_msg.actiontype="attackAction";
        obj_msg.webuserid=card.ownerid;
        obj_msg.uuid=card.uuid;
        card.state="inarea";
        sendMessage(JSON.stringify(obj_msg));
    }
}

function releaseSkill(obj_p)
{
    var skilltype=obj_p.skilltype;
    var skillindex=obj_p.skillindex;
    var cardid=obj_p.uuid ;
    var webuserid=obj_p.userid;
    var targetname=obj_p.targetname;
    var unit=findCardByUuid(cardid,webuserid);
    var target;
    if(skilltype=="selectarea")
    {
        target=findAreaByName(targetname)
    }
    else if(skilltype=="selectunit")
    {
        target=findCardByUuid(targetname,null);
    }
    if(unit&&target)
    {
        unit.state="inani";
        var skill=list_skilldata[skillindex];
        skill.do2(unit,target)
    }
}

function moveAction(action)
{
    var card=action.unit;
    var target=action.target;
    var skill=action.skill;
    beforeAction(card,skill,[target],action);
    newland.MoveWithAni2(card.mesh,target.absolutePosition,null,null,60
        ,function(){
            //此时action还未结束
            card.area=target;
            target.unit=card;
            var obj_msg={};
            obj_msg.type="finish_action";//action完成需要通知用户出字、改指示条等等，由actiontype区分不同处理
            //动画完成时还要把card的本身信息发给用户
            obj_msg.actiontype="moveAction";
            obj_msg.areaname=card.area.id;
            obj_msg.webuserid=card.ownerid;
            obj_msg.uuid=card.uuid;
            inAction(obj_msg);
            card.state="inarea";
        });
    //广播告知动作信息
    var obj_msg={};
    obj_msg.type="bc_actionstart";//通知其他所有用户这一动作,主要是令其他用户进入动画状态
    obj_msg.actiontype="moveAction";
    obj_msg.webuserid=card.ownerid;
    obj_msg.uuid=card.uuid;
    sendMessage(JSON.stringify(obj_msg));
}
function attackAction(action)//近战攻击行为，包括移动到目标地点，再攻击目标单位？《-改用workstate标记？？
{
    var card=action.unit;
    var target=action.target;
    var skill=action.skill;
    action.demage=card.at;
    beforeAction(card,skill,[target],action);
    action.actiontype="attackAction";
    card.ani_hit(action.target,function(){inAction(action);},null)//冲过去撞一下
    //广播告知动作信息
    var obj_msg={};
    obj_msg.type="bc_actionstart";//通知其他所有用户这一动作,主要是令其他用户进入动画状态
    obj_msg.actiontype="attackAction";
    //obj_msg.throwtype=throwtype;//普通用户要据此建立对应数量的instance_bullet
    obj_msg.webuserid=card.ownerid;
    obj_msg.uuid=card.uuid;
    //obj_msg.flag_ani=flag_ani;//按key名同步
    //obj_msg.target_ani=target_ani;
    sendMessage(JSON.stringify(obj_msg));
}
function throwAction(action)
{
    var card=action.unit;
    var target=action.target;
    var skill=action.skill;
    action.demage=card.at;
    beforeAction(card,skill,[target],action);
    var throwtype=skill.skilltype2;

    if(throwtype=="attack")
    {
        MyGame.bullet.material=MyGame.materials.mat_red;
    }
    else if(throwtype=="heal")
    {
        MyGame.bullet.material=MyGame.materials.mat_green;
    }
    var len=action.targets.length;
    var flag_ani={};//每个发射体动画的运行标志
    var target_ani={};//每个发射目的地
    MyGame.obj_bulletinstance={};
    for(var i=0;i<len;i++)
    {
        let instance_bullet=MyGame.bullet.createInstance("bullet_"+i);
        instance_bullet.position=card.mesh.position.clone();
        instance_bullet.position.y+=1;
        flag_ani["bullet_"+i]=true;
        MyGame.obj_bulletinstance["bullet_"+i]=instance_bullet;
        var animation=new BABYLON.Animation("bullet_"+i,"position",30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        var pos1=instance_bullet.position.clone();
        var pos2=action.targets[i].mesh.position.clone();
        target_ani["bullet_"+i]={x:pos2.x,y:pos2.y,z:pos2.z}
        var keys=[{frame:0,value:pos1},{frame:30,value:pos2}];
        animation.setKeys(keys);
        instance_bullet.animations.push(animation);
        scene.beginAnimation(instance_bullet, 0, 30, false,1,function(){//这个动画由world同步还是由普通用户自己计算？？？？
            flag_ani[instance_bullet.id]=false;
            instance_bullet.dispose();
            for(var key in flag_ani)
            {
                if(flag_ani[key])//如果还有动画未结束
                {
                    return;
                }
            }
            //如果所有的动画都结束
            action.actiontype="throwAction";
            action.throwtype=throwtype;
            action.demage=card.at;
            inAction(action);//在inAction中计算此次throw的主要结果,需要在函数间传递的信息较多，使用action作为参数

        });
    }
    //广播告知动作信息
    var obj_msg={};
    obj_msg.type="bc_actionstart";//通知其他所有用户这一动作,主要是令其他用户进入动画状态
    obj_msg.actiontype="throwAction";
    obj_msg.throwtype=throwtype;//普通用户要据此建立对应数量的instance_bullet
    obj_msg.webuserid=card.ownerid;
    obj_msg.uuid=card.uuid;
    obj_msg.flag_ani=flag_ani;//按key名同步
    obj_msg.target_ani=target_ani;
    sendMessage(JSON.stringify(obj_msg));
}
function attacktoAction(action)
{
    var card=action.unit;
    var target=action.target;
    var skill=action.skill;
    action.demage=card.at;
    beforeAction(card,skill,[target],action);
    action.actiontype="attacktoAction";
    card.ani_hit(action.target,function(){inAction(action);},null)//冲过去撞一下
    //广播告知动作信息
    var obj_msg={};
    obj_msg.type="bc_actionstart";//通知其他所有用户这一动作,主要是令其他用户进入动画状态
    obj_msg.actiontype="attacktoAction";
    //obj_msg.throwtype=throwtype;//普通用户要据此建立对应数量的instance_bullet
    obj_msg.webuserid=card.ownerid;
    obj_msg.uuid=card.uuid;
    //obj_msg.flag_ani=flag_ani;//按key名同步
    //obj_msg.target_ani=target_ani;
    sendMessage(JSON.stringify(obj_msg));
}

//world向其他用户发送一次性命令
function command_once(commandtype,id,action)
{
    var obj_msg={};
    obj_msg.type="command_once";
    obj_msg.commandtype=commandtype;//可能有多种命令类型
    obj_msg.carduuid=id;//可能是card也可能是area
    obj_msg.action=action;
    sendMessage(JSON.stringify(obj_msg));
}
//在一定范围内选取一个对象，作为callback方法的参数
//在所有可以选择的target上，建立一个跳动的箭头
var arr_arrows=[];
function skillTargetSelect(unit, skill, callback)
{
    var len=arr_arrows.length;
    for(var i=0;i<len;i++)//清空原有的所有箭头
    {
        var arrow=arr_arrows[i];
        arrow.dispose();
        arrow=null;
    }
    var target;//唯一选中的目标
    for(var key in MyGame.obj_ground)
    {
        var ground=MyGame.obj_ground[key];
        var arr=ground.arr_mesharea;
        var len2=arr.length;
        for(var j=0;j<len2;j++)
        {
            var area=arr[j];
            if(couldbeTarget(skill,area,unit))
            {
                makeAnArrow(area,skill,callback)
            }
            else
            {
                var unit_temp=area.unit;
                if(unit_temp)
                {
                    if(couldbeTarget(skill,unit_temp.mesh,unit))
                    {
                        makeAnArrow(unit_temp.mesh,skill,callback);
                    }
                }
            }
        }
    }

    //callback(unit,target);
}
function makeAnArrow(mesh,skill,callback)
{
    var mesh_arrow=newland.CreateArrow("mesh_arrow"+mesh.name,5,2.5,16,5,1,16,MyGame.materials.mat_yellow,3);
    mesh_arrow.position=mesh.absolutePosition.clone();
    mesh_arrow.position.y=6
    mesh_arrow.lookAt(new BABYLON.Vector3(mesh_arrow.position.x,-1,mesh_arrow.position.z));
    arr_arrows.push(mesh_arrow);
    mesh.mesh_arrow=mesh_arrow;
    mesh_arrow.target=mesh;
    mesh_arrow.skill_find=skill;
    mesh_arrow.callback=callback;
    //让箭头上下跳动
    var animation=new BABYLON.Animation(mesh_arrow.name,"position.y",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var keys=[{frame:0,value:6},{frame:15,value:7},{frame:30,value:6}];
    animation.setKeys(keys);
    mesh_arrow.animations=[];
    mesh_arrow.animations.push(animation);
    scene.beginAnimation(mesh_arrow, 0, 30, true,1,function(){
    });
}
//根据类型标记寻找技能对象
function findSkillByType(unit,type1,type2)
{
    var arr_skill_res=[];
    var arr_skillindex=unit.arr_skillindex;
    var len=arr_skillindex.length;
    for(var i=0;i<len;i++)
    {
        var skill=list_skilldata[arr_skillindex[i]];
        if(!type1)
        {
            if(skill.skilltype2==type2)
            {
                arr_skill_res.push(skill);
            }
        }
        else if(!type2)
        {
            if(skill.skilltype==type1)
            {
                arr_skill_res.push(skill);
            }
        }
        else if(skill.skilltype==type1&&skill.skilltype2==type2)
        {
            arr_skill_res.push(skill);
        }
    }
    return arr_skill_res;
}

function findAreaByName(areaname)
{
    var area_mesh=null;
    for(var key in MyGame.obj_ground)//寻找目标位置
    {
        var ground=MyGame.obj_ground[key];
        var arr=ground.arr_mesharea;
        var len2=arr.length;
        for(var j=0;j<len2;j++)
        {
            var area=arr[j];
            if(area.name==areaname)
            {
                //pos2=area.absolutePosition.clone();
                //pos2.y+=0.1;//还是要让standalone的卡牌在顶部，能够先于放置区被点击到
                area_mesh=area;
                break;
            }
        }
        if(area_mesh)
        {
            break;
        }
    }
    return area_mesh;
}
function findCardByUuid(uuid,userid)
{
    if(userid)//如果规定了用户的id
    {
        var arr_units;
        if(userid==MyGame.WhoAmI)
        {
            arr_units=MyGame.player.arr_units;
        }
        else
        {
            arr_units=MyGame.arr_webplayers[userid].arr_units;
        }
        if(arr_units)
        {
            var len=arr_units.length;
            for(var i=0;i<len;i++)
            {
                var unit=arr_units[i];
                if(unit.uuid==uuid)
                {
                    return unit;
                }
            }
        }
    }
    else
    {
        var arr_units=MyGame.player.arr_units;
        var len=arr_units.length;
        for(var i=0;i<len;i++)
        {
            var unit=arr_units[i];
            if(unit.uuid==uuid)
            {
                return unit;
            }
        }
        for(var key in MyGame.arr_webplayers)
        {
            var arr_units=MyGame.arr_webplayers[key].arr_units;
            var len=arr_units.length;
            for(var i=0;i<len;i++)
            {
                var unit=arr_units[i];
                if(unit.uuid==uuid)
                {
                    return unit;
                }
            }
        }
    }

}

function loseHP(card,obj_msg)//处理损失HP、SP、MP的各项相关事宜
{
    var obj_p={};
    if(obj_msg.demage)
    {
        if(card.sp>=obj_msg.demage)
        {
            card.sp-=obj_msg.demage;

            card.ani_floatstr("-"+obj_msg.demage,[["fillStyle","#ffff00"]]);
            card.changeStrip("strip_sp",card.sp,function(){
                afterAction(obj_msg);
            });
            obj_p.strip_sp=["-"+obj_msg.demage,card.sp];//第一个是减少的字符，第二个是减少之后剩下的字符,js支持元素数据类型不同的数组？
            command_once("card_hited",card.uuid,obj_p);
        }else
        {
            if(card.sp>0)
            {
                var demage1=card.sp;
                card.hp-=(obj_msg.demage-demage1);
                if(card.hp<0)
                {
                    card.hp=0;
                }
                card.sp=0;
                card.ani_floatstr("-"+demage1,[["fillStyle","#ffff00"]],function(){
                    card.ani_floatstr("-"+(obj_msg.demage-demage1),[["fillStyle","#ff0000"]]);
                });
                card.changeStrip("strip_sp",0,function(){
                    obj_p.strip_hp=["-"+(obj_msg.demage-demage1),card.hp];
                    command_once("card_hited",card.uuid,obj_p);
                    card.changeStrip("strip_hp",card.hp,function(){
                        afterAction(obj_msg);
                    });
                });
                obj_p.strip_sp=["-"+card.sp,card.sp];
                command_once("card_hited",card.uuid,obj_p);
            }
            else
            {
                card.hp-=obj_msg.demage;
                if(card.hp<0)
                {
                    card.hp=0;
                }
                card.ani_floatstr("-"+obj_msg.demage,[["fillStyle","#ff0000"]]);
                card.changeStrip("strip_hp",card.hp,function(){
                    afterAction(obj_msg);
                });
                obj_p.strip_hp=["-"+obj_msg.demage,card.hp];
                command_once("card_hited",card.uuid,obj_p);
            }
        }
    }
    else if(obj_msg.truedemage)
    {
        card.hp-=obj_msg.truedemage;
        if(card.hp<0)
        {
            card.hp=0;
        }
        card.ani_floatstr("-"+obj_msg.truedemage,[["fillStyle","#ff0000"]]);
        card.changeStrip("strip_hp",card.hp,function(){
            afterAction(obj_msg);
        });
        obj_p.strip_hp=["-"+obj_msg.truedemage,card.hp];
        command_once("card_hited",card.uuid,obj_p);
    }
}
function ifDead(action)//判断是否死去，并处理相关事宜
{
    var len=action.targets.length;
    var area_targetdead=null;//目标死亡位置，给attackto使用
    //这里还要执行target的skill
    for(var i=0;i<len;i++)//对于每一个攻击目标
    {
        let card=action.targets[i];
        var arr_skill_res=findSkillByType(card,"afteraction",null);
        var len2=arr_skill_res.length;
        for(var j=0;i<len2;j++)
        {
            arr_skill_res[j].do(card,action);
        }
        if(card.hp<=0)
        {
            if(!area_targetdead)//如果这是第一个死亡单位
            {
                area_targetdead=card.area;
            }
            card.ani_floatstr("dead",[["fillStyle","#aaaaaa"]]);
            card.changeStrip("strip_hp",0,function(){
                card.ani_destory();//ws通知释放
                if(action.actiontype=="attacktoAction")
                {
                    action.unit.state="inani";
                    var action2 ={
                        unit:action.unit,
                        target:area_targetdead,
                        skill:list_skilldata[0]
                    }
                    moveAction(action2);

                }
            });
            command_once("card_dead",card.uuid);
        }
    }
    let card=action.unit;//看看自己怎么样了
    var arr_skill_res=findSkillByType(card,"afteraction",null);
    var len2=arr_skill_res.length;
    for(var j=0;i<len2;j++)
    {
        arr_skill_res[j].do(card,action);
    }
    if(card.hp<=0)
    {
        card.state="isdestoried";
        card.ani_floatstr("dead",[["fillStyle","#aaaaaa"]]);
        card.changeStrip("strip_hp",0,function(){
            card.ani_destory();
        });
        command_once("card_dead",card.uuid);
        return null;
    }
    else if(area_targetdead&&action.actiontype=="attacktoAction")
    {
        return area_targetdead;
    }
}
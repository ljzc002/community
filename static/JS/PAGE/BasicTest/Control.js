/**
 * Created by lz on 2018/3/12.
 */
//加上日期表示它不是通用的工具库
/**
 * Created by lz on 2017/11/28.
 */
//这里是处理键盘鼠标等各种操作，并进行转发的代码
function InitMouse()
{

    scene.onPointerMove=onMouseMove;
    scene.onPointerDown=onMouseDown;
    scene.onPointerUp=onMouseUp;
    //scene.onPointerPick=onMouseClick;//如果不attachControl onPointerPick不会被触发，并且onPointerPick必须pick到mesh上才会被触发
    canvas.addEventListener("click", function(evt) {//这个监听也会在点击GUI按钮时触发！！
        onMouseClick(evt);//方法放在rule里？
    }, false);
    //另一种思路是放弃click事件，完全使用updown事件加条件判断。

    canvas.addEventListener("blur",function(evt){//监听失去焦点
        releaseKeyState();
        if(MyGame.currentarea) {
            MyGame.currentarea.renderingGroupId = 0;
            MyGame.currentarea = null;
        }
    })
    canvas.addEventListener("focus",function(evt){//改为监听获得焦点，因为调试失去焦点时事件的先后顺序不好说
        releaseKeyState();
    })

}
function onMouseClick(evt)//考虑到可能要用到触屏设备上，不设置左右键区分
{
    if(MyGame.flag_view!="first_ani") {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, MyGame.Cameras.camera0);//鼠标点击信息
        var flag_pick = false;
        if (pickInfo.hit) {
            var mesh = pickInfo.pickedMesh;
            if(mesh.mesh_arrow)
            {
                var obj_msg = {};
                obj_msg.type = "releaseskill";//向world发起释放技能请求
                var skill_find=mesh.mesh_arrow.skill_find;
                obj_msg.skilltype=skill_find.skilltype;
                obj_msg.uuid = current_unit.uuid;
                obj_msg.userid = MyGame.WhoAmI;
                if(obj_msg.skilltype=="selectarea")
                {
                    obj_msg.targetname = mesh.name;//
                }
                else if(obj_msg.skilltype=="selectunit")
                {
                    obj_msg.targetname = mesh.card.uuid;
                }
                obj_msg.skillindex=skill_find.index;
                obj_msg.skilldis=skill_find.dis;
                sendMessage(JSON.stringify(obj_msg));
                dispose_pickedcard();
                var len=arr_arrows.length;
                for(var i=0;i<len;i++)//清空原有的所有箭头
                {
                    var arrow=arr_arrows[i];
                    arrow.dispose();
                    arrow.target.mesh_arrow=null;
                    arrow=null;
                }
                MyGame.flag_view = "first_ani";//操作完成前，禁用下一操作
            }
            else if (mesh.name.substr(0, 9) == "mesh_card"&&!picked_card)//点击卡牌，显示详情
            {
                var card = mesh.card;
                if ((card.ownerid==MyGame.WhoAmI||card.ispublic=="1"||MyGame.WhoAmI=="world")
                    &&MyGame.UiPanec && !MyGame.UiPanec.isVisible&&canvas.style.cursor == "help") {
                    MyGame.UiPanec.isVisible = true;
                    flag_pick=true;
                    SetCardUI(card, MyGame.UiPanec)//@@@@
                }
            }

        }

    }
}
var current_card=null;//光标当前所在的自己的手牌
var picked_card=null;//当前选中的自己的手牌
var picked_from=null;//选取手牌的出发点
var current_unit=null;
function onMouseMove(evt)
{
    if(MyGame.flag_view!="first_ani") {
        //var width = engine.getRenderWidth();
        //var height = engine.getRenderHeight();
        //var pickInfo = scene.pick(width/2, height/2, null, false, MyGame.Cameras.camera0);//中心点击信息
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, MyGame.Cameras.camera0);//鼠标点击信息
        var flag_focus = false;
        if (!picked_card) {
            if (pickInfo.hit) {
                var mesh = pickInfo.pickedMesh;
                //看来只要设置了不可见，也就会不可pick，即使强制设置可pick也不行！！
                //鼠标移入放置区
                if (mesh.name.substr(0, 8) == "mesharea"&&!mesh.mesh_arrow)//显示鼠标移入的放置点，其他放置点不可见
                {
                    current_card = null;
                    canvas.style.cursor = "default";
                    if (MyGame.currentarea) {
                        MyGame.currentarea.renderingGroupId = 0;
                    }
                    mesh.renderingGroupId = 2;
                    MyGame.currentarea = mesh;
                    if (picked_card) {
                        canvas.style.cursor = "pointer";//表明可以放置
                    }
                }
                else {
                    if (MyGame.currentarea) {//必定是移出放置区了
                        MyGame.currentarea.renderingGroupId = 0;
                        //MyGame.currentarea = null;
                    }
                    if (mesh.name.substr(0, 9) == "mesh_card")//移入卡牌
                    {
                        var card = mesh.card;
                        canvas.style.cursor = "help";
                        if (MyGame.WhoAmI != "world") {
                            if (card.ownerid == MyGame.WhoAmI && card.state == "inhand")//如果是自己的手牌
                            {
                                canvas.style.cursor = "pointer";
                                current_card = card;
                            }
                        }
                    }
                    else {
                        current_card = null;
                        canvas.style.cursor = "default";
                    }
                }
            }
            else {
                current_card = null;
                canvas.style.cursor = "default";
                if (MyGame.currentarea) {
                    MyGame.currentarea.renderingGroupId = 0;
                    //MyGame.currentarea = null;
                }
            }
        }
        else//在有选中手牌的情况下，从选中点向落点绘制一条橙色虚线，或者在选中棋子的情况下向目的地绘制一条线
        {
            if (pickInfo.hit) {
                var mesh = pickInfo.pickedMesh;
                if ((picked_card.state=="inhand"&&picked_card.standalone&&mesh.name.substr(0, 8) == "mesharea")
                    ||(picked_card.state=="inhand"&&!picked_card.standalone&&(mesh.name.substr(0, 9) == "mesh_card"))
                ||(picked_card.state=="inarea"&&(mesh.name.substr(0, 8) == "mesharea"||mesh.name.substr(0, 9) == "mesh_card"))) {
                    var picked_to = pickInfo.pickedPoint;
                    //绘制虚线
                    if (line_picked) {
                        line_picked.dispose();
                    }
                    line_picked = new BABYLON.MeshBuilder.CreateDashedLines("line_picked", {points: [picked_from, picked_to]}, scene);
                    line_picked.renderingGroupId = 3;
                    line_picked.isPickable=false;
                    line_picked.color = new BABYLON.Color3(1, 0.5, 0);
                    var div=MyGame.UiPanec.div_line_picked;
                    div.left=scene.pointerX+"px";
                    div.top=scene.pointerY+"px";
                    if(picked_card.state=="inhand")
                    {
                        div.text_line_picked.text="playout";
                        div.isVisible=true;
                    }
                    else if(picked_card.state=="inarea")
                    {
                        var arr_skillindex=picked_card.arr_skillindex;
                        var len=arr_skillindex.length;
                        var skill_find;
                        for(var i=0;i<len;i++)
                        {
                            var skill=list_skilldata[arr_skillindex[i]];
                            if(skill.isdefault)
                            {
                                skill_find=couldbeTarget(skill,mesh,picked_card);
                                if(skill_find)
                                {
                                    break;
                                }
                            }
                        }
                        if(skill_find)
                        {
                            div.text_line_picked.text=skill_find.name;
                            div.isVisible=true;
                        }
                        else
                        {
                            div.text_line_picked.text="";
                            div.isVisible=false;
                        }
                    }

                }

            }

        }
    }
}
function onMouseDown(evt)
{
    if(MyGame.flag_view!="first_ani")
    {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, MyGame.Cameras.camera0);
        if(pickInfo.hit)
        {
            var mesh = pickInfo.pickedMesh;

            if(mesh.name.substr(0,9)=="mesh_card")//移入卡牌->拖动入场
            {
                var mesh=pickInfo.pickedMesh;
                var card=mesh.card;
                //canvas.style.cursor="help";
                if(MyGame.WhoAmI!="world")
                {
                    if(card.ownerid==MyGame.WhoAmI&&(card.state=="inhand"||(card.state=="inarea"
                        &&(card.workstate=="waitformove"||card.workstate=="waitforwork"||card.workstate=="sleep"))))//如果是自己的手牌<-也应包括已经入场的牌
                    {
                        picked_card=card;
                        picked_card.line.material=MyGame.materials.mat_orange;
                        //picked_card.line.color=new BABYLON.Color3(1, 0.5, 0);
                        //从这里开始绘制一条虚线
                        picked_from=pickInfo.pickedPoint;//card.mesh.position.clone();
                    }
                }
            }
        }
    }


}
function dispose_pickedcard()
{
    if(picked_card)
    {
        picked_card.line.material = MyGame.materials.mat_black;
        picked_card = null;
        picked_from = null;
        if (line_picked) {
            MyGame.UiPanec.div_line_picked.isVisible=false;
            line_picked.dispose();
            line_picked = null;
        }

    }


}
function onMouseUp(evt)
{

    if(MyGame.flag_view!="first_ani") {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, MyGame.Cameras.camera0);
        if (pickInfo.hit)
        {
            var mesh = pickInfo.pickedMesh;
            if (true)
            {
                var row1,row2;
                if(MyGame.player.index_startpoint==1)
                {
                    row1=0;
                    row2=1;
                }
                else
                {
                    row1=4;
                    row2=5;
                }
                if (picked_card&&picked_card.state=="inhand"&&((!mesh.unit && picked_card.standalone&&mesh.name.substr(0, 8) == "mesharea"))&&(mesh.row==row1||mesh.row==row2)) //|| (mesh.unit && !picked_card.standalone))) {
                {//向放置点打出手牌
                    //@@@@出牌申请发给world
                    //picked_card.state = "inani";
                    //askforPlayout();
                    var obj_msg = {};
                    obj_msg.type = "playoutcard";//向world发起出牌请求
                    obj_msg.uuid = picked_card.uuid;
                    obj_msg.userid = MyGame.WhoAmI;
                    obj_msg.areaname = mesh.name;//currentarea的更新并不及时！！！！
                    sendMessage(JSON.stringify(obj_msg));
                    dispose_pickedcard();
                    MyGame.flag_view = "first_ani";//操作完成前，禁用下一操作,如果world迟迟不返回怎么办？
                }
                else if(picked_card&&picked_card.state=="inhand"&&(mesh.area && !picked_card.standalone&&mesh.name.substr(0, 9) == "mesh_card"))
                {//向棋子打出手牌
                    //picked_card.state = "inani";
                    var obj_msg = {};
                    obj_msg.type = "playoutcard";//向world发起出牌请求
                    obj_msg.uuid = picked_card.uuid;
                    obj_msg.userid = MyGame.WhoAmI;
                    obj_msg.areaname = mesh.area.name;//currentarea的更新并不及时！！！！
                    sendMessage(JSON.stringify(obj_msg));
                    dispose_pickedcard();
                    MyGame.flag_view = "first_ani";//操作完成前，禁用下一操作
                }
                else if(picked_card&&picked_card.state=="inarea"&&((mesh.name.substr(0, 9) == "mesh_card")||(mesh.name.substr(0, 8) == "mesharea")))
                {//向一个unit或者area发出default skill

                    //找到第一个符合要求的默认技能
                    var arr_skillindex=picked_card.arr_skillindex;
                    var len=arr_skillindex.length;
                    var skill_find;
                    //var skilltype;
                    for(var i=0;i<len;i++)
                    {
                        var skill=list_skilldata[arr_skillindex[i]];
                        if(skill.isdefault)
                        {
                            skill_find=couldbeTarget(skill,mesh,picked_card);
                            if(skill_find)
                            {
                                break;
                            }
                        }
                    }
                    if(skill_find)
                    {
                        //picked_card.state = "inani";
                        var obj_msg = {};
                        obj_msg.type = "releaseskill";//向world发起释放技能请求
                        obj_msg.skilltype=skill_find.skilltype;
                        obj_msg.uuid = picked_card.uuid;
                        obj_msg.userid = MyGame.WhoAmI;
                        if(obj_msg.skilltype=="selectarea")
                        {
                            obj_msg.targetname = mesh.name;//
                        }
                        else if(obj_msg.skilltype=="selectunit")
                        {
                            obj_msg.targetname = mesh.card.uuid;
                        }
                        obj_msg.skillindex=skill_find.index;
                        obj_msg.skilldis=skill_find.dis;
                        sendMessage(JSON.stringify(obj_msg));
                        dispose_pickedcard();
                        MyGame.flag_view = "first_ani";//操作完成前，禁用下一操作
                    }
                    else
                    {
                        dispose_pickedcard();
                    }
                }
            }

            else {
                dispose_pickedcard();

            }
        }
        else {
            dispose_pickedcard();
        }
    }
}
var flag_showcards=true;
function onKeyDown(event)
{//在播放动画时禁用所有的按键、鼠标效果
    /*if(MyGame.flag_view=="first_ani")
    {
        cancelPropagation(event);
        cancelEvent(event);
        return;
    }*/
    if(MyGame.flag_view!="first_ani")//
    {
        //cancelEvent(event);//覆盖默认按键响应
        var keyCode = event.keyCode;
        var ch = String.fromCharCode(keyCode);//键码转字符
        MyGame.arr_keystate[keyCode]=1;
        /*按键响应有两种，一种是按下之后立即生效的，一种是保持按下随时间积累的，第一种放在这里调度，第二种放在响应的控制类里*/
        if(keyCode==81)//Q
        {
            //隐藏所有手牌，防止遮挡棋盘《-同时要关联一个gui按钮，为移动端做准备
            CardMesh2.HideCards(MyGame.player.cardinhand);
            flag_showcards=false;
            MyGame.UiPanec.isVisible = false;
        }
        else if(keyCode==18||keyCode==27)//alt切换释放锁定->改为切换view
        {



        }
        else if(keyCode>=49&&keyCode<=53)//数字1-5
        {

        }
    }
}
function onKeyUp(event)
{
    if(MyGame.flag_view!="first_ani")
    {
        var keyCode = event.keyCode;
        var ch = String.fromCharCode(keyCode);//键码转字符
        MyGame.arr_keystate[keyCode]=0;
        if(keyCode==81)//Q
        {
            //松开时显示所有手牌
            CardMesh2.ShowCards(MyGame.player.cardinhand);
            flag_showcards=true;
        }
    }

    //}
}
function releaseKeyState()//将所有激活的按键状态置为0
{
    for(key in MyGame.arr_keystate)
    {
        MyGame.arr_keystate[key]=0;
    }
    //MyGame.UiPanec.isVisible = false;
    if(picked_card)
    {
        picked_card.line.material = MyGame.materials.mat_black;
        picked_card = null;
        if (line_picked) {
            line_picked.dispose();
        }

    }
    var len=arr_arrows.length;
    for(var i=0;i<len;i++)//清空原有的所有箭头
    {
        var arrow=arr_arrows[i];
        arrow.dispose();
        arrow.target.mesh_arrow=null;
        arrow=null;
    }
}


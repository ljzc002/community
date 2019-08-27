function initScene()
{
    console.log("初始化基本场景");
    //光照
    var light0 = new BABYLON.HemisphericLight("light0", new BABYLON.Vector3(0, 1, 0), scene);
    light0.diffuse = new BABYLON.Color3(1,1,1);//这道“颜色”是从上向下的，底部收到100%，侧方收到50%，顶部没有
    light0.specular = new BABYLON.Color3(0,0,0);
    light0.groundColor = new BABYLON.Color3(1,1,1);//这个与第一道正相反
    MyGame.lights.light0=light0;
    //相机网格对象
    var camera0= new BABYLON.UniversalCamera("FreeCamera", new BABYLON.Vector3(0, 0, 0), scene);//FreeCamera
    camera0.minZ=0.001;
    //camera0.attachControl(canvas,true);
    camera0.detachControl(canvas);
    if(MyGame.WhoAmI=="world")//(MyGame.WhoAmI=="world")
    {
        camera0.attachControl(canvas,true);
    }
    scene.activeCameras.push(camera0);
    //这一次要锁定相机，不许移动也不许旋转
    MyGame.player={
        name:MyGame.userid,//显示的名字
        id:MyGame.userid,//WebSocket Sessionid
        camera:camera0,
        methodofmove:"donotmove",
        mesh:new BABYLON.Mesh("mesh_"+MyGame.userid,scene),
        cardinhand:[],
        arr_units:[],
        handpoint:new BABYLON.Mesh("mesh_handpoint_"+MyGame.userid,scene),
        scal:5,
    };
    MyGame.player.handpoint.position=new BABYLON.Vector3(0,-14,31);
    MyGame.player.handpoint.parent=MyGame.player.mesh;
    MyGame.Cameras.camera0=camera0;
}
function initArena()
{
    console.log("初始化地形");
    //天空盒
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("../../ASSETS/IMAGE/SKYBOX/skybox", scene);//这里的目录不能更深否则babyljs找不到！！
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skybox.renderingGroupId = 1;//这个参数使得天空盒处于所有其他元素之外！？
    skybox.isPickable=false;


    //建立三段式的地面，每一段之间用凹槽分割，每一段使用不同的纹理
    if(true)
    {
        var func1=function(vec3)
        {
            if(vec3.z>15.1)
            {
                return true;
            }
            return false;
        }
        var func2=function(vec3)
        {
            if(vec3.z<-15.1)
            {
                return true;
            }
            return false;
        }
        var matrix1=new BABYLON.Matrix.Translation(0,-1,-14);
        var matrix2=new BABYLON.Matrix.Translation(0,-1,14);
        //下段
        var ground1=new FrameGround();
        var obj_p={
            name:"ground1",
            segs_x:8,
            segs_z:3,
            size_per_x:10,
            size_per_z:15,
            mat:"mat_shallowwater",
        };
        ground1.init(obj_p);
        ground1.TransVertex(func1,matrix1);
        ground1.TransVertex(func2,matrix2);
        MyGame.obj_ground.ground1=ground1;
        ground1.ground_base.position.z=-32;
        ground1.ground_base.freezeWorldMatrix();//冻结世界坐标系《-同时冻结世界坐标系也会触发一次世界坐标系计算！！否则渲染之前的世界矩阵都是单位阵！！！！
        ground1.ground_base.rowstart=0;
        //中段
        var ground2=new FrameGround();
        var obj_p={
            name:"ground2",
            segs_x:8,
            segs_z:3,
            size_per_x:10,
            size_per_z:15,
            mat:"mat_shallowwater",
        };
        ground2.init(obj_p);
        ground2.TransVertex(func1,matrix1);
        ground2.TransVertex(func2,matrix2);
        MyGame.obj_ground.ground2=ground2;
        ground2.ground_base.position.z=0;
        ground2.ground_base.freezeWorldMatrix();//冻结世界坐标系
        ground2.ground_base.rowstart=2;
        //上段
        var ground3=new FrameGround();
        var obj_p={
            name:"ground3",
            segs_x:8,
            segs_z:3,
            size_per_x:10,
            size_per_z:15,
            mat:"mat_shallowwater",
        };
        ground3.init(obj_p);
        ground3.TransVertex(func1,matrix1);
        ground3.TransVertex(func2,matrix2);
        MyGame.obj_ground.ground3=ground3;
        ground3.ground_base.position.z=32;
        ground3.ground_base.freezeWorldMatrix();//冻结世界坐标系
        ground3.ground_base.rowstart=4;
    }
    var mat_alpha_yellow=new BABYLON.StandardMaterial("mat_alpha_yellow", scene);
    mat_alpha_yellow.diffuseColor = new BABYLON.Color3(1, 1,0);
    mat_alpha_yellow.alpha=0.2;//不透明度
    mat_alpha_yellow.useLogarithmicDepth = true;
    mat_alpha_yellow.freeze();
    MyGame.materials.mat_alpha_yellow=mat_alpha_yellow;

    //在每段地面上放置18个可放置点
    if(true)
    {
        for(var key in MyGame.obj_ground)
        {
            var ground=MyGame.obj_ground[key];
            addDashArea(ground,8,12,1,1.5);
        }
    }

    var mesh_start1=new BABYLON.Mesh("mesh_start1",scene);
    mesh_start1.position=new BABYLON.Vector3(0, 46, -96);
    mesh_start1.rotation.x=0.3943;
    var mesh_start2=new BABYLON.Mesh("mesh_start2",scene);
    mesh_start2.position=new BABYLON.Vector3(0, 46, 96);
    mesh_start2.rotation.x=0.3943;
    mesh_start2.rotation.y=Math.PI;
    MyGame.arr_startpoint.push(mesh_start1, mesh_start2);
    //MyGame.Cameras.camera0.parent=MyGame.arr_startpoint[0];//将相机置于出生点

}
function addDashArea(ground,sizex,sizez,posx,posz)
{//向一个地形区域中添加放置点
    var arr_path=ground.ground_base.metadata.arr_path;
    var len=arr_path.length;
    var name=ground.name;
    var rowstart=ground.ground_base.rowstart;
    //用可见的虚线把放置区围起来
    var arr_linepoint=[new BABYLON.Vector3(-sizex/2,sizez/2,0),
        new BABYLON.Vector3(sizex/2,sizez/2,0),
        new BABYLON.Vector3(sizex/2,-sizez/2,0),
        new BABYLON.Vector3(-sizex/2,-sizez/2,0),
        new BABYLON.Vector3(-sizex/2,sizez/2,0)];
    ground.arr_mesharea=[];

    for(var i=0;i<len-1;i++)//对于每一条竖线
    {
        var path=arr_path[i];
        var len2=path.length;
        for(var j=len2-2;j>=2;j--)//z方向是从小往大排列的！！
        {
            var vec3=path[j];
            var pos=new BABYLON.Vector3(vec3.x+posx+sizex/2,0.5,vec3.z-posz-sizez/2);
            var name_point=name+"_"+i+"_"+j;
            var mesh_area=new BABYLON.MeshBuilder.CreatePlane("mesharea_"+name_point,{width :sizex,height:sizez,updatable:true},scene);
            mesh_area.material=MyGame.materials.mat_alpha_yellow;
            mesh_area.renderingGroupId=0;
            mesh_area.rotation.x=Math.PI/2;
            //mesh_area.isVisible=false;//一开始让放置区不可见，移入才可见
            mesh_area.position=pos;
            mesh_area.parent=ground.ground_base;
            //mesh_area.computeWorldMatrix();//计算世界矩阵
            mesh_area.freezeWorldMatrix();//冻结包括了计算
            mesh_area.row=rowstart+(j-2);//这个放置点在第几行，用来计算距离
            mesh_area.col=i;
            var line = new BABYLON.MeshBuilder.CreateDashedLines("line"+name_point, {points:arr_linepoint},scene);
            line.renderingGroupId=2;
            line.parent=mesh_area;
            //line.material.useLogarithmicDepth=true;//LinesMesh的材质没有对数深度设置！！
            ground.arr_mesharea.push(mesh_area);
        }
    }
}
var line_picked=null;
function initEvent()
{

    console.log("初始化控制事件");//这里尽量简化控制，主要是鼠标移动以及点击
    InitMouse();
    window.addEventListener("keydown", onKeyDown, false);//按键按下
    window.addEventListener("keyup", onKeyUp, false);//按键抬起
    window.addEventListener("resize", function () {
        if (engine) {
            engine.resize();
        }
    },false);
}
function initUI()
{
    console.log("初始化全局UI");
    MakeFullUI();
}
function initObj()
{
    console.log("初始化单位");//根据前面的查询结果初始化用户的单位
    var mesh_bullet=new BABYLON.MeshBuilder.CreateSphere("mesh_bullet",{diameter:1},scene);//一个暂时用来客串子弹的网格，认为场景中同一时刻只会存在一个
    mesh_bullet.position.y=100;
    mesh_bullet.renderingGroupId=2;
    mesh_bullet.material=MyGame.materials.mat_yellow;
    MyGame.bullet=mesh_bullet;
    //建立一个粒子系统用来显示

    var len=arr_myunits.length;//这里是初始化参数
    //不绘制自身，但如果是普通用户则要设置相机的位置
    if(MyGame.WhoAmI!="world")
    {
        var jsonstate=JSON.parse(myjsonstate==""?"{}":myjsonstate);
        if(jsonstate.index_startpoint)//在chrome中0会被当做false！！
        {
            var mesh_pos=MyGame.arr_startpoint[jsonstate.index_startpoint-1];
            MyGame.Cameras.camera0.position=mesh_pos.position.clone();
            MyGame.Cameras.camera0.rotation=mesh_pos.rotation.clone();
            MyGame.player.index_startpoint=jsonstate.index_startpoint;
            MyGame.player.mesh.parent=mesh_pos;
        }
        else
        {
            MyGame.Cameras.camera0.position=newland.MakeVector3(jsonstate.posx,jsonstate.posy,jsonstate.posz,0,10,-30);
            MyGame.Cameras.camera0.rotation=newland.MakeVector3(jsonstate.rotx,jsonstate.roty,jsonstate.rotz,0,0,0);
        }
    }
    else
    {
        MyGame.Cameras.camera0.position=new BABYLON.Vector3(0, 30, 0);
    }
    //初始化自己的单位
    for(var i=0;i<len;i++)
    {
        var unit=arr_myunits[i];
        var card=new CardMesh2();
        var obj_p={};
        obj_p.card=unit;
        obj_p.owner=MyGame.player;
        obj_p.width=8;
        obj_p.height=12;//卡牌的最佳比例是多少？原图片的比例应该是多少？如何减少拉伸变形造成的失真->要为每类卡牌设置单独的uv
        if(MyGame.WhoAmI=="world")//区分是否是world用户，如果是world用户则使用的state信息来自数据库是可执行脚本，否则state信息来自world用户是json格式
        {obj_p.isworld=true;}
        card.init(obj_p,scene);//这里是根据参数生成的对象
        //unit.mesh=card;//unit只用来初始化，之后就不用了？？！！
        MyGame.player.arr_units.push(card);//本体的单位存在MyGame对象中，而webuser的单位存在对应的player中？
    }
    //排列自己的手牌->根据长度居中排列
    var cardinhand=MyGame.player.cardinhand;
    CardMesh2.ArrangeHandCard(cardinhand);
    //初始化每个web用户，并且初始化它们的手牌
    var len=arr_webusers.length;
    for(var i=0;i<len;i++)
    {
        var user=arr_webusers[i];
        if(user.id=="world")//world用户不显示本体，也不会具备手牌，
        {
            var units=user.units;
            var len2=units.length;
            for(var j=0;j<len2;j++)
            {
                var unit=units[j];
                var card=new CardMesh2();
                var obj_p={};
                obj_p.card=unit;
                //obj_p.owner="world";
                obj_p.owner={id:"world",name:"world"};
                obj_p.width=8;
                obj_p.height=12;
                if(MyGame.WhoAmI=="world")//区分是否是world用户，如果是world用户则使用的state信息来自数据库是可执行脚本，否则state信息来自world用户是json格式
                {obj_p.isworld=true;}
                card.init(obj_p,scene);
                //unit.mesh=card;
                MyGame.world.arr_units.push(card);
            }
        }
        else
        {
            //用BallMan作为CameraMesh的mesh！！！！
            var player = new BallMan();
            var obj_p={};//初始化参数
            var mesh_ballman=new BABYLON.Mesh("mesh_ballman"+user.uuid,scene);
            obj_p.mesh=mesh_ballman;
            var jsonstate=null;
            if(MyGame.WhoAmI=="world")
            {
                jsonstate=eval("a="+(user.jsonstate==""?"{}":user.jsonstate));//如果不加赋值运算符a=，jsonstate会被设置为一个简单值！！！！
            }
            else
            {
                jsonstate=JSON.parse(user.jsonstate==""?"{}":user.jsonstate);
            }
            //isNaN(null,flase)的结果同样是false！！！！
            if(jsonstate.index_startpoint)//在chrome中0会被当做false！！
            {
                obj_p.mesh.parent=MyGame.arr_startpoint[jsonstate.index_startpoint-1];
                obj_p.index_startpoint=jsonstate.index_startpoint;
            }
            else
            {
                obj_p.mesh.position=newland.MakeVector3(jsonstate.posx,jsonstate.posy,jsonstate.posz,0,10,-30);
                obj_p.mesh.rotation=newland.MakeVector3(jsonstate.rotx,jsonstate.roty,jsonstate.rotz,0,0,0);
            }
            obj_p.name=user.id;//显示的名字
            obj_p.id=user.id;//WebSocket Sessionid
            obj_p.image="../../ASSETS/IMAGE/t_hj2.png";
            obj_p.scal=5;
            player.init(
                obj_p,scene
            );
            user.mesh=player;
            player.cardinhand=[];
            player.arr_units=[];
            //这里还要用user 的jsonstate设置user的位置和姿态
            var units=user.units;
            var len2=units.length;
            for(var j=0;j<len2;j++)
            {
                var unit=units[j];
                var card=new CardMesh2();
                var obj_p={};
                obj_p.card=unit;
                //obj_p.owner=user.id;
                obj_p.owner=player;//@@@@需要调试
                obj_p.width=8;
                obj_p.height=12;
                if(MyGame.WhoAmI=="world")//区分是否是world用户，如果是world用户则使用的state信息来自数据库是可执行脚本，否则state信息来自world用户是json格式
                {obj_p.isworld=true;}
                card.init(obj_p,scene);
                //unit.mesh=card;
                player.arr_units.push(card);
            }
            //排列web用户的手牌->根据长度居中排列
            var cardinhand=player.cardinhand;
            CardMesh2.ArrangeHandCard(cardinhand);

            MyGame.arr_webplayers[user.id]=player;
        }
    }
}
function initLoop()
{
    var _this=MyGame;
    scene.registerBeforeRender(function() {     //比runRenderLoop更早

    });
    scene.registerAfterRender(function() {     //这里使用固定的出生点，所以不移动相机！！！！
        if(MyGame.flag_startr==1)//如果开始渲染了
        {
            if(MyGame.userid=="world")
            {
                var debug_flag=false;
                var obj_msg={};
                obj_msg.type="synchronizestate";
                obj_msg.framedate=new Date().getTime();
                //obj_msg.userdata={};
                var userdata={}
                //发给所有人相同的信息？ispublic的变化像catchcard一样单独传送！！
                for(key in MyGame.arr_webplayers)//对于每一个webplayers
                {
                    if(key!="world")
                    {
                        var webuser=MyGame.arr_webplayers[key];
                        var obj_user={};//ballman不运动
                        obj_user.arr_units=[];

                        var arr=webuser.arr_units;
                        var len=arr.length;
                        for(var i=0;i<len;i++)
                        {
                            var unit=arr[i];
                            if(unit.state!="inhand"&&unit.state!="inarea")//暂时只不同步这两种
                            {// 暂时只同步inphysic和inani
                                var rot=newland.qua2rot(unit.mesh);
                                var obj_unit={posx:unit.mesh.position.x,posy:unit.mesh.position.y,posz:unit.mesh.position.z
                                    ,rotx:rot.x,roty:rot.y,rotz:rot.z,
                                    uuid:unit.uuid
                                    ,scax:unit.mesh.scaling.x,scay:unit.mesh.scaling.y,scaz:unit.mesh.scaling.z};
                                obj_user.arr_units.push(obj_unit);
                                debug_flag=true;
                            }
                        }
                        userdata[key]=obj_user;
                    }
                }
                var len=MyGame.player.arr_units.length;
                var obj_user={};
                obj_user.arr_units=[];
                for(var i=0;i<len;i++)
                {
                    var unit=MyGame.player.arr_units[i];
                    if(unit.state!="inhand"&&unit.state!="inarea")//暂时只不同步这两种
                    {// 暂时只同步inphysic和inani
                        var obj_unit={posx:unit.mesh.position.x,posy:unit.mesh.position.y,posz:unit.mesh.position.z
                            ,rotx:unit.mesh.rotation.x,roty:unit.mesh.rotation.y,rotz:unit.mesh.rotation.z,
                            uuid:unit.uuid
                            ,scax:unit.mesh.scaling.x,scay:unit.mesh.scaling.y,scaz:unit.mesh.scaling.z};
                        obj_user.arr_units.push(obj_unit);
                        debug_flag=true;
                    }
                }
                userdata["world"]=obj_user;
                obj_msg.userdata=userdata;
                //最后加上world！！
                sendMessage(JSON.stringify(obj_msg));
            }
        }
    });
    engine.runRenderLoop(function ()        //场景逻辑和AI也从这里引入
    {
        if (divFps) {
            // Fps
            divFps.innerHTML = engine.getFps().toFixed() + " fps";
        }
        MyGame.HandleNoHurry();//这里包含了运动使用的计时器
        var DeltaTime=MyGame.DeltaTime;
        _this.scene.render();

    });

}
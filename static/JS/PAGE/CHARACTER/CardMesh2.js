/**
 * Created by lz on 2018/10/19.
 */
/*在这里使用一种更简化的卡片网格，并且对这个网格添加隐形的外边界和物理仿真器*/
CardMesh2=function()
{
    newland.object.call(this);
}
CardMesh2.prototype=new newland.object();
CardMesh2.prototype.init=function(param,scene)
{
    //param = param || {};
    if(!param||!param.card)
    {
        alert("卡牌初始化失败");
        return;
    }
    this.arr_equipment=[];
    this.owner=param.owner;
    this.ownerid=this.owner.id;
    this.uuid= param.card.uuid;
    this.isworld=param.isworld;
    if(this.isworld)
    {
        this.jsonstate= eval("a="+param.card.jsonstate);//数据库里保存js代码而非json！！！！
        //eval的结果如果是一个数组，则可以直接赋值数组
        //如果结果是一个对象，如果对象只有一个属性则赋值结果是这个属性的值，如果有多个属性则会报错，可以通过在eval内部写一个赋值运算符来规避这一点
    }
    else
    {
        this.jsonstate= JSON.parse(param.card.jsonstate);
    }
    var jsonstate=this.jsonstate;//某个单位的状态
    this.belongto=this.ownerid;
    this.ispublic= param.card.ispublic;
    this.state=this.jsonstate.state?this.jsonstate.state:"inheap";//非world用户的unit也可能在heap里？？
    //var jsonp=
    var jsonp=this.isworld?eval("a="+param.card.jsonp):JSON.parse(param.card.jsonp);//这一单位类型的属性
    this.jsonp=jsonp;
    this.standalone=jsonp.standalone;//是单独放置在区域里，还是必须放置在已经放置的其他单位上
    this.arr_skillindex=jsonp.skills;
    //建立网格
    this.width=param.width;
    this.height=param.height;
    //显示纹理
    var mesh_card=new BABYLON.MeshBuilder.CreatePlane("mesh_card"+this.uuid
        ,{height:this.height,width:this.width
            ,frontUVs:jsonp.frontUVs?BABYLON.Vector4.FromArray(jsonp.frontUVs):new BABYLON.Vector4(0,0,1,1)//那么一开始背面向上的卡牌岂不是无法应用frontUVs？？
            ,backUVs:jsonp.backUVs?BABYLON.Vector4.FromArray(jsonp.backUVs):new BABYLON.Vector4(0,0,1,1)
        ,sideOrientation: BABYLON.Mesh.DOUBLESIDE},scene);
    mesh_card.renderingGroupId=2;

    this.hp=jsonstate.hp||jsonp.hp;
    this.maxhp=jsonstate.maxhp||jsonp.hp;
    this.mp=jsonstate.mp||jsonp.mp;
    this.maxmp=jsonstate.maxmp||jsonp.mp;
    this.sp=jsonstate.sp||jsonp.sp;
    this.maxsp=jsonstate.maxsp||jsonp.sp;
    this.at=jsonstate.at||jsonp.at;
    this.Cost1=jsonstate.Cost1||jsonp.Cost1;
    this.Cost2=jsonstate.Cost2||jsonp.Cost2;
    this.power=jsonstate.power||jsonp.power||1;//可移动次数
    this.couldbeTarget={//一个棋子可能因各种原因可以被选作目标或者不可被选作目标
        normal:1
    };
    this.workstate=jsonstate.workstate||jsonp.workstate||"sleep";//"sleep";测试时暂时使用waitformove之后换回sleep

    mesh_card.card=this;
    this.mesh=mesh_card;
    //从侧面看需要显示一条边线
    var path_line=[new BABYLON.Vector3(this.width/2,this.height/2,0),
        new BABYLON.Vector3(this.width/2,-this.height/2,0),
        new BABYLON.Vector3(-this.width/2,-this.height/2,0),
        new BABYLON.Vector3(-this.width/2,this.height/2,0),
        new BABYLON.Vector3(this.width/2,this.height/2,0),];
    var mesh_line = BABYLON.MeshBuilder.CreateTube("mesh_line" + this.uuid, {
        path: path_line,
        radius: 0.02,
        updatable: true
    }, scene);
    //mesh_line.isPickable=false
    mesh_line.renderingGroupId=2;
    mesh_line.parent=mesh_card;
    this.line=mesh_line;
    mesh_line.material=MyGame.materials.mat_black;
    //通过逻辑判断，确定card的属性、网格的位置、纹理、物理效果
    if(this.ownerid=="world")//裁判看到所有
    {
        this.name = param.card.name;
        //this.jsonp= JSON.parse(param.card.jsonp);
        this.mainpic= param.card.mainpic;
        this.mainback= param.card.mainback;
        this.comment= this.ownerid+"_"+param.card.comment;
            mesh_card.position=newland.MakeVector3(jsonstate.posx,jsonstate.posy,jsonstate.posz,0,10,0);
            mesh_card.rotation=newland.MakeVector3(jsonstate.rotx,jsonstate.roty,jsonstate.rotz,Math.PI/2,0,0);
    }
    else //if(this.state=="inhand")//非world用户所有，且在手中
    {
        if(this.belongto==MyGame.userid)//是自己的
        {
            this.name = param.card.name;
            //this.jsonp= JSON.parse(param.card.jsonp);
            this.mainpic= param.card.mainpic;
            this.mainback= param.card.mainback;
            this.comment= this.ownerid+"_"+param.card.comment;
        }
        else//是他人的
        {
            if((this.ispublic+"")=="0"&&MyGame.WhoAmI!="world")//如果未公开
            {
                this.name = "?";
                //this.jsonp= null;
                this.mainpic= "../../ASSETS/PIC/cardback/link.jpg";//未知目标的正面也显示为背面！
                this.mainback= "../../ASSETS/PIC/cardback/link.jpg";
                this.comment= this.ownerid+"_"+"?";
            }
            else {
                this.name = param.card.name;
                //this.jsonp= JSON.parse(param.card.jsonp);
                this.mainpic= param.card.mainpic;
                this.mainback= param.card.mainback;
                this.comment= this.ownerid+"_"+param.card.comment;
            }
        }
        if(this.state=="inarea"&&this.standalone)//如果一开始就在场上
        {
                var area=findAreaByName(this.jsonstate.areaname);
                if(area)
                {
                    this.area=area;
                    area.unit=this;
                    area.isPickable=false;
                    //this.mesh.position=area.absolutePosition.clone();
                    // 如果此时还没有进行渲染，则absolutePosition可能还是000，世界矩阵也还是单位阵！！！！
                    this.mesh.position=newland.vecToGlobal(new BABYLON.Vector3(0,0,0),area);
                    this.mesh.rotation.x=Math.PI/2;
                    if(this.owner.index_startpoint==2)
                    {
                        this.mesh.rotation.x=-Math.PI/2;
                    }
                    this.mesh.position.y+=0.1;
                    this.showStrip();
                }
                else
                {
                    this.state="inhand";
                    mesh_card.parent=this.owner.handpoint;
                    this.owner.cardinhand.push(this);
                }
        }
        else if(this.state=="inhand")
        {
            mesh_card.parent=this.owner.handpoint;//@@@@需要调试,注有父网格存在时不能使用物理引擎《-需要在物理引擎层面设置关联关系
            this.owner.cardinhand.push(this);
        }
    }


    this.scene = param.scene;
    this.isPicked=false;//这个卡片是否被选中

        //双面纹理
        //var materialf = new BABYLON.StandardMaterial(this.uuid + "cardf", this.scene);//测试用卡片纹理
        if (MyGame.materials[this.name])//通过名称来判断这一种材质是否已经被初始化过。
        {
            mesh_card.material = MyGame.materials[this.name];
        }
        else {
            var materialf = new BABYLON.StandardMaterial(this.name + "cardf", scene);
            materialf.diffuseTexture = new BABYLON.Texture(this.mainpic, scene);
            materialf.diffuseTexture.hasAlpha = false;
            materialf.backFaceCulling = true;
            materialf.bumpTexture =MyGame.textures["grained_uv"];
            materialf.useLogarithmicDepth = true;
            //materialf.diffuseTexture.hasAlpha=true;
            //materialf.useAlphaFromDiffuseTexture=true;
            materialf.freeze();
            MyGame.materials[this.name] = materialf;
            mesh_card.material =materialf;
        }
}
//完整的删除一个card对象的所有内容
CardMesh2.prototype.dispose=function()
{
    this.state="disposeing";
    /*if(this.mesh.physicsImpostor)
    {
        this.mesh.physicsImpostor.dispose();
        this.mesh.physicsImpostor=null;
    }
    this.mesh.content.dispose();*/
    this.line.dispose();
    this.mesh.dispose();
    if(this.strip_hp)
    {
        this.strip_hp.mesh.dispose();
    }
    if(this.strip_sp)
    {
        this.strip_sp.mesh.dispose();
    }
    if(this.strip_mp)
    {
        this.strip_mp.mesh.dispose();
    }
    if(this.owner)//从所有者管辖中删除
    {
        var arr1=this.owner.cardinhand;
        var len1=arr1.length;
        for(var j=0;j<len1;j++)
        {
            if(this.uuid==arr1[j].uuid)
            {
                arr1.splice(j,1);
                break;
            }
        }
        var arr2=this.owner.arr_units;
        var len2=arr2.length;
        for(var j=0;j<len2;j++)
        {
            if(this.uuid==arr2[j].uuid)
            {
                arr2.splice(j,1);
                break;
            }
        }
    }
}
//根据卡牌的属性为卡牌添加各种“条”
CardMesh2.prototype.showStrip=function()
{
    if(this.strip_hp)
    {
        this.strip_hp.mesh.dispose();
    }
    if(this.strip_sp)
    {
        this.strip_sp.mesh.dispose();
    }
    if(this.strip_mp)
    {
        this.strip_mp.mesh.dispose();
    }
    var flag_y=1;
    var flag_z=1
    if(MyGame.WhoAmI=="world")
    {
        if(this.owner.index_startpoint==2)
        {
            flag_z=-1;
        }
    }
    else
    {
        //if(MyGame.player.index_startpoint==2)
        if(MyGame.player.index_startpoint==2)
        {
            flag_z=-1;
        }
        if(this.owner.index_startpoint!=MyGame.player.index_startpoint)
        {
            flag_y=-1;
            flag_z*=-1;
        }

    }

    var mat_frame = new BABYLON.StandardMaterial("mat_frame", scene);
    mat_frame.wireframe = true;
    mat_frame.useLogarithmicDepth = true;
    mat_frame.freeze();
    var mat_red=new BABYLON.StandardMaterial("mat_red", scene);
    mat_red.diffuseColor = new BABYLON.Color3(1, 0, 0);
    mat_red.useLogarithmicDepth = true;
    mat_red.freeze();
    var mat_green=new BABYLON.StandardMaterial("mat_green", scene);
    mat_green.diffuseColor = new BABYLON.Color3(0, 1, 0);
    mat_green.useLogarithmicDepth = true;
    mat_green.freeze();
    var mat_yellow=new BABYLON.StandardMaterial("mat_yellow", scene);
    mat_yellow.diffuseColor = new BABYLON.Color3(1, 1, 0);
    mat_yellow.useLogarithmicDepth = true;
    mat_yellow.freeze();
    var mat_blue=new BABYLON.StandardMaterial("mat_blue", scene);
    mat_blue.diffuseColor = new BABYLON.Color3(0, 0, 1);
    mat_blue.useLogarithmicDepth = true;
    mat_blue.freeze();

    if(this.maxhp)
    {
        var strip_hp=new PointStrip();
        var obj_p={
            name:"strip_hp_"+ this.uuid,
            point_frame:this.hp,
            seg_frame:this.maxhp,
            size:this.width,
            mat_frame:mat_frame,
            mat_solid:mat_red,
        }
        strip_hp.init(obj_p);
        strip_hp.mesh.parent=this.mesh;
        strip_hp.mesh.position.y=(this.height/2+1)*flag_y;
        strip_hp.mesh.position.z=-1*flag_z;
        this.strip_hp=strip_hp;
    }
    if(this.maxsp)
    {
        var strip_hp=new PointStrip();
        var obj_p={
            name:"strip_sp_"+ this.uuid,
            point_frame:this.sp,
            seg_frame:this.maxsp,
            size:this.width,
            mat_frame:mat_frame,
            mat_solid:mat_yellow,
        }
        strip_hp.init(obj_p);
        strip_hp.mesh.parent=this.mesh;
        strip_hp.mesh.position.y=(this.height/2+1.5)*flag_y;
        strip_hp.mesh.position.z=-1.5*flag_z;
        this.strip_sp=strip_hp;
    }
    if(this.maxmp)
    {
        var strip_hp=new PointStrip();
        var obj_p={
            name:"strip_mp_"+ this.uuid,
            point_frame:this.mp,
            seg_frame:this.maxmp,
            size:this.width,
            mat_frame:mat_frame,
            mat_solid:mat_blue,
        }
        strip_hp.init(obj_p);
        strip_hp.mesh.parent=this.mesh;
        strip_hp.mesh.position.y=(this.height/2+0.5)*flag_y;
        strip_hp.mesh.position.z=-0.5*flag_z;
        this.strip_mp=strip_hp;
    }
}
//修改条
CardMesh2.prototype.changeStrip=function(name,point,callback)
{
    var strip=this[name];
    var tube_solid=strip.tube_solid;
    strip.point_solid=point;
    var animation=new BABYLON.Animation("animation","position.x",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var keys=[{frame:0,value:tube_solid.position.x},{frame:30,value:-strip.size*(1-(strip.point_solid/strip.point_frame))/2}];
    animation.setKeys(keys);
    tube_solid.animations.push(animation);
    var animation2=new BABYLON.Animation("animation2","scaling.y",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var keys2=[{frame:0,value:tube_solid.scaling.y},{frame:30,value:(strip.point_solid/strip.point_frame)}];
    animation2.setKeys(keys2);
    tube_solid.animations.push(animation2);
    scene.beginAnimation(tube_solid, 0, 30, false,1,function(){
        if(callback)
        {
            callback();
        }
    });
}
CardMesh2.ArrangeHandCard=function(cardinhand)
{
    var len=cardinhand.length;
    for(var i=0;i<len;i++)
    {

        var mesh=cardinhand[i].mesh;
        var scal=mesh.card.owner.scal;
        scal=scal?scal:1;
        mesh.position.z=(-i*0.1+(len*0.1)/2)*scal;
        mesh.position.x=(0.6*i-(len*0.6)/2)*scal;
        mesh.position.y=0;
        var pos=new BABYLON.Vector3(0,2.5*scal,-6.2*scal);
        mesh.lookAt(pos);
    }
}
CardMesh2.HideCards=function(arr_card)
{
    var len=arr_card.length;
    for(var i=0;i<len;i++)
    {
        var card=arr_card[i];
        //var mesh=arr_card[i].mesh;
        card.mesh.isVisible=false;
        card.line.isVisible=false;
    }
}
CardMesh2.ShowCards=function(arr_card)
{
    var len=arr_card.length;
    for(var i=0;i<len;i++)
    {
        var card=arr_card[i];
        card.mesh.isVisible=true;
        card.line.isVisible=true;
    }
}
CardMesh2.prototype.ani_floatstr=function(str,styles,callback)
{//建立一个基于canvas纹理的对象，让它飘起来然后消失
    var mesh=this.mesh;
    str+="";//前面如果传来的是数字，则取不到length！！
    var size_x=str.length*30;
    var mesh_str = new BABYLON.MeshBuilder.CreateGround(this.name + "mesh_str", {
        width: size_x/20,
        height: 3
    }, scene);
    //mesh_str.convertToUnIndexedMesh();
    //mesh_str.parent=mesh;
    mesh_str.position=mesh.absolutePosition.clone();
    mesh_str.position.y+=0.8;
    //mesh_str.position =new BABYLON.Vector3(0,0,0);
    mesh_str.renderingGroupId = 3;//这些文字是特别强调内容
    var mat_str = new BABYLON.StandardMaterial(this.name + "mat_str", scene);
    var texture_str = new BABYLON.DynamicTexture(this.name + "texture_str", {
        width: size_x,
        height: 40
    }, scene);
    mat_str.diffuseTexture = texture_str;
    mesh_str.material = mat_str;
    mesh_str.lookAt(MyGame.Cameras.camera0.position);
    mesh_str.rotation.x = -Math.PI / 2;
    mesh_str.isPickable = false;
    texture_str.hasAlpha=true;
    mat_str.useAlphaFromDiffuseTexture=true;

    //经过测试发现，在Chrome中canvas的绘图是以图像的左上角定位的，而文字绘制则是以文字的左下角定位的！！！！
    var context_comment = texture_str.getContext();
    context_comment.fillStyle = "rgba(255,255,255,0)";//"transparent";
    context_comment.fillRect(0, 0, size_x, 40);
    //context_comment.fillStyle = "#ffffff";
    context_comment.fillStyle = "#ff0000";
    context_comment.font = "bold 30px monospace";
    var len=styles.length;
    for(var i=0;i<len;i++)
    {
        context_comment[styles[i][0]]=styles[i][1];
    }
    //newland.canvasTextAutoLine(str, context_comment, 1, 30, 35, 34);
    context_comment.fillText(str,0,30);
    texture_str.update();
    //mat_str.freeze();
    var animation=new BABYLON.Animation("animation","position.y",30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    //var pos1=mesh_str.position.clone();
    //var pos2=mesh_str.position.clone();
    //pos2.y+=2;
    var keys=[{frame:0,value:mesh_str.position.y},{frame:30,value:(mesh_str.position.y+5)}];
    animation.setKeys(keys);
    mesh_str.animations.push(animation);
    scene.beginAnimation(mesh_str, 0, 30, false,1,function(){
        mesh_str.dispose();
        mat_str.dispose();
        texture_str.dispose();
        if(callback)
        {
            callback();
        }

    });

}
CardMesh2.prototype.ani_destory=function(callback)
{//先换成灰白色图片，然后上浮
    var mesh=this.mesh;
    this.workstate="dust";

    var animation=new BABYLON.Animation("ani_destory","position",30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var pos1=this.mesh.position.clone();
    var pos2=this.mesh.position.clone();
    pos2.y+=2;
    var keys=[{frame:0,value:pos1},{frame:30,value:pos2}];
    animation.setKeys(keys);
    mesh.animations=[];
    mesh.animations.push(animation);
    scene.beginAnimation(mesh, 0, 30, false,1,function(){
        if(this.area)
        {
            this.area.unit=null;
            this.area.isPickable=true;
        }
        mesh.card.dispose();
        if(callback)
        {
            callback();
        }
    });
}
CardMesh2.prototype.ani_shake=function(callback)//上下晃动一下
{
    var mesh=this.mesh;
    mesh.animations=[];
    var animation=new BABYLON.Animation("animation","position",30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var pos1=mesh.position.clone();
    var pos2=mesh.position.clone();
    pos2.y+=0.5;
    var keys=[{frame:0,value:pos1},{frame:15,value:pos2},{frame:30,value:pos1}];
    animation.setKeys(keys);
    mesh.animations.push(animation);
    scene.beginAnimation(mesh, 0, 30, false,1,function(){
        if(callback)
        {
            callback();
        }
    });
}
CardMesh2.prototype.ani_hit=function(target,middlecallback,callback)//冲过去撞一下，然后回来
{
    var mesh=this.mesh;
    mesh.animations=[];
    var animation=new BABYLON.Animation("ani_hit","position",30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var pos1=mesh.position.clone();
    var pos2=target.mesh.position.clone();
    var keys=[{frame:0,value:pos1},{frame:30,value:pos2},{frame:60,value:pos1}];
    animation.setKeys(keys);
    var event1 = new BABYLON.AnimationEvent(30, function()
    {
        if(middlecallback)
        {
            middlecallback();
        }
    });
    animation.addEvent(event1);
    mesh.animations.push(animation);

    scene.beginAnimation(mesh, 0, 60, false,1,function(){
        if(callback)
        {
            callback();
        }
    });
}



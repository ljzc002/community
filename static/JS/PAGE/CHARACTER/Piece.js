//建立综合棋子对象，既可能是由源模型派生来的实例也可能就是原模型
Piece=function()
{
    newland.object.call(this);
}
Piece.prototype=new newland.object();
Piece.prototype.init=function(param,scene)
{
    param = param || {};
    newland.object.prototype.init.call(this,param);//继承原型的方法
    this.name=param.name;
    this.id=param.id;
    this.index=param.index;
    this.centuriaid=param.centuriaid;
    this.indexinCenturia=param.indexinCenturia;
    this.outlineMesh=param.outlineMesh;
    this.renderType=param.renderType;
    this.solid=null;//棋子的实体
    if(this.renderType=="mesh")
    {
        this.solid=this.mesh;
    }
    else if(this.renderType=="instance")
    {
        //this.instance=param.instance;
        this.solid=this.mesh.createInstance(this.id);
    }
    if(!this.solid)
    {
        console.log("添加棋子实体失败_"+this.name);
        return;
    }
    else
    {
        if(param.position)
        {
            this.solid.position=param.position;
        }
        if(param.rotation)
        {
            this.solid.rotation=param.rotation;
        }
        if(param.scaling)
        {
            this.solid.scaling=param.scaling;
        }
    }
    this.mydata=param.mydata;
    this.workState="waiting";
    this.onground=false;//认为刚出现时不与地面接触
    this.toground=0;
    this.height=param.height;
    this.ray=new BABYLON.Ray(this.solid.position, new BABYLON.Vector3(0,-1,0), 100);
    var hit=scene.pickWithRay(this.ray,FrameGround.predicate);
    if (hit.pickedMesh){
        this.toground=hit.distance;
    }
    else
    {
        this.toground=999;
    }

    this.commandId=null;
    var _this = this;
    console.log("添加了棋子_"+this.name);
}
Piece.prototype.moveWithRay=function(time)
{
    //先向前进方向做水平射线,direction的y必须是0
    var direction=this.xzpos.clone().subtract(this.solid.position);
    direction.y=0;
    var ray = new BABYLON.Ray(this.solid.position, direction, this.mydata.speed);
    //虽然在这里尝试限制pick的长度范围，但并没有效果，仍然pick到了远处的spacecraft！！！！
    var hit = scene.pickWithRay(ray,FrameGround.predicate);
    var move=this.mydata.speed;//移动的长度
    //手动限制pick范围！！
    if (hit.pickedMesh&&hit.distance<this.mydata.speed){//如果发出的这条射线接触到了网格，则再发射一条低一点的射线，检测障碍物的斜率
        var pos1=hit.pickedPoint;
        var dis1=hit.distance;
        var orgin2=this.solid.position.clone();
        orgin2.y-=this.height/10;
        //var direction2=direction.clone();
        //direction2.y-=this.height/10;
        var ray2=new BABYLON.Ray(orgin2, direction, this.mydata.speed);
        var hit2 = scene.pickWithRay(ray2,FrameGround.predicate);

        if(hit.pickedMesh)
        {
            var pos2=hit2.pickedPoint;
            var dis2=hit2.distance;

            if(((dis1-dis2)/(pos1.y-pos2.y))<Math.tan(Math.PI/36))//障碍物过于陡峭
            {
                this.workState="puzzled";
            }
            else
            {
                var arc=Math.atan((dis1-dis2)/(pos1.y-pos2.y));
                move=move*Math.sin(arc);
            }
        }
        else//有限射程内没有击中，单位进入困惑状态
        {
            this.workState="puzzled";
        }
    }else//前进方向上没有障碍物
    {

    }
    this.xztarget=this.solid.position.clone().add(direction.normalizeFromLength(1/(move*time/1000)));//这个标准化方法其实是相反的！！！！
    this.xztarget.y=50;
    //如果已经接近最终目的地
    var x=this.xzpos.x-this.xztarget.x;
    var z=this.xzpos.z-this.xztarget.z;
    if((x*x+z*z)<(move*move/900))//直接移动到目的地
    {
        this.xztarget.x=this.xzpos.x;
        this.xztarget.z=this.xzpos.z;
        this.workState="waiting";
        console.log(this.name+"到达位置"+this.xztarget.x+"_"+this.xztarget.z);
    }
    this.solid.position.x=this.xztarget.x;
    this.solid.position.z=this.xztarget.z;
    //根据地形重设高度
    this.ray=null;
    this.ray=new BABYLON.Ray(this.xztarget, new BABYLON.Vector3(0,-1,0), 100);
    var hit=scene.pickWithRay(this.ray,FrameGround.predicate);
    if (hit.pickedMesh){
        //this.toground=hit.distance;
        this.solid.position.y=this.xztarget.y+=(0.1-hit.distance);
        this.toground=0.1;
    }
    else//如果没有触及到地面
    {
        this.solid.position.y=0.1;
        this.toground=0.1;
        this.workState="puzzled";
    }

}
//点数条，外面一圈表示点数的参考条，里面一条表示当前值的圆柱
//横向条柱，以最左侧为参考点？《-还是以中间为参考点更直观
PointStrip=function()
{

}
PointStrip.prototype.init=function(param)
{
    param = param || {};
    this.name=param.name;
    this.point_frame=param.point_frame;
    this.seg_frame=param.seg_frame||1;//表示分成的段数，切分数为-1，垂线数为+1
    this.size=param.size||10;
    this.diameter_frame=param.diameter_frame||1;//直径
    //this.pointperseg=param.pointperseg||(this.point_frame/this.seg_frame);
    this.point_solid=param.point_solid||this.point_frame;//默认满值
    this.diameter_solid=param.diameter_solid||0.8;//直径
    this.mat_frame=param.mat_frame;
    this.mat_solid=param.mat_solid;

    var tube_frame=new BABYLON.Mesh("tube_frame_"+this.name,scene);
    //tube_frame.rotation.z=Math.PI/2;
     /*   new BABYLON.MeshBuilder.CreateCylinder("tube_frame_"+this.name
        ,{height :this.size,diameter :this.diameter_frame,subdivisions:this.seg_frame>10?1:this.seg_frame ,tessellation :8},scene);
    tube_frame.material=this.mat_frame;
    tube_frame.rotation.z=Math.PI/2;
    tube_frame.renderingGroupId=2;*/
     var lines=[];
     var sizeperseg=this.size/this.seg_frame;
     if(this.seg_frame<=10)//改用多边形代替圆柱体，
     {
         for(var i=0;i<=this.seg_frame;i++)//对于每一片
         {
             var path=PointStrip.MakeRing(this.diameter_frame/2,24,(i-this.seg_frame/2)*sizeperseg);
             lines.push(path);
         }
     }
     else
     {
         lines.push(PointStrip.MakeRing(this.diameter_frame/2,24,(-this.size/2)));
         lines.push(PointStrip.MakeRing(this.diameter_frame/2,24,(this.size/2)));
     }
    var line_frame = new BABYLON.MeshBuilder.CreateLineSystem("line_frame_"+this.name,{lines:lines,updatable:false},scene);
    line_frame.parent=tube_frame;
    line_frame.renderingGroupId=2;
    line_frame.color=new BABYLON.Color3(1, 1, 1);
    line_frame.useLogarithmicDepth = true;
    var tube_solid=new BABYLON.MeshBuilder.CreateCylinder("tube_solid_"+this.name
        ,{height :this.size,diameter :this.diameter_solid,subdivisions:1 },scene);
    tube_solid.material=this.mat_solid;//原来的材质可能不使用对数深度缓存？
    //tube_solid.material.useLogarithmicDepth = true;
    tube_solid.scaling.y=(this.point_solid/this.point_frame);
    //数值变化时通过movewithani同时调整缩放和位置
    tube_solid.rotation.z=Math.PI/2;
    tube_solid.renderingGroupId=2;
    tube_solid.parent=tube_frame;
    tube_solid.position.x-=this.size*(1-(this.point_solid/this.point_frame))/2;//靠左侧对齐
    this.mesh=tube_frame;
    this.tube_frame=tube_frame;
    this.tube_solid=tube_solid;
    this.line_frame=line_frame;
};
//在ZoY平面里建立一个圆环路径
//radius:半径，sumpoint：使用几个点
PointStrip.MakeRing=function(radius,sumpoint,posx)
{
    var arr_point=[];
    var radp=Math.PI*2/sumpoint;
    for(var i=0.0;i<sumpoint;i++)
    {
        var x=posx||0;
        var rad=radp*i;
        //var y=sswr(radius*Math.sin(rad),null,5);//在这里需要降低一些精确度？否则Babylon.js在计算顶点数据时可能和这里不一致？
        //var z=sswr(radius*Math.cos(rad),null,5);
        var y=radius*Math.sin(rad);
        var z=radius*Math.cos(rad);
        arr_point.push(new BABYLON.Vector3(x,y,z));
    }
    arr_point.push(arr_point[0].clone());//首尾相连，不能这样相连，否则变形时会多出一个顶点！！，看来这个多出的顶点无法去掉，只能在选取时额外处理它
    return arr_point;
}
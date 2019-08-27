//在这里存放和改进的地形网格相关的方法，需要MyGame对象
FrameGround=function()//非继承
{

}
FrameGround.prototype.init=function(param)
{
    param = param || {};
    this.segs_x=param.segs_x||100;//横向格子数量
    this.segs_z=param.segs_z||100;//横向格子数量
    this.size_per_x=param.size_per_x||1;//每个格子的尺寸
    this.size_per_z=param.size_per_z||1;
    this.name=param.name;
    //this.obj_plane={};//用五个动态纹理牌子显示，其所在位置的坐标
    //this.obj_ground={};
    //this.obj_wet={};//用来保存被淋湿的顶点索引
    //this.mesh_DropFrom=null;
    this.obj_mat={};//用来保存基础材质
    var segs_x=this.segs_x;
    var segs_z=this.segs_z;
    var size_per_x=this.size_per_x;
    var size_per_z=this.size_per_z;
    var mat_grass = new BABYLON.StandardMaterial("mat_grass", scene);//1
    mat_grass.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/grass.jpg", scene);
    mat_grass.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_grass.diffuseTexture.vScale = segs_z+1;
    mat_grass.backFaceCulling=false;
    //mat_grass.useLogarithmicDepth = true;
    mat_grass.freeze();
    this.obj_mat.mat_grass=mat_grass;
    var mat_tree = new BABYLON.StandardMaterial("mat_tree", scene);//1
    mat_tree.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/yulin.png", scene);
    mat_tree.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_tree.diffuseTexture.vScale = segs_z+1;
    mat_tree.backFaceCulling=false;
    //mat_tree.useLogarithmicDepth = true;
    mat_tree.freeze();
    this.obj_mat.mat_tree=mat_tree;
    var mat_shallowwater = new BABYLON.StandardMaterial("mat_shallowwater", scene);//1
    mat_shallowwater.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/lake.png", scene);
    mat_shallowwater.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_shallowwater.diffuseTexture.vScale = segs_z+1;
    mat_shallowwater.backFaceCulling=false;
    //mat_shallowwater.useLogarithmicDepth = true;
    mat_shallowwater.freeze();
    this.obj_mat.mat_shallowwater=mat_shallowwater;

    var arr_path=[];
    for(var i=0;i<=segs_x+1;i++)//对于每条竖线
    {
        var posx=(i-((segs_x+1)/2))*size_per_x;
        var path=[];
        for(var j=0;j<=segs_z+1;j++)
        {
            var posz=(j-((segs_z+1)/2))*size_per_z;//z从小到大
            path.push(new BABYLON.Vector3(posx,0,posz));
        }
        arr_path.push(path);
    }
    var ground_base=BABYLON.MeshBuilder.CreateRibbon(param.name
        ,{pathArray:arr_path,updatable:true,closePath:false,closeArray:false,sideOrientation:BABYLON.Mesh.DOUBLESIDE});
    ground_base.metadata={};
    ground_base.metadata.arr_path=arr_path;
    if(param.mat&&this.obj_mat[param.mat])//如果有设定的材质
    {
        ground_base.material=this.obj_mat[param.mat];
    }
    else
    {
        ground_base.material=MyGame.materials.mat_frame;
    }
    ground_base.renderingGroupId=2;
    ground_base.convertToFlatShadedMesh();//使用顶点颜色计算代替片元颜色计算
    //ground_base.freezeWorldMatrix();//冻结世界坐标系
    this.ground_base=ground_base;//也许FrameGround下还有更多的地形网格
    //直接在这里进行矩阵变换是效率更高的办法，但是为了流程的完整性重建网格
}
FrameGround.prototype.TransVertex=function(func_condition,matrix)
{
    var arr_path=this.ground_base.metadata.arr_path;
    var len=arr_path.length;
    for(var i=0;i<len;i++)
    {
        var path=arr_path[i];
        var len2=path.length;
        for(var j=0;j<len2;j++)
        {
            var vec3=path[j];
            if(func_condition(vec3))//如果这个顶点符合要求
            {
                arr_path[i][j]=BABYLON.Vector3.TransformCoordinates(vec3,matrix);//顶点变换
            }
        }
    }
    var mat_temp=this.ground_base.material;
    var metadata=this.ground_base.metadata;
    this.ground_base.dispose();
    var ground_base=BABYLON.MeshBuilder.CreateRibbon(this.ground_base.name
        ,{pathArray:arr_path,updatable:true,closePath:false,closeArray:false,sideOrientation:BABYLON.Mesh.DOUBLESIDE});//instance:this.ground_base,
    //使用实例方法重建网格似乎存在错误？原本的网格没有被清空，新的网格则出现索引混乱的情况。于是使用笨办法完全重建
    ground_base.renderingGroupId=2;
    ground_base.convertToFlatShadedMesh();
    ground_base.material=mat_temp;
    ground_base.metadata=metadata;
    this.ground_base=ground_base;
}


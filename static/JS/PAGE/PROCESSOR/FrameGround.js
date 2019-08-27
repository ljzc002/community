//在这里存放和改进的地形网格相关的方法
var FrameGround={};
FrameGround.OptimizeMesh=function(mesh)
{
    mesh.convertToFlatShadedMesh();//使用顶点颜色计算代替片元颜色计算
    mesh.freezeWorldMatrix();//冻结世界坐标系
    // mesh.material.needDepthPrePass = true;//启用深度预通过
    //mesh.convertToUnIndexedMesh();//使用三角形绘制代替索引绘制
}
FrameGround.segs_x=100;//横向格子数量
FrameGround.segs_z=100;//横向格子数量
FrameGround.size_per=1;//每个格子的尺寸
FrameGround.obj_plane={};//用五个动态纹理牌子显示，其所在位置的坐标
FrameGround.obj_ground={};
FrameGround.obj_wet={};//用来保存被淋湿的顶点索引
FrameGround.mesh_DropFrom=null;

FrameGround.init=function(fsUI)
{
    var obj_plane=FrameGround.obj_plane;
    var segs_x=FrameGround.segs_x;
    var segs_z=FrameGround.segs_z;
    var mat_grass = new BABYLON.StandardMaterial("mat_grass", scene);//1
    mat_grass.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/grass.jpg", scene);
    mat_grass.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_grass.diffuseTexture.vScale = segs_z+1;
    mat_grass.backFaceCulling=false;
    mat_grass.freeze();
    var mat_tree = new BABYLON.StandardMaterial("mat_tree", scene);//1
    mat_tree.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/yulin.png", scene);
    mat_tree.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_tree.diffuseTexture.vScale = segs_z+1;
    mat_tree.backFaceCulling=false;
    mat_tree.freeze();
    var mat_stone = new BABYLON.StandardMaterial("mat_stone", scene);//1
    mat_stone.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/stone.png", scene);
    mat_stone.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_stone.diffuseTexture.vScale = segs_z+1;
    mat_stone.backFaceCulling=false;
    mat_stone.freeze();
    var mat_shallowwater = new BABYLON.StandardMaterial("mat_shallowwater", scene);//1
    mat_shallowwater.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/lake.png", scene);
    mat_shallowwater.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_shallowwater.diffuseTexture.vScale = segs_z+1;
    mat_shallowwater.backFaceCulling=false;
    mat_shallowwater.freeze();
    var mat_deepwater = new BABYLON.StandardMaterial("mat_deepwater", scene);//1
    mat_deepwater.diffuseTexture = new BABYLON.Texture("../../ASSETS/IMAGE/LANDTYPE/sea.png", scene);
    mat_deepwater.diffuseTexture.uScale = segs_x+1;//纹理重复效果
    mat_deepwater.diffuseTexture.vScale = segs_z+1;
    mat_deepwater.backFaceCulling=false;
    mat_deepwater.freeze();
    var mat_blue=new BABYLON.StandardMaterial("mat_blue", scene);
    mat_blue.diffuseColor = new BABYLON.Color3(0, 0, 1);
    mat_blue.freeze();
    //mat_frame = new BABYLON.StandardMaterial("mat_frame", scene);
    //mat_frame.wireframe = true;

    var mesh_sphereup=new BABYLON.MeshBuilder.CreateSphere("mesh_sphereup",{diameter:0.5},scene);
    mesh_sphereup.material=mat_blue;
    mesh_sphereup.renderingGroupId=2;
    mesh_sphereup.direction=new BABYLON.Vector3(0,-1,2);
    mesh_sphereup.isPickable=false;
    mesh_sphereup.rayHelper = null;
    obj_plane.mesh_sphereup=mesh_sphereup;
    var mesh_sphereright=new BABYLON.MeshBuilder.CreateSphere("mesh_sphereright",{diameter:0.5},scene);
    mesh_sphereright.material=mat_blue;
    mesh_sphereright.renderingGroupId=2;
    mesh_sphereright.direction=new BABYLON.Vector3(2,-1,0);
    mesh_sphereright.isPickable=false;
    mesh_sphereright.rayHelper = null;
    obj_plane.mesh_sphereright=mesh_sphereright;
    var mesh_spheredown=new BABYLON.MeshBuilder.CreateSphere("mesh_spheredown",{diameter:0.5},scene);
    mesh_spheredown.material=mat_blue;
    mesh_spheredown.renderingGroupId=2;
    mesh_spheredown.direction=new BABYLON.Vector3(0,-1,-2);
    mesh_spheredown.isPickable=false;
    mesh_spheredown.rayHelper = null;
    obj_plane.mesh_spheredown=mesh_spheredown;
    var mesh_sphereleft=new BABYLON.MeshBuilder.CreateSphere("mesh_sphereleft",{diameter:0.5},scene);
    mesh_sphereleft.material=mat_blue;
    mesh_sphereleft.renderingGroupId=2;
    mesh_sphereleft.direction=new BABYLON.Vector3(-2,-1,0);
    mesh_sphereleft.isPickable=false;
    mesh_sphereleft.rayHelper = null;
    obj_plane.mesh_sphereleft=mesh_sphereleft;
    var mesh_spheremiddle=new BABYLON.MeshBuilder.CreateSphere("mesh_spheremiddle",{diameter:0.5},scene);
    mesh_spheremiddle.material=mat_blue;
    mesh_spheremiddle.renderingGroupId=2;
    mesh_spheremiddle.direction=new BABYLON.Vector3(0,-1,0);
    mesh_spheremiddle.isPickable=false;
    mesh_spheremiddle.rayHelper = null;
    obj_plane.mesh_spheremiddle=mesh_spheremiddle;

    for(var key in obj_plane)//为每个网格绑定一个gui lable
    {
        var label = new BABYLON.GUI.Rectangle(key);
        label.background = "black";
        label.height = "30px";
        label.alpha = 0.5;
        label.width = "240px";
        label.cornerRadius = 20;
        label.thickness = 1;
        label.linkOffsetY = 30;//位置偏移量？？
        fsUI.addControl(label);
        label.linkWithMesh(obj_plane[key]);
        var text1 = new BABYLON.GUI.TextBlock();
        text1.text = "";
        text1.color = "white";
        label.addControl(text1);
        label.isVisible=true;
        //label.layerMask=2;
        label.text=text1;
        obj_plane[key].lab=label;
    }
}
FrameGround.ImportObjGround=function(filepath,filename,func)
{
    BABYLON.SceneLoader.ImportMesh("", filepath, filename, scene
        , function (newMeshes, particleSystems, skeletons)
        {//载入完成的回调函数

            var len=newMeshes.length;
            for(var i=0;i<len;i++)
            {
                var mesh=newMeshes[i];
                mesh.renderingGroupId=2;
                mesh.sideOrientation=BABYLON.Mesh.DOUBLESIDE;
                FrameGround.obj_ground[mesh.name]=mesh;
                if(mesh.name=="ground_base")
                {//声明顶点位置是可变的！！
                    mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.PositionKind//其实就是“position”，除此之外还有“normal”等
                        ,true);
                }
                if(mesh.metadata&&mesh.metadata.arr_path)
                {//要把array重新变成Vector3！！！！
                    var arr_path=mesh.metadata.arr_path;
                    var len1=arr_path.length;
                    for(var j=0;j<len1;j++)
                    {
                        var path=arr_path[j];
                        var len2=path.length;
                        for(var k=0;k<len2;k++)
                        {
                            var vec=path[k];
                            var vec2=new BABYLON.Vector3(vec.x,vec.y,vec.z);
                            path[k]=vec2;
                        }
                    }
                }
            }
            func();
        }
    );
}
FrameGround.predicate=function(mesh)
{
    if (mesh.name.substr(0,6)=="ground"){
        return true;
    }
    else
    {
        return false;
    }
}
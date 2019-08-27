//各种单位排列方式
var QueueType={}
//不考虑特殊单位的方阵排列
QueueType.squareMatrix=function(piece,param,i,len)//单位对象、运动参数、队列中的编号
{
    var target=param.target;//目的地的水平（xz）坐标，指后视队列的右上角？
    var rad=param.rad;//顺时针旋转弧度
    var rowWidth=param.rowWidth;
    var xindex=i%rowWidth;
    var zindex=Math.floor(i/rowWidth);
    var disx=param.disx*xindex;//不旋转时相对与target的位置
    var disz=param.disz*zindex;

    piece.xzpos=new BABYLON.Vector3(target.x-disx*(Math.cos(rad))-disz*(Math.sin(rad))
        ,piece.solid.position.y,target.z+disx*(Math.sin(rad))-disz*(Math.cos(rad)));//最终目的地的坐标


}
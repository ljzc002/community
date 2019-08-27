/**
 * Created by lz on 2018/9/12.
 */
//在这里详细设定全屏等级的UI效果
//要有一个隐藏手牌按钮、两个左右旋转handpoint的按钮
function MakeFullUI()
{
    var advancedTexture = MyGame.fsUI;
    //手牌阶段的UI
    if(MyGame.WhoAmI!="world")
    {
        var UiPanel = new BABYLON.GUI.StackPanel();
        UiPanel.width = "220px";
        UiPanel.fontSize = "14px";
        UiPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        UiPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        UiPanel.color = "white";
        //UiPanel.background = "gray";
        advancedTexture.addControl(UiPanel);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("button1", "《");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.background = "green";
        if(MyGame.WhoAmI=="world")
        {
            button1.isVisible=false;
        }
        button1.onPointerDownObservable.add(function(state,info,coordinates) {//gui默认不能遮挡后面场景中的Mesh，触发了这个点击之后后面的Mesh还是会被触发
            if(MyGame.init_state==1&&flag_showcards==true)//如果完成了场景的虚拟化。并且显示着手牌
            {
                MyGame.player.handpoint.position.x-=8;
            }
        });
        UiPanel.addControl(button1);
        UiPanel.buttonup=button1;
        var button2 = BABYLON.GUI.Button.CreateSimpleButton("button2", "Q");
        button2.paddingTop = "10px";
        button2.width = "100px";
        button2.height = "50px";
        button2.background = "green";
        if(MyGame.WhoAmI=="world") {
            button2.isVisible = false;
        }
        button2.onPointerDownObservable.add(function(state,info,coordinates) {
            if(MyGame.init_state==1)//如果完成了场景的虚拟化
            {
                //ScrollUporDown(1,1.8,2);
                if(flag_showcards==false)
                {
                    CardMesh2.ShowCards(MyGame.player.cardinhand);
                    flag_showcards=true;
                }
                else
                {
                    CardMesh2.HideCards(MyGame.player.cardinhand);
                    flag_showcards=false;
                }
            }
        });
        UiPanel.addControl(button2);
        UiPanel.buttondown=button2;

        var UiPanel2 = new BABYLON.GUI.StackPanel();
        UiPanel2.width = "220px";
        UiPanel2.fontSize = "14px";
        UiPanel2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        UiPanel2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        UiPanel2.color = "white";
        advancedTexture.addControl(UiPanel2);
        var button3 = BABYLON.GUI.Button.CreateSimpleButton("button3", "》");
        button3.paddingTop = "10px";
        button3.width = "100px";
        button3.height = "50px";
        button3.background = "green";
        if(MyGame.WhoAmI=="world") {
            button3.isVisible = false;
        }
        button3.onPointerDownObservable.add(function(state,info,coordinates) {
            if(MyGame.init_state==1&&flag_showcards==true)//如果完成了场景的初始化
            {
                MyGame.player.handpoint.position.x+=8;
            }
        });
        UiPanel2.addControl(button3);
        UiPanel2.buttonc2c=button3;
        var button4 = BABYLON.GUI.Button.CreateSimpleButton("button4", "=");//手牌回到原位
        button4.paddingTop = "10px";
        button4.width = "100px";
        button4.height = "50px";
        button4.background = "green";
        if(MyGame.WhoAmI=="world") {
            button4.isVisible = false;
        }
        button4.onPointerDownObservable.add(function(state,info,coordinates) {
            if(MyGame.init_state==1&&flag_showcards==true)//如果完成了场景的初始化
            {
                MyGame.player.handpoint.position.x=0
            }
        });
        UiPanel2.addControl(button4);
        UiPanel2.buttonnextr=button4;
        MyGame.UiPanelr=UiPanel;
        MyGame.UiPanell=UiPanel2;
    }
    //显示在屏幕中央的手牌详细信息
    var UiPanelc = new BABYLON.GUI.Rectangle();
    UiPanelc.width = "600px";
    UiPanelc.height = "450px";
    UiPanelc.fontSize = "14px";
    UiPanelc.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    UiPanelc.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    UiPanelc.color = "white";
    UiPanelc.background = "gray";
    advancedTexture.addControl(UiPanelc);
    UiPanelc.isVisible=false;
    UiPanelc.onPointerEnterObservable.add(function(data, eventState){
        //canvas.style.cursor = "pointer";
    });
    UiPanelc.onPointerOutObservable.add(function(data, eventState){

    });
    MyGame.UiPanec=UiPanelc;

    var image = BABYLON.GUI.Button.CreateImageOnlyButton("mainpic","../../ASSETS/PIC/cardback/starrysky.jpg");
    image.width = "200px";
    image.height = "300px";
    //默认都是居中排列的，采用相对定位法定位
    image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    image.top="10px";
    image.left="10px";
    UiPanelc.addControl(image);
    UiPanelc.image=image;
    var div1 = new BABYLON.GUI.Rectangle();
    div1.width = "340px";
    div1.height = "120px";
    div1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    div1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    div1.top="10px";
    div1.left="220px";
    UiPanelc.addControl(div1);
    UiPanelc.div1=div1;
    //div1内的项目确定
    if(true)
    {//先放进去，稍后排列位置
        //TextBlock默认和外层控件一样尺寸！！？？
        var hp_text=new BABYLON.GUI.TextBlock("hp_text","HP:");
        hp_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hp_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        hp_text.width = "40px";
        hp_text.height = "30px";
        hp_text.top="10px";
        hp_text.left="10px";
        div1.addControl(hp_text);
        div1.hp_text=hp_text;
        var hp_value=new BABYLON.GUI.TextBlock("hp_value","/");
        hp_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hp_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        hp_value.width = "60px";
        hp_value.height = "30px";
        hp_value.top="10px";
        hp_value.left="50px";
        div1.addControl(hp_value);
        div1.hp_value=hp_value;
        var mp_text=new BABYLON.GUI.TextBlock("mp_text","MP:");
        mp_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        mp_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        mp_text.width = "40px";
        mp_text.height = "30px";
        mp_text.top="10px";
        mp_text.left="110px";
        div1.addControl(mp_text);
        div1.mp_text=mp_text;
        var mp_value=new BABYLON.GUI.TextBlock("mp_value","/");
        mp_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        mp_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        mp_value.width = "60px";
        mp_value.height = "30px";
        mp_value.top="10px";
        mp_value.left="150px";
        div1.addControl(mp_value);
        div1.mp_value=mp_value;
        var Shield_text=new BABYLON.GUI.TextBlock("Shield_text","SP:");
        Shield_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Shield_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Shield_text.width = "40px";
        Shield_text.height = "30px";
        Shield_text.top="10px";
        Shield_text.left="210px";
        div1.addControl(Shield_text);
        div1.sp_text=Shield_text;
        var Shield_value=new BABYLON.GUI.TextBlock("Shield_value","/");
        Shield_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Shield_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Shield_value.width = "60px";
        Shield_value.height = "30px";
        Shield_value.top="10px";
        Shield_value.left="250px";
        div1.addControl(Shield_value);
        div1.sp_value=Shield_value;
        //上三项一行
        var at_text=new BABYLON.GUI.TextBlock("at_text","AT:");
        at_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        at_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        at_text.width = "40px";
        at_text.height = "30px";
        at_text.top="40px";
        at_text.left="10px";
        div1.addControl(at_text);
        div1.at_text=at_text;
        var at_value=new BABYLON.GUI.TextBlock("at_value","");
        at_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        at_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        at_value.width = "60px";
        at_value.height = "30px";
        at_value.top="40px";
        at_value.left="50px";
        div1.addControl(at_value);
        div1.at_value=at_value;
        var Cost1_text=new BABYLON.GUI.TextBlock("Cost1_text","Cost1:");
        Cost1_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Cost1_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Cost1_text.width = "40px";
        Cost1_text.height = "30px";
        Cost1_text.top="40px";
        Cost1_text.left="110px";
        div1.addControl(Cost1_text);
        div1.Cost1_text=Cost1_text;
        var Cost1_value=new BABYLON.GUI.TextBlock("Cost1_value","");
        Cost1_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Cost1_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Cost1_value.width = "60px";
        Cost1_value.height = "30px";
        Cost1_value.top="40px";
        Cost1_value.left="150px";
        div1.addControl(Cost1_value);
        div1.Cost1_value=Cost1_value;
        var Cost2_text=new BABYLON.GUI.TextBlock("Cost2_text","Cost2:");
        Cost2_text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Cost2_text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Cost2_text.width = "40px";
        Cost2_text.height = "30px";
        Cost2_text.top="40px";
        Cost2_text.left="210px";
        div1.addControl(Cost2_text);
        div1.Cost2_text=Cost2_text;
        var Cost2_value=new BABYLON.GUI.TextBlock("Cost2_value","");
        Cost2_value.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        Cost2_value.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        Cost2_value.width = "60px";
        Cost2_value.height = "30px";
        Cost2_value.top="40px";
        Cost2_value.left="250px";
        div1.addControl(Cost2_value);
        div1.Cost2_value=Cost2_value;
    }


    var UiPanelc2 = new BABYLON.GUI.Rectangle();
    UiPanelc2.width = "340px";//预留空间，之后可能在右侧添加两个控制skill列表上下滚动的按钮
    UiPanelc2.height = "300px";
    UiPanelc2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    UiPanelc2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    UiPanelc2.top="140px";
    UiPanelc2.left="220px";
    UiPanelc.addControl(UiPanelc2);
    UiPanelc.div2=UiPanelc2;
    //div2内的项目动态
    //用来关闭gui窗口的按钮
    var buttonx = BABYLON.GUI.Button.CreateSimpleButton("buttonx", "X");
    buttonx.width = "30px";
    buttonx.height = "30px";
    buttonx.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    buttonx.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    buttonx.onPointerDownObservable.add(function(state,info,coordinates) {
        if (MyGame.UiPanec && MyGame.UiPanec.isVisible) {
            MyGame.UiPanec.isVisible = false;
        }
    });
    UiPanelc.addControl(buttonx);
    //显示技能详情的弹出框
    var div_comment=new BABYLON.GUI.Rectangle();
    div_comment.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    div_comment.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    div_comment.cornerRadius=2;
    div_comment.isVisible=false;
    div_comment.width = "300px";
    div_comment.height = "100px";
    div_comment.background = "gray";
    advancedTexture.addControl(div_comment);//如果不是底层元素，可能被其父元素限制范围显示不全
    UiPanelc.div_comment=div_comment;
    var text_comment=new BABYLON.GUI.TextBlock("text_comment","");
    text_comment.textWrapping=true;
    div_comment.addControl(text_comment);
    div_comment.text_comment=text_comment;

    //指示线上的文本框
    var div_line_picked=new BABYLON.GUI.Rectangle();
    div_line_picked.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    div_line_picked.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    div_line_picked.cornerRadius=2;
    div_line_picked.isVisible=false;
    div_line_picked.width = "300px";
    div_line_picked.height = "30px";
    div_line_picked.background = "gray";
    advancedTexture.addControl(div_line_picked);//如果不是底层元素，可能被其父元素限制范围显示不全
    UiPanelc.div_line_picked=div_line_picked;
    var text_line_picked=new BABYLON.GUI.TextBlock("text_line_picked","");
    //text_line_picked.textWrapping=true;
    div_line_picked.addControl(text_line_picked);
    div_line_picked.text_line_picked=text_line_picked;
}

function SetCardUI(card,panel)
{
    var UiPanelc=panel;
    //panel.image.image=new BABYLON.GUI.Image("mainpic_icon",card.mainpic);//这样替换不起作用
    //没有替换图片的方法？必须完全重建？
    panel.image.dispose();
    panel.image=null;
    var image = BABYLON.GUI.Button.CreateImageOnlyButton("mainpic",card.mainpic);
    image.width = "200px";
    image.height = "300px";
    //默认都是居中排列的，采用相对定位法定位
    image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    image.top="10px";
    image.left="10px";
    UiPanelc.addControl(image);
    UiPanelc.image=image;

    var div1=UiPanelc.div1;
    div1.hp_value.text=card.hp+"/"+card.maxhp;
    div1.mp_value.text=card.mp+"/"+card.maxmp;
    div1.sp_value.text=card.sp+"/"+card.maxsp;
    div1.at_value.text=card.at+"";
    div1.Cost1_value.text=card.Cost1+"";
    div1.Cost2_value.text=card.Cost2+"";

    var div2=UiPanelc.div2;
    var arr_indiv2=div2.children;
    //var len=arr_indiv2.length;
    for(var i=0;i<arr_indiv2.length;i++)
    {
        var div_temp=arr_indiv2[i];
        if(div_temp)
        {
            div_temp.dispose();//这个方法里包含了对div2.children元素的删除，此时length会发生变化！！！！
            //arr_indiv2[i]=null;//但如果强制设为null，又似乎不会删除元素
            i--;
        }

    }
    div2.children=[];
    var arr_skills=card.arr_skillindex;
    var len=arr_skills.length;
    for(var i=0;i<len;i++)
    {
        var index_skill=arr_skills[i];
        let skill=list_skilldata[index_skill];//这里不需要使用let？？
        var button = BABYLON.GUI.Button.CreateSimpleButton("skill_"+index_skill, skill.name);
        button.width = "100px";
        button.height = "30px";
        button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        let num1=10+Math.floor(i/3)*30;
        button.top=num1+"px";//三列
        let num2=10*(i%3+1)+100*(i%3);
        button.left=num2+"px";
        //移入显示说明文字
        button.onPointerEnterObservable.add(function(data, eventState){
            UiPanelc.div_comment.isVisible=true;
            UiPanelc.div_comment.text_comment.text=skill.comment;
            UiPanelc.div_comment.top=-85+num1+30+52;//不同的定位方式，定位点也不一样！！！！
            UiPanelc.div_comment.left=-80+num2+152;//当使用居中定位时，定位点会变成元素中心而不是左上角！！！！
        });
        button.onPointerOutObservable.add(function(data, eventState){
            UiPanelc.div_comment.isVisible=false;
        });
        button.onPointerDownObservable.add(function(state,info,coordinates) {
            if(skill.skilltype2!="passiveskill")
            {
                current_unit=card;
                UiPanelc.div_comment.isVisible=false;
                if (MyGame.UiPanec && MyGame.UiPanec.isVisible) {
                    MyGame.UiPanec.isVisible = false;
                }
                skill.do(card);//点击按钮触发card的对应skill，另一种方式是在control中通过拖动触发default skill 的do2
            }

        });
        div2.addControl(button);
    }
}
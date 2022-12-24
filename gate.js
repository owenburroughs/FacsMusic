class Gate{
    constructor(XChannel, YChannel){
        this.active=false;
        this.XChannel = XChannel;
        this.YChannel = YChannel;
        this.one={};
        this.two={};
        this.three={};
        this.four={};
       this.one.X = 10
       this.one.Y = 10
       this.two.X = 60
       this.two.Y = 10
       this.three.X = 60
       this.three.Y = 60
       this.four.X = 10
       this.four.Y = 60

       this.one.dragging = false;
       this.two.dragging = false;
       this.three.dragging = false;
       this.four.dragging = false;
    }
    show(){
        if(this.one.dragging==true){
            this.one.X = mouseX;
            this.one.Y = mouseY;
        }
        if(this.two.dragging==true){
            this.two.X = mouseX;
            this.two.Y = mouseY;
        }
        if(this.three.dragging==true){
            this.three.X = mouseX;
            this.three.Y = mouseY;
        }
        if(this.four.dragging==true){
            this.four.X = mouseX;
            this.four.Y = mouseY;
        }
        stroke('black')

        line(this.one.X,this.one.Y, this.two.X, this.two.Y)
        line(this.two.X,this.two.Y, this.three.X, this.three.Y)
        line(this.three.X,this.three.Y, this.four.X, this.four.Y)
        line(this.four.X,this.four.Y, this.one.X, this.one.Y)

        ellipse(this.one.X, this.one.Y, 10, 10)
        ellipse(this.two.X, this.two.Y, 10, 10)
        ellipse(this.three.X, this.three.Y, 10, 10)
        ellipse(this.four.X, this.four.Y, 10, 10)
    }
    pressed(){
        if(ContainsMouse(this.one.X, this.one.Y, 10)){
            this.one.dragging = true;
        }
        if(ContainsMouse(this.two.X, this.two.Y, 10)){
            this.two.dragging = true;
        }
        if(ContainsMouse(this.three.X, this.three.Y, 10)){
            this.three.dragging = true;
        }
        if(ContainsMouse(this.four.X, this.four.Y, 10)){
            this.four.dragging = true;
        }
    }
    released(){
        this.one.dragging = false;
        this.two.dragging = false;
        this.three.dragging = false;
        this.four.dragging = false;
    }
}

function ContainsMouse(x,y,rad){
    if(((mouseX-x)**2 + (mouseY - y)**2)<rad**2){
        return true;
    }else{
        return false;
    }
}

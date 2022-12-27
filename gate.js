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

       this.insturmentIndex=0
       this.midiChannel=forwardChannel

    ////create viewable parameter boxes
        //create element
        this.gateContainer = createDiv()
        this.gateContainer.addClass("gates")
        this.gateContainer.parent(document.getElementById("gatesContainer"))
    
        //name display
        this.nameDisplay = createP(`${channelData[this.XChannel].name} vs. ${channelData[this.YChannel].name}`)
        this.nameDisplay.parent(this.gateContainer)
        this.nameDisplay.addClass("gateContent")

        //insturment selection container
        this.insturmentSelectContainer = createDiv()
        this.insturmentSelectContainer.parent(this.gateContainer)
        this.insturmentSelectContainer.addClass("gateContent")

        //assign midi for first time
        this.AssignMidiOut()

        //hide element at first
        this.gateContainer.hide()

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

    //show and hide gate parameters for editing
    ShowControls(){
        this.gateContainer.show()
    }
    HideControls(){
        this.gateContainer.hide()
    }

    AssignMidiOut(){
        //remove selection boxes if they exist to clear them
        if(this.insturmentSelect){
            this.insturmentSelect.remove()
            this.channelSelect.remove()
        }

        //if insturment and channel selections don't exist, create them
            this.insturmentSelect = createSelect()
            this.insturmentSelect.parent(this.insturmentSelectContainer)
            this.insturmentSelect.addClass("gateContent")
            this.insturmentSelect.changed(this.UpdateMidiOut.bind(this))

            this.channelSelect = createSelect()
            this.channelSelect.parent(this.insturmentSelectContainer)
            this.channelSelect.addClass("gateContent")
            this.channelSelect.changed(this.UpdateMidiOut.bind(this))

        //create selection for all midi insturments
        if (midiOutputs.length == 0){
            //no midi connected, show message
            this.insturmentSelect.option("No MIDI Insturment")
        } else{
            //add midi insturments to select
            for(let output of midiOutputs){
                this.insturmentSelect.option(output.name)
            }
            //add 16 target channels
            for(let i=1; i<=16; i++){
                this.channelSelect.option(i)
            }

            //assign correct settings to each channel
            this.insturmentSelect.selected(this.insturmentIndex)
            this.channelSelect.selected(this.midiChannel)
        }
    }

    UpdateMidiOut(){
        this.insturmentIndex = this.insturmentSelect.elt.selectedIndex
        this.midiChannel = this.channelSelect.elt.selectedIndex + 1
    }
}

function ContainsMouse(x,y,rad){
    if(((mouseX-x)**2 + (mouseY - y)**2)<rad**2){
        return true;
    }else{
        return false;
    }
}
 

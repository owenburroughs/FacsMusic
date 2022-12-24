let facs, XMult, YMult, XSlider, YSlider, XInput, YInput, Xmin, Xmax, Ymin, Ymax, 
XSelect, XMode, YSelect, YMode, gatedCheckbox;

let width = 400;
let height = 400;
let frameRateVar = 10;
let XChannel=0;
let YChannel=0;
let channelData=[]
let tempFacs =[]
let newFacs =[]
let gates = []
let gateIndex =0;

//p5 stuff
function setup() {
    createCanvas(600, 600);
    frameRate(frameRateVar);
    textSize(15);
    textAlign(CENTER, CENTER);

    document.getElementById('inputfile')
    .addEventListener('change', function() {
        var fr=new FileReader();
        fr.onload=function(){
            facs = JSON.parse(fr.result);
            tempFacs = facs.events.map((x) => x);
            
            XMode = createSelect();
            XMode.position(150,455)
            XMode.style('width', "100px")
            XMode.option('Linear')
            XMode.option('Logarithmic')
            XMode.changed(ModeChange)

            YMode = createSelect();
            YMode.position(410,255)
            YMode.style('width', "100px")
            YMode.option('Linear')
            YMode.option('Logarithmic')
            YMode.changed(ModeChange)
            

            gatedCheckbox = createCheckbox('Gate Active', false)
            gatedCheckbox.position(500,30)
            gatedCheckbox.changed(GateChange)
            InitializeChannels()
            //loop()
        }
        fr.readAsText(this.files[0]);
    })
    
    XSlider = createSlider(0, 1, 1, 0);
    XSlider.position(10, 550);
    XSlider.style('width', '300px')
    XInput = createInput('.002')
    XInput.position(320, 550)
    XInput.style('width', '80px')
    
    YSlider = createSlider(0, 1, 1, 0);
    YSlider.position(10, 600);
    YSlider.style('width', '300px')
    YInput = createInput('.004')
    YInput.position(320, 600)
    YInput.style('width', '80px')

    Xmin = createInput('0')
    Xmin.position(10, 430)
    Xmin.style('width', '80px')
    Xmin.input(MappingChange)

    Xmax = createInput('1')
    Xmax.position(320, 430)
    Xmax.style('width', '80px')
    Xmax.input(MappingChange)

    Ymin = createInput('0')
    Ymin.position(410, 410)
    Ymin.style('width', '80px')
    Ymin.input(MappingChange)

    Ymax = createInput('1')
    Ymax.position(410, 30)
    Ymax.style('width', '80px')
    Ymax.input(MappingChange)

    scaleXButton = createButton('Scale X')
    scaleXButton.position(150, 480)
    scaleXButton.mousePressed(ScaleX)
    scaleXButton.size(100, 20)

    scaleYButton = createButton('Scale Y')
    scaleYButton.position (410, 280)
    scaleYButton.mousePressed(ScaleY)
    scaleYButton.size(100, 20)  

    let controlChangeButton = createButton("Reset FACS Plot")
    controlChangeButton.mousePressed(ControlChange)
  }

//P5.js Draw Loop
function draw() {
    //draw the basic scene
    background(220);
    rect(0,0,width,height)
    text('X Axis',30, 500)
    text('Y Axis', 30, 550)

    //check if .fcs file has been loaded. If not, don't run draw loop
    if(typeof facs != 'object'){
        noLoop()
        return;
    }

    //check for active gate, in which case show it
    if(gates[gateIndex].active == true){
        gates[gateIndex].show()
    }
    
///NOTE TO FUTURE SELF: This save code might introduce latency and could be moved elsewhere
    //save current input and slider values
    channelData[XChannel].inputValue = float(XInput.value());
    channelData[XChannel].sliderValue = float(XSlider.value());
    channelData[YChannel].inputValue = float(YInput.value());
    channelData[YChannel].sliderValue = float(YSlider.value());

    //define multipliers
    XMult = XSlider.value() * float(XInput.value())
    YMult = YSlider.value() * float(YInput.value())

     //if facs events exist, draw the events
    if(tempFacs.length>0){
        let channelOne
        let channelTwo
        let randomIndex = Math.floor(Math.random() * tempFacs.length)
        newFacs.push(tempFacs[randomIndex])
        tempFacs.splice(randomIndex,1)

        //scale and set parameters for each channel
        for (let channel of channelData){
            let minMap = channel.minMap
            let maxMap = channel.maxMap
            let item, min, max

            if(channel.mode == "Linear"){
                item = tempFacs[randomIndex][channel.index]
                min = channel.min
                max = channel.max
            }else{
                if(tempFacs[randomIndex][channel.index]<0){
                    item = 0
                }else{
                    item = Math.log10(tempFacs[randomIndex][channel.index])
                }
                if(channel.min<0){
                    min=0
                }else{
                    min = Math.log10(channel.min)
                }
                max = Math.log10(channel.max)
            }
            channel.Broadcast(Math.round(map(item, min, max, minMap,  maxMap)*channel.sliderValue))
        }

        for(let i = 0; i <newFacs.length; i++){
            if(XMode.value() =="Linear"){
                channelOne =  newFacs[i][XChannel]
            }else{
                channelOne =  Math.log10(newFacs[i][XChannel])
            }
            if(YMode.value() =="Linear"){
                channelTwo =  newFacs[i][YChannel]
            }else{
                channelTwo =  Math.log10(newFacs[i][YChannel])
            }
        let displayX = Math.round(channelOne * XMult)
        let displayY = 400- Math.round(channelTwo * YMult)
            if(WithinGate(displayX,displayY,gates[gateIndex])){
                stroke('red')
            }else{
                stroke('black')
            }

        if(displayX<width && displayY<height){
            point(displayX,displayY)
        }
        }
    }
}

function mousePressed() {
    if(gates.length>0 && gates[gateIndex].active == true){
         gates[gateIndex].pressed();
    }
  }

function mouseReleased(){
    if(gates.length>0 && gates[gateIndex].active === true){
        gates[gateIndex].released();
    }
}

function WithinGate(x,y,gate){
    if(typeof gate == 'object' && gate.active == true){
        if(
            y > Slope(gate.one.X,gate.one.Y,gate.two.X,gate.two.Y) * (x - gate.one.X) + gate.one.Y &&
            y < Slope(gate.three.X,gate.three.Y,gate.four.X,gate.four.Y) * (x - gate.three.X) + gate.three.Y &&
            x > (y - gate.one.Y)/Slope(gate.one.X,gate.one.Y,gate.four.X,gate.four.Y) + gate.one.X &&
            x < (y - gate.two.Y)/Slope(gate.two.X,gate.two.Y,gate.three.X,gate.three.Y) + gate.two.X
        ){
            return true;
        }else{
            return false;
        }
    }
    return false;

}

function Slope(x1,y1,x2,y2){
    return ((y2-y1)/(x2-x1))
}
//handle a change in the gate status radio button
function GateChange(){
    //see if deactivating the gate
    if (gatedCheckbox.checked() ==false){
        gates[gateIndex].active = false;
        return;
    }
    //check if a gate with the two parameters exists
    for(let i=0; i<gates.length; i++){
        if(gates[i].XChannel == XChannel && gates[i].YChannel == YChannel){
            gates[i].active = true;
            return;
        }
    }
    //no gate exists, create one
    gates.push(new Gate(XChannel,YChannel))
}

//handle change of channels
function ChannelChange(callback){
    //change parameters
    XChannel = GetChannelIndex(XSelect.value())
    YChannel = GetChannelIndex(YSelect.value())

     //assign new modes
    XMode.selected(channelData[XChannel].mode);
    YMode.selected(channelData[YChannel].mode);

    //change scaling values
    XInput.value(channelData[XChannel].inputValue)
    YInput.value(channelData[YChannel].inputValue)
    
    //change slider values
    XSlider.value(channelData[XChannel].sliderValue)
    YSlider.value(channelData[YChannel].sliderValue)

    //set minima and maxima for axes
    Xmin.value(channelData[XChannel].minMap)
    Xmax.value(channelData[XChannel].maxMap)
    Ymin.value(channelData[YChannel].minMap)
    Ymax.value(channelData[YChannel].maxMap)

    //see if configuration has been opened before
    for(let i=0; i<gates.length; i++){
        if(gates[i].XChannel == XChannel && gates[i].YChannel == YChannel){
            gateIndex = i;
            if(gates[i].active == true){
                gatedCheckbox.checked(true)
                return;
            }else{
                gatedCheckbox.checked(false)
                return;
            }
        }
    }
    //gate doesn't exist, deactivate and create new
    gatedCheckbox.checked(false);
    gates.push(new Gate(XChannel,YChannel))
    gateIndex = gates.length - 1
}

function ModeChange(){
    channelData[XChannel].mode = XMode.value();
    channelData[YChannel].mode = YMode.value();
    XMode.selected(channelData[XChannel].mode);
    YMode.selected(channelData[YChannel].mode);
}

//code to save and display changes in the mapping values
function MappingChange(){
    //save values
    channelData[XChannel].minMap = Xmin.value()
    channelData[XChannel].maxMap = Xmax.value()
    channelData[YChannel].minMap = Ymin.value()
    channelData[YChannel].maxMap = Ymax.value()

    //display values (relevant if X and Y channels are same)
    Xmin.value(channelData[XChannel].minMap)
    Xmax.value(channelData[XChannel].maxMap)
    Ymin.value(channelData[YChannel].minMap)
    Ymax.value(channelData[YChannel].maxMap)
}

function GetChannelIndex(value){
    return channelData.findIndex(x => x.name == value)
}

function MaxAtIndex(array, index){
    let max = array[0]
    for(let i = 0; i <array.length; i++){
        if (array[i][index] > max[index]){
            max = array[i]
        }
    }
    return max[index]
}

function MinAtIndex(array, index){
    let min = array[0]
    for(let i = 0; i <array.length; i++){
        if (array[i][index] < min[index]){
            min = array[i]
        }
    }
    return min[index]
}

function ScaleChannel(channel){
    let scalar;
    scalar = width/ MaxAtIndex(facs.events, channel);
    if(channelData.length == facs.channels.length){
        if (channelData[channel].mode == 'Logarithmic'){
            scalar = width/ Math.log10(MaxAtIndex(facs.events, channel))
        }
    }
    return scalar
}

function ScaleX(){
    XInput.value(ScaleChannel(XChannel))
}

function ScaleY(){
    YInput.value(ScaleChannel(YChannel))
}

function InitializeChannels(){
    //create an object to store channel data
    for(let i=0; i < facs.channels.length; i++){
        channelData.push(new Channel(i))
    }

    //Create and populate channel selection boxes
    XSelect = createSelect();
    XSelect.position(150,430)
    XSelect.style('width', "100px")
    for(let i = 0; i < channelData.length; i++){
        XSelect.option(channelData[i].name);
    }
    XSelect.changed(ChannelChange)
    YSelect = createSelect();
    YSelect.position(410, 230)
    YSelect.style('width', "100px")
    for(let i = 0; i < channelData.length; i++){
        YSelect.option(channelData[i].name);
    }
    YSelect.changed(ChannelChange)

    //now that the channels object is populated, assign the correct labels
    ChannelChange();
}
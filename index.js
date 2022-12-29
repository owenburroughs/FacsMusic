let facs, XMult, YMult, XSlider, YSlider, XInput, YInput, Xmin, Xmax, Ymin, Ymax, 
XSelect, XMode, YSelect, YMode, gatedCheckbox, sampledX, sampledY, sampleFromGate

let width = 400;
let height = 400;
let XChannel=0;
let YChannel=0;
let channelData=[]
let tempFacs =[]
let newFacs =[]
let gates = []
let gateIndex =0;
let visableEvents=1500
let sampleFromGateIndex = {
    "default":true,
    index:0
}
let currentEventIndex = 0
let sampleMode = "Random"
//the maximum number of times that it will look for a point within a gate before escaping
let sampleLookupTolerance = 1000

let winHeight= window.height
let winWidth= window.width

//p5 stuff
function setup() {
    createCanvas(600, 600);
    textSize(15);
    strokeWeight(2)
    textAlign(CENTER, CENTER);

      // Enable WEBMIDI.js and trigger the OnMidiEnabled() function when ready
        WebMidi
        .enable()
        .then(OnMidiEnabled)
        .catch(err => console.error(err));

    document.getElementById('inputfile')
    .addEventListener('change', function() {
        var fr=new FileReader();
        fr.onload=function(){
            facs = ParseFCS(fr.result);
            tempFacs = facs.events.map((x) => x);
            
            XMode = createSelect();
            XMode.position(150,430)
            XMode.style('width', "100px")
            XMode.option('Linear')
            XMode.option('Logarithmic')
            XMode.changed(ModeChange)

            YMode = createSelect();
            YMode.position(410,230)
            YMode.style('width', "100px")
            YMode.option('Linear')
            YMode.option('Logarithmic')
            YMode.changed(ModeChange)
            

            gatedCheckbox = createCheckbox('Gate Active', false)
            gatedCheckbox.position(500,30)
            gatedCheckbox.changed(GateChange)
            InitializeChannels()
            loop()
        }
        fr.readAsArrayBuffer(this.files[0]);
    })
    
    XSlider = createSlider(0, 1, 1, 0);
    XSlider.position(10, 525);
    XSlider.style('width', '300px')

    XInput = createInput('.002')
    XInput.position(320, 525)
    XInput.style('width', '80px')
    
    YSlider = createSlider(0, 1, 1, 0);
    YSlider.position(10, 575);
    YSlider.style('width', '300px')

    YInput = createInput('.004')
    YInput.position(320, 575)
    YInput.style('width', '80px')

    Xmin = createInput('0')
    Xmin.position(10, 410)
    Xmin.style('width', '80px')
    Xmin.input(MappingChange)

    Xmax = createInput('1')
    Xmax.position(320, 410)
    Xmax.style('width', '80px')
    Xmax.input(MappingChange)

    Ymin = createInput('0')
    Ymin.position(410, 390)
    Ymin.style('width', '80px')
    Ymin.input(MappingChange)

    Ymax = createInput('1')
    Ymax.position(410, 10)
    Ymax.style('width', '80px')
    Ymax.input(MappingChange)

    scaleXButton = createButton('Scale X')
    scaleXButton.position(150, 450)
    scaleXButton.mousePressed(ScaleX)
    scaleXButton.size(100, 20)

    scaleYButton = createButton('Scale Y')
    scaleYButton.position (410, 250)
    scaleYButton.mousePressed(ScaleY)
    scaleYButton.size(100, 20)

    sampleFromGate = createSelect()
    //sampleFromGate.position(275,10)
    sampleFromGate.changed(UpdateSampleFromGate)
    sampleFromGate.parent(document.getElementById('settingsContainer'))
    UpdateSampleFromGate()

    let midiChangeButton = createButton("Refresh MIDI Connections")
    midiChangeButton.parent(document.getElementById("settingsContainer"))
    midiChangeButton.mousePressed(MidiRefresh)
  }

//P5.js Draw Loop
function draw() {
    //draw the basic scene
    background(220);
    rect(0,0,width,height)
    noStroke()
    text('X Axis',30, 500)
    text('Y Axis', 30, 550)
    stroke(0)

    //check if .fcs file has been loaded. If not, don't run draw loop
    if(typeof facs != 'object'){
        noLoop()
        return;
    }

    //check for active gate, in which case show it
    //gate index is set correctly on channel change in the channel change function
    if(gates[gateIndex].active == true){
        gates[gateIndex].show()
    }

    //display any active gates
    for(gate of gates){
        if(gate.active){
            gate.ShowControls()
        }else{
            gate.HideControls()
        }
    }
    
///NOTE TO FUTURE SELF: This save code might introduce latency and could be moved elsewhere
    //save current input and slider values
    channelData[XChannel].inputValue = float(XInput.value());
    channelData[XChannel].sliderValue = float(XSlider.value());
    channelData[YChannel].inputValue = float(YInput.value());
    channelData[YChannel].sliderValue = float(YSlider.value());

    //iterate through a number of points and draw them on screen
    for(let i =0; i<visableEvents; i++){
        displayXY = ReturnScaledXY(facs.events[i][XChannel], facs.events[i][YChannel], gates[gateIndex])
       
        if(WithinGate(displayXY[0],displayXY[1], gates[gateIndex])){
            stroke('red')
        }else{
            stroke('black')
        }

        if(displayXY[0]<width && displayXY[1]<height){
            point(displayXY[0],displayXY[1])
        }
        stroke('black')
    }

    if(sampledX>0 && sampledY>0){
        fill('red')
        noStroke()
        ellipse(sampledX, sampledY, 8, 8)
        stroke(0)
        fill("white")
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
        //update the selector for sample-from gate
        UpdateSampleFromGate()
        return;
    }
    //check if a gate with the two parameters exists
    for(let i=0; i<gates.length; i++){
        if(gates[i].XChannel == XChannel && gates[i].YChannel == YChannel){
            gates[i].active = true;
            //update the selector for sample-from gate
            UpdateSampleFromGate()
            return;
        }
    }
    //no gate exists, create one
    gates.push(new Gate(XChannel,YChannel))
}

//handle change of channels
function ChannelChange(){
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
    XSelect.position(150,410)
    XSelect.style('width', "100px")
    for(let i = 0; i < channelData.length; i++){
        XSelect.option(channelData[i].name);
    }
    XSelect.changed(ChannelChange)
    YSelect = createSelect();
    YSelect.position(410, 210)
    YSelect.style('width', "100px")
    for(let i = 0; i < channelData.length; i++){
        YSelect.option(channelData[i].name);
    }
    YSelect.changed(ChannelChange)

    //now that the channels object is populated, assign the correct labels
    ChannelChange();
}

function PushNote(){
    console.log(sampleFromGateIndex)
    //Determine if point selection is random or sequential
    if(sampleMode=="Random"){
        //select points from the main array until a point is selected within the sample-from gate
        currentEventIndex = Math.floor(Math.random() * tempFacs.length)

        //check if the selection gate is default (in which case all points are valid so gate logic is skipped)
        if(!sampleFromGateIndex.default){
            let lookupBreakoutIndex = 0
            currentEventIndex = Math.floor(Math.random() * tempFacs.length)
            let lookupXY = ReturnScaledXY(tempFacs[currentEventIndex][XChannel],tempFacs[currentEventIndex][YChannel], gates[sampleFromGateIndex.index])
            while(!WithinGate(lookupXY[0],lookupXY[1], gates[sampleFromGateIndex.index])){
                //selected point isn't within the selection gate, try again
                console.log(currentEventIndex)
                currentEventIndex = Math.floor(Math.random() * tempFacs.length)
                lookupXY = ReturnScaledXY(tempFacs[currentEventIndex][XChannel],tempFacs[currentEventIndex][YChannel], gates[sampleFromGateIndex.index])
                lookupBreakoutIndex+=1
                if(lookupBreakoutIndex>sampleLookupTolerance){
                    alert("No Points Within Selected Gate")
                    break;
                }
            }
        
        }  
        newFacs.push(tempFacs[currentEventIndex])
        tempFacs.splice(currentEventIndex,1)
    }

    outputInsturment = defaultInsturmentSelect.elt.selectedIndex
    forwardChannel = defaultChannelSelect.elt.selectedIndex + 1

    //scale and set parameters for each channel
    for (let channel of channelData){
        let minMap = parseInt(channel.minMap)
        let maxMap = parseInt(channel.maxMap)
        let item, min, max

        if(channel.mode == "Linear"){
            item = newFacs[newFacs.length - 1][channel.index]
            min = channel.min
            max = channel.max
        }else{
            if(tempFacs[tempFacs.length - 1][channel.index]<=0){
                item = 0
            }else{
                item = Math.log10(newFacs[newFacs.length - 1][channel.index])
            }

            if(channel.min<=0){
                min=0
            }else{
                min = Math.log10(channel.min)
            }
            max = Math.log10(channel.max)
        }
        channel.Broadcast(Math.round(map(item, min, max, minMap,  maxMap)*channel.sliderValue))
    }

    //check if the point falls within a gate, in which case play over that gate's output
    for(let gate of gates){
        if(gate.active){
            let scaledXYofGateChannels = ReturnScaledXY(newFacs[newFacs.length-1][gate.XChannel], newFacs[newFacs.length-1][gate.YChannel], gate)

            if(WithinGate(scaledXYofGateChannels[0], scaledXYofGateChannels[1], gate)){
                if(gate.insturmentIndex != outputInsturment || gate.midiChannel != forwardChannel){
                    outputInsturment = gate.insturmentIndex
                    forwardChannel = gate.midiChannel
                }
            }
        }
    }

    //set the variables sampledX and sampledY to the XY of the sampled point in the current viewpoint so an elipse can be drawn in the draw loop
    let displayXY = ReturnScaledXY(newFacs[newFacs.length-1][XChannel],newFacs[newFacs.length-1][YChannel],gates[gateIndex])
    sampledX = displayXY[0]
    sampledY = displayXY[1]
}

//given a gate (with X and Y channels), return an array holding the XY of the point scaled to the plot (400x400)
function ReturnScaledXY(x, y, gate){
    if(channelData[gate.XChannel].mode =="Linear"){
        channelOne =  x
    }else{
        channelOne =  Math.log10(x)
    }
    if(channelData[gate.YChannel].mode =="Linear"){
        channelTwo =  y
    }else{
        channelTwo =  Math.log10(y)
    }

    XMult = channelData[gate.XChannel].sliderValue * channelData[gate.XChannel].inputValue
    YMult = channelData[gate.YChannel].sliderValue * channelData[gate.YChannel].inputValue

    let returnX = Math.round(channelOne * XMult)
    let returnY = 400- Math.round(channelTwo * YMult)
    return([returnX, returnY])
}

//NOTE: This code is a mess. I need to change the gate functionality
function UpdateSampleFromGate(){
    if(sampleFromGate.elt.selectedIndex > 0){
        //selected index isn't default
        sampleFromGateIndex.index = sampleFromGate.selected().split(',')[0]
        sampleFromGateIndex.default = false
    }else{
        sampleFromGateIndex.default = true
    }
    console.log(sampleFromGate)

    //remove select options
    sampleFromGate.remove()
    sampleFromGate = createSelect()
    //sampleFromGate.position(275,10)
    sampleFromGate.parent(document.getElementById("settingsContainer"))
    sampleFromGate.changed(UpdateSampleFromGate)
    sampleFromGate.option("Sample All Points")

    //reset select options
    for(let gate of gates){
        if(gate.active){
            console.log(gate)
            sampleFromGate.option(`${gates.indexOf(gate)}, ${facs.channels[gate.XChannel]} vs. ${facs.channels[gate.YChannel]}`)
        }
    }

    if(sampleFromGateIndex.default){
        sampleFromGate.elt.selectedIndex = 0
    }else{
        sampleFromGate.selected(`${gates.indexOf(gates[sampleFromGateIndex.index])}, ${facs.channels[gate.XChannel]} vs. ${facs.channels[gate.YChannel]}`)
    }
}
let midiInputs = []
let midiOutputs = []
let defaultGateContainer, defaultNameDisplay, defaultChannelSelect, defaultInsturmentSelect, 
defaultInsturmentSelectContainer,inputInsturment, outputInsturment, listenChannel, forwardChannel, defaultInputSelect,
defaultChannelInputSelect

  // Function triggered when WEBMIDI.js is ready
  function OnMidiEnabled() { 
      //create default output insturment selection elements
        //create element container
        defaultGateContainer = createDiv()
        defaultGateContainer.addClass("gates")
        defaultGateContainer.parent(document.getElementById("gatesContainer"))
    
        //name display
        defaultNameDisplay = createP("Default MIDI Channel")
        defaultNameDisplay.parent(defaultGateContainer)
        defaultNameDisplay.addClass("gateContent")

        //insturment selection container
        defaultInsturmentSelectContainer = createDiv()
        defaultInsturmentSelectContainer.parent(defaultGateContainer)
        defaultInsturmentSelectContainer.addClass("gateContent")
        midiInputs = Array.from(WebMidi.inputs)
        midiOutputs = Array.from(WebMidi.outputs)

        //to-do: make these selectable by user
        outputInsturment=0
        inputInsturment=0
        listenChannel = 1
        forwardChannel = 2

        //set up midi input selection
        MidiRefresh()
  }

//function to refresh midi connections
function MidiRefresh(){
    midiInputs = Array.from(WebMidi.inputs)
    midiOutputs = Array.from(WebMidi.outputs)

    AssignDefaultMidiIn();
    AssignDefaultMidiOut();

    for(gate of gates){
        gate.AssignMidiOut()
    }

    for(channel of channelData){
        channel.AssignMidiOut()
    }
}

//handle MIDI events
function HandleMidiEvent(event){

    if(event.message.type == "noteon"){
        PushNote()
    }

    let newStatusByte = event.data[0] - listenChannel + forwardChannel
    let newMessage = new Message([newStatusByte, event.data[1], event.data[2]])
    midiOutputs[outputInsturment].channels[forwardChannel].send(newMessage);
}


//assign the default MIDI output
function AssignDefaultMidiOut(){
    //remove selection boxes if they exist to clear them
    if(defaultInsturmentSelect){
        defaultInsturmentSelect.remove()
        defaultChannelSelect.remove()
    }
    console.log(forwardChannel)
    //if insturment and channel selections don't exist, create them
        defaultInsturmentSelect = createSelect()
        defaultInsturmentSelect.parent(defaultInsturmentSelectContainer)
        defaultInsturmentSelect.addClass("gateContent")
        defaultInsturmentSelect.changed(UpdateDefaultMidiOut)
        
        defaultChannelSelect = createSelect()
        defaultChannelSelect.parent(defaultInsturmentSelectContainer)
        defaultChannelSelect.addClass("gateContent")
        defaultChannelSelect.changed(UpdateDefaultMidiOut)
        
    //create selection for all midi insturments
    if (midiOutputs.length == 0){
        //no midi connected, show message
        defaultInsturmentSelect.option("No MIDI Insturment")
    } else{
        //add midi insturments to select
        for(let output of midiOutputs){
            defaultInsturmentSelect.option(output.name)
        }
        //add 16 target channels
        for(let i=1; i<=16; i++){
            defaultChannelSelect.option(i)
        }
    }
    defaultInsturmentSelect.selected(outputInsturment)
    defaultChannelSelect.selected(forwardChannel)
}

//function to create and refresh the selection box for input insturments
function AssignDefaultMidiIn(){
    //remove selection boxes if they exist to clear them
    if(defaultInputSelect){
        defaultInputSelect.remove()
        defaultChannelInputSelect.remove()
    }

    //if insturment and channel selections don't exist, create them
        defaultInputSelect = createSelect()
        defaultChannelInputSelect = createSelect()

        
    //create selection for all midi insturments
    if (midiInputs.length == 0){
        //no midi connected, show message
        defaultInputSelect.option("No MIDI Insturment")
    } else{
        //add midi insturments to select
        for(let input of midiInputs){
            defaultInputSelect.option(input.name)
        }
        //add 16 target channels
        for(let i=1; i<=16; i++){
            defaultChannelInputSelect.option(i)
        }
    }
    defaultInputSelect.selected(inputInsturment)
    defaultChannelInputSelect.selected(listenChannel)

    defaultInputSelect.changed(UpdateMidiIn)
    defaultChannelInputSelect.changed(UpdateMidiIn)

    UpdateMidiIn()
}

//function that is called when the values of the input midi boxes are updated
function UpdateMidiIn(){

    inputInsturment = defaultInputSelect.elt.selectedIndex
    listenChannel = defaultChannelInputSelect.elt.selectedIndex + 1

    if(midiInputs.length>0){
        if(midiInputs[inputInsturment].hasListener()){
            midiInputs[inputInsturment].removeListener()
        }
        inputInsturment = defaultInputSelect.elt.selectedIndex
        listenChannel = defaultChannelInputSelect.elt.selectedIndex + 1

        console.log(inputInsturment)

         //assign functionality for incoming MIDI signals
         midiInputs[inputInsturment].channels[listenChannel].addListener("midimessage", e => {
            HandleMidiEvent(e);
        })
    }else{
        //no midi insturments connected

    }
}

//function called when default midi output box is changed
function UpdateDefaultMidiOut(){
    outputInsturment = defaultInsturmentSelect.elt.selectedIndex
     forwardChannel = defaultChannelSelect.elt.selectedIndex + 1
}
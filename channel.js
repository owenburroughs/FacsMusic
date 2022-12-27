class Channel{
    constructor(index){
        //set characteristics
        this.name = facs.channels[index];
        this.index = index
        this.mode = "Linear";
        this.inputValue = ScaleChannel(index);
        this.sliderValue = 1;
        this.min =  MinAtIndex(facs.events, index)
        this.max = MaxAtIndex(facs.events, index) 
        this.minMap = 0;
        this.maxMap = 128;
        this.scaledValue = "Scaled Value"
        this.insturmentIndex = 0;
        this.midiChannel = 2

        //create container element within the channels selection box
        this.channelContainer = createDiv()
        this.channelContainer.addClass("channels")
        this.channelContainer.parent(document.getElementById("outputsContainer"))

        //name display for the channel
        this.nameDisplay = createP(`${this.index + 1}. ${this.name}`)
        this.nameDisplay.parent(this.channelContainer)
        this.nameDisplay.addClass("channelContent")

        //insturment selection container for channel
        this.insturmentSelectContainer = createDiv()
        this.insturmentSelectContainer.parent(this.channelContainer)
        this.insturmentSelectContainer.addClass("channelContent")

        //value display
        this.valueDisplay = createP(this.scaledValue)
        this.valueDisplay.parent(this.channelContainer)
        this.valueDisplay.addClass("channelContent")

        //button to poke channel
        this.pokeChannelButton = createButton('Poke Channel')
        this.pokeChannelButton.mousePressed(this.pokeChannel.bind(this))
        this.pokeChannelButton.parent(this.channelContainer)
        this.pokeChannelButton.addClass("channelContent")
    
        this.AssignMidiOut()
        
    }

    //assign midi outputs
    AssignMidiOut(){
        //remove selection boxes if they exist to clear them
        if(this.insturmentSelect){
            this.insturmentSelect.remove()
            this.channelSelect.remove()
        }

        //if insturment and channel selections don't exist, create them
            this.insturmentSelect = createSelect()
            this.insturmentSelect.parent(this.insturmentSelectContainer)
            this.insturmentSelect.addClass("channelContent")

            this.channelSelect = createSelect()
            this.channelSelect.parent(this.insturmentSelectContainer)
            this.channelSelect.addClass("channelContent")

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
    //broadcast control change
    Broadcast(value){
        //set insturment and midi channels to select boxes
        this.insturmentIndex = this.insturmentSelect.elt.selectedIndex
        this.midiChannel = this.channelSelect.elt.selectedIndex + 1

        this.valueDisplay.html(value)
        midiOutputs[this.insturmentIndex].channels[this.midiChannel].sendControlChange(this.index, value);
    }
    pokeChannel(){
        midiOutputs[this.insturmentIndex].channels[this.midiChannel].sendControlChange(this.index, 127);
    }

}
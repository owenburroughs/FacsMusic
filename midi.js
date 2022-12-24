let inputs = []
let midiOutputs = []
  
  // Enable WEBMIDI.js and trigger the onEnabled() function when ready
  WebMidi
    .enable()
    .then(onEnabled)
    .catch(err => alert(err));

  // Function triggered when WEBMIDI.js is ready
  function onEnabled() {

    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
      console.log("No MIDI Devices")
    } else {
        inputs = Array.from(WebMidi.inputs)
        midiOutputs = Array.from(WebMidi.outputs)

        //to-do: make these selectable by user
        let outputInsturment=0
        let listenChannel = 1
        let forwardChannel = 2

        inputs[outputInsturment].channels[listenChannel].addListener("midimessage", e => {
            let newStatusByte = e.data[0] - listenChannel + forwardChannel
            let newMessage = new Message([newStatusByte, e.data[1], e.data[2]])
            draw()
            midiOutputs[0].channels[2].send(newMessage);
          })
    }
  }

function ControlChange(){
    draw()
}
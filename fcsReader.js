//https://github.com/eyurtsev/fcsparser/blob/master/fcsparser/api.py

let output = {}
let channelsRead = []

let facsData = {
    "metaData":{},
    "channels":[],
    "events":[]
}

function ParseFCS(result){
            let decoder = new TextDecoder()
            let textStart = parseInt(decoder.decode(new Uint8Array(result, 10, 8)))
            let textEnd = parseInt(decoder.decode(new Uint8Array(result, 18, 8)))
            let length = textEnd-textStart
            let text = new Uint8Array(result, textStart, length)
            
            let word = []
            let key
            for(let i =0; i<text.length; i++){
                word.push(text[i])
                if(text[i]==12){
                    if(key == ""){
                        key = Decode(new Uint16Array(word)).replace(/\0|\f/g, '')
                        word = []
                    } else {
                        let tempString = Decode(new Uint16Array(word))
                        output[key] = tempString.replace(/\0|\f/g, '')
                        key = ""
                        word = []
                    }
                }
            }
            facsData.metaData = output

            //to-do: check if channels start couting at one
            for(let i=1; i <= parseInt(output.$PAR); i++){
                let key = "$P" + i + "N"
                facsData.channels.push(output[key])
            }
            
            //to-do: determine endian programatically using the bit-order attribute in the file
            let bigEndian = false
            //to-do: determine this using the file
            let bitsPerEvent = 4
            let dataStart = parseInt(output.$BEGINDATA)

            //iterate through events
            for (let i=0; i<parseInt(output.$TOT); i++){
                let event=[]

                //iterate through channels
                for (let j=0; j<facsData.channels.length; j++){
                    let offset = i * facsData.channels.length * bitsPerEvent + j * bitsPerEvent
                    //to-do: read integer values instead of floats if specified
                    event.push(new DataView(result).getFloat32(dataStart + offset,bigEndian))
                }
                facsData.events.push(event)
            }
            return facsData;
        }

function Decode(buffer){
    let decoder = new TextDecoder()
    let string = decoder.decode(buffer)
    return string
}
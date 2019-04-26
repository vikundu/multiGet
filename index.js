const fs = require('fs')
const request = require('request-promise') 
const argv = require('yargs')
                .usage('Usage: $0 <command> [options] ')
                .demandOption(['u'])
                .help('h')
                .default({
                    c: 4,
                    s: 1
                })
                .describe({
                    'c': 'Number of chunks',
                    'o': 'Output file',
                    'u': 'Url of the file',
                    's': 'Chunk Size in MiB'
                })
                .alias({
                    'c': 'chunks',
                    'o': 'output',
                    'u': 'url',
                    'h': 'help',
                    's': 'size'
                })
                .argv;

            
const MiB = 1048576      // 1 MiB = 1048576 bytes

const options = {
    method: 'GET',
    uri: argv.url ,         //-u of command line arguments
}

//return Range for a chunk
const determineChunkRange = (step) => {
    
    const chunkSize =  argv.size * MiB                 
    const rangeStart = chunkSize * step              
    const rangeEnd = rangeStart + chunkSize - 1 
    return {'Range': `bytes=${rangeStart}-${rangeEnd}`}

}

//return options containing headers with range 
const getOptions = step => ({
    ...options,
    headers: determineChunkRange(step)
})

//split the url on /
const argvUrl = argv.url.split('/')                 
//take the last element as output file name
const outputFile = argvUrl[argvUrl.length-1]       
//create a write stream in output file
const writeStream = fs.createWriteStream(argv.output || outputFile)

//download a chunk and add it to stream
const addToStream = async(option) => {

    return new Promise((resolve, reject) => {
        request(option).pipe(writeStream, { end:false })
        .on('err', () => {              //if error occured
            console.log('error')
            reject()
        })
        .on('drain',()=> {              //when writing is done for one chunk
            resolve()
        })
    })
}

const main = async() => {

    try{
        for(let i = 0; i < argv.chunks; i++){
            let option = getOptions(i)
            await addToStream(option)

            console.log(`Downloaded ${i+1} chunk of ${argv.size} MiB`)
        }
    } catch(e) {
        console.log("Error: ", e)
    }
}

main()

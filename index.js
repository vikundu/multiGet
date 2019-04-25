const fs = require('fs')
const request = require('request-promise') 
const argv = require('yargs')
                .usage('Usage: $0 <command> [options] ')
                .demandOption(['u'])
                .help('h')
                .default({
                    o: 'output',
                    c: 4
                })
                .describe({
                    'c': 'Number of chunks of 1 MiB',
                    'o': 'Output file',
                    'u': 'Url of the file'
                })
                .alias({
                    'c':'chunks',
                    'o':'output',
                    'u':'url',
                    'h':'help'
                })
                .argv;

            
const MiB = 1048576        // 1 MiB = 1048576


const options = {
    method: 'GET',
    uri: argv.url ,         //-u of command line arguments
}

//return Range for a chunk
const determineChunkRange = (step) => {
    
    const chunkSize =  MiB
    const rangeStart = chunkSize * step
    const rangeEnd = rangeStart + chunkSize - 1 
    return {'Range': `bytes=${rangeStart}-${rangeEnd}`}

}


//return options containing headers with range 
const getOptions = step => ({
    ...options,
    headers: determineChunkRange(step)
})

//create a write stream in output file
const writeStream = fs.createWriteStream(argv.output)


const addToStream = async(option) => {

    return new Promise((resolve, reject) => {

        request(option).pipe(writeStream, { end:false })
        .on('err', () => {
            console.log('error')
            reject()
        })
        .on('drain',()=> {
            resolve()
        })
    })
}

const main = async() => {

    try{
        for(let i = 0; i < argv.chunks; i++){
            let option = getOptions(i)
            await addToStream(option)
            
            console.log(`Downloaded ${i+1} chunk`)
        }
    } catch(e) {
        console.log("Error: ", e)
    }
}

main()

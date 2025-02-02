const fs        = require('fs');
const path      = require('path');
const { exec }  = require('child_process');

module.exports = {
	getBinaryData: function(imagePath)
	{
        return getBinaryData(imagePath);
    },
    getBinaryDataString: function(imagePath)
	{
        return getBinaryDataString(imagePath);
    },
    blobToBase64: function(blobData)
    {
        return blobToBase64(blobData);
    },
    makeCopy: function(sourcePath, destinationPath)
    {
        return makeCopy(sourcePath, destinationPath);
    },
    remove: function(imagePath)
    {
        return remove(imagePath);
    },
    resize: function(imagePath, width, height, toPNG)
    {
        return resize(imagePath, width, height, toPNG);
    },
    convertToPNG: function(imagePath)
    {
        return convertToPNG(imagePath);
    },
    reduceSize: function(imagePath)
    {
        return reduceSize(imagePath);
    }
}

function getBinaryData(imagePath)
{
    const imageData = fs.readFileSync(imagePath);
    return imageData;
}

function getBinaryDataString(imagePath)
{
    const imageData = getBinaryData(imagePath);
    const imageDataString = imageData.toString('binary');
    return imageDataString;
}

function blobToBase64(blobData)
{
    const base64data = Buffer.from(blobData).toString('base64');
    return base64data;
}

function makeCopy(sourcePath, destinationPath)
{
    fs.copyFileSync(sourcePath, destinationPath);
}

function remove(imagePath)
{
    fs.unlinkSync(imagePath);
}

async function convertToPNG(imagePath)
{
    let destinationFile = imagePath;
    let sourceBaseName = path.basename(imagePath);
    let sourceBaseNameWithoutExtenstion = sourceBaseName.split(`.`)[0];
    let sourceExtension = path.extname(imagePath);
    let sourceDirectory = path.dirname(imagePath);

    if(sourceExtension.toLowerCase() == `.png`)
    {
        return imagePath;
    }

    destinationFile = path.resolve(`${sourceDirectory}/${sourceBaseNameWithoutExtenstion}.png`);

    // Convert: sudo apt install imagemagick
    const commandResize = `convert "${imagePath}" ${destinationFile}`;
    const commandResult = await executeTerminalCommand(commandResize);

    if(imagePath != destinationFile)
    {
        remove(imagePath);
    }

    return destinationFile;
}

async function resize(imagePath, width, height, toPNG)
{
    if(toPNG == null)
    {
        toPNG = false;
    }

    let destinationFile = imagePath;
    let sourceBaseName = path.basename(imagePath);
    let sourceBaseNameWithoutExtenstion = sourceBaseName.split(`.`)[0];
    let sourceExtension = path.extname(imagePath);
    let sourceDirectory = path.dirname(imagePath);
    if(toPNG == true)
    {
        if(sourceExtension.toLowerCase() != `.png`)
        {

            destinationFile = path.resolve(`${sourceDirectory}/${sourceBaseNameWithoutExtenstion}.png`);
        }
    }

    // Convert: sudo apt install imagemagick
    const commandResize = `convert "${imagePath}" -resize ${width}x${height} ${destinationFile}`;
    const commandResult = await executeTerminalCommand(commandResize);

    if(imagePath != destinationFile)
    {
        remove(imagePath);
    }

    return destinationFile;
}

async function reduceSize(imagePath)
{
    // Convert: sudo apt get install pngquant or brew install pngquant
    const commandReduce = `pngquant "${imagePath}" -o ${imagePath} --force`;
    const commandResult = await executeTerminalCommand(commandReduce);
}

function executeTerminalCommand(command) 
{
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) 
            {
                reject(error);
                return;
            }
            
            if (stderr) 
            {
                reject(stderr);
                return;
            }

            resolve(stdout);
        });
    });
}
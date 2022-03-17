import fs from "fs"

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getRelativePath(absolutePath) {
    return join(__dirname, '../', absolutePath)
}

function isExists(absolutePath) {
    return fs.existsSync(getRelativePath(absolutePath))
}

function writeToFile(absolutePath, contents) {
    fs.writeFileSync(getRelativePath(absolutePath), contents)
}

function createFileIfNotExists(absolutePath, contents = "") {
    const fileRelativePath = getRelativePath(absolutePath)
    const isExists = fs.existsSync(fileRelativePath)
    if(isExists) return

    const pathSplat = absolutePath.split("/")
    pathSplat.pop()

    const folder = pathSplat.join("/")
    const folderRelativePath = getRelativePath(folder)
    const isFolderExists = fs.existsSync(folderRelativePath)

    if(!isFolderExists) fs.mkdirSync(folderRelativePath, {recursive: true})

    fs.writeFileSync(fileRelativePath, contents)
}

async function getFileContents(absolutePath) {
    const data = fs.readFileSync(getRelativePath(absolutePath))
    return data.toString()
}

export default {createFileIfNotExists, isExists, writeToFile, getRelativePath, getFileContents}
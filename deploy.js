
const exec = require('util').promisify(require('child_process').exec)
const s3FolderUpload = require('s3-folder-upload')

const fs = require ('fs')

require ('dotenv').config()

const deploy = async () => {
    const args = process.argv

    const id = process.env.AWS_ID
    const secret = process.env.AWS_SECRET
    const bucket = 'www.app.xman.tech'

    if (!id || !secret) throw new Error ('AWS credentials missing')

    if (!fs.existsSync('build')) {
        throw new Error ('Build missing')
    }

    const credentials = {
        "accessKeyId": id,
        "secretAccessKey": secret,
        "region": 'ap-east-1',
        "bucket": bucket
    }
    const options = {
        useFoldersForFileTypes: false,
        useIAMRoleCredentials: false
    }

    console.log ('uploading...')
    await s3FolderUpload ('build', credentials, options)

    if (args.includes('--cleanup-after')) {
        console.log ('deleting build folder...')
        fs.unlinkSync ('./build')
    }

    console.log ('done')
}
deploy ()

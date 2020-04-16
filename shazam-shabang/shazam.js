const fs = require('fs')

// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
const { spawn } = require("child_process")

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const executionId = uuidv4()

const log = (msg, ...rest) => {
  const completeMessage = `[ ${executionId} ${(new Date).toISOString()}] ${msg}`
  console.log(completeMessage, ...rest)

  const suffix = rest && rest.length ? rest.join(' ') : ''

  // https://nodejs.org/api/fs.html#fs_fs_appendfile_path_data_options_callback
  fs.appendFile('shazam.log', completeMessage + suffix, () => {})
}

// https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
const originalPackageJson = fs.readFileSync('package.json', 'utf8')

const libs = {
  "@babel/core": "7.9.0",
  "@babel/plugin-proposal-class-properties": "7.8.3",

  "@babel/plugin-syntax-dynamic-import": "7.8.3",
  "@babel/plugin-transform-runtime": "7.9.0",
  "@babel/preset-env": "7.9.0",
  "@babel/preset-react": "7.9.4",

  "babel-jest": "25.3.0",
  "babel-loader": "8.1.0",

  // "jest": "25.3.0",

  "terser-webpack-plugin": "2.3.5",

  "@babel/runtime": "7.9.2",

  "@testing-library/jest-dom": "^5.4.0",

  // "axios": "0.19.2",
}

const execShabang = () => new Promise((resolve, reject) => {
  // https://stackoverflow.com/questions/10232192/exec-display-stdout-live
    const shabang = spawn('bash', ['-x', 'shabang.sh']);

  shabang.stdout.on('data', function (data) {
    log('shabang.out: ' + data.toString());
  });

  shabang.stderr.on('data', function (data) {
    log('shabang.err: ' + data.toString());
  });

  shabang.on('exit', function (code) {
    log('shabang: child process exited with code ' + code.toString());
    if (code) {
      reject(code)
    } else {
      resolve(code)
    }
  });
})


const updateLine = (line, newVersion) => {
  let [lib, version] = line.split(':')
  let newLine = `${lib}: "${newVersion}"`
  if (line.endsWith(',')) {
    newLine += ','
  }
  return newLine
}

const replaceVersion = (content, lib, newVersion) => {
  log(`>> starting for - lib: ${lib} - new version: ${newVersion}`)

  const lines = content.split('\n')

  const updated = lines.map(line => {
    if (line.includes(lib)) {
      log(`>   found: ${line}`)
      const newLine = updateLine(line, newVersion)
      log(`> updated: ${newLine}\n`)
      return newLine
    }

    return line
  })

  return updated.join('\n')
}

const main = async () => {
  try {
    log('>>>>>>>>>>>>>>>>>> STARTING <<<<<<<<<<<<<<<<<<<')

    let currentPackageJson = originalPackageJson
    // for each lib in libs
    for (const key of Object.keys(libs)) {
      // replace current version with new version
      const newPackageJson = replaceVersion(currentPackageJson, key, libs[key])

      if (currentPackageJson !== newPackageJson) {
        // run: shabang
        await execShabang()
      } else {
        log('package.json unchanged - skipping...\n')
      }
      
      currentPackageJson = newPackageJson

      // write package.json
      // https://www.codota.com/code/javascript/functions/fs/writeFileSync
      fs.writeFileSync('package.json', currentPackageJson, 'utf8');

    }

    log('>>>>>>>>>>>>>>>>>>>> ENDING <<<<<<<<<<<<<<<<<<<<<')
  } catch (error) {
    log('>>>>>>>>>>>>>>>>>> ENDING WITH ERROR <<<<<<<<<<<<<<<<<<<')
  }
}

main()

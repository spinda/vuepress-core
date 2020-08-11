const cryptoRandomString = require('crypto-random-string')
const { fs, path, chalk, logger } = require('@vuepress/shared-utils')

// Generate a unique file name whose presence in a temporary directory indicates
// that the directory was initialized by this instance of VuePress.
const shibbolethFileName = `.vuepress-${cryptoRandomString({ length: 16, type: 'hex' })}`

/**
 * Create a dynamic temp utility context that allow to lanuch
 * multiple apps with isolated context at the same time.
 * @param tempPath
 * @returns {{
 *  writeTemp: (function(file: string, content: string): string),
 *  tempPath: string
 * }}
 */

module.exports = function createTemp (tempPath) {
  if (!tempPath) {
    tempPath = path.resolve(__dirname, '../../.temp')
  } else {
    tempPath = path.resolve(tempPath)
  }

  // Ensure the temporary directory exists and was initialized by this instance
  // of VuePress, by checking for the presence of the shibboleth file. Avoid
  // emptying the temporary directory if it was previously initialized by this
  // instance of VuePress; otherwise, webpack-dev-server can lose track of the
  // paths it's watching.
  const shibbolethFilePath = path.join(tempPath, shibbolethFileName)
  if (!fs.existsSync(shibbolethFilePath)) {
    fs.emptyDirSync(tempPath)
    fs.writeFileSync(shibbolethFilePath, '')
  }

  logger.debug(`Temp directory: ${chalk.gray(tempPath)}`)
  const tempCache = new Map()

  async function writeTemp (file, content) {
    const destPath = path.join(tempPath, file)
    await fs.ensureDir(path.parse(destPath).dir)
    // cache write to avoid hitting the dist if it didn't change
    const cached = tempCache.get(file)
    if (cached !== content) {
      await fs.writeFile(destPath, content)
      tempCache.set(file, content)
    }
    return destPath
  }

  return { writeTemp, tempPath }
}

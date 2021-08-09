/* eslint-disable */
const arguments_ = process.argv.slice()
let headless = true
if (arguments_[2] === 'false') {
  headless = false
}
const log = require('loglevel')

log.setDefaultLevel('debug')
const puppeteer = require('puppeteer')

const secrets = require('../../secrets.json')

const account = secrets.test_email_account
const password = secrets.test_email_password
const runUntilEvaluateEquals = (fn, value, options = {}) => {
  if (options.interval === undefined) options.interval = 500
  if (options.comparator === undefined) options.comparator = (a, b) => a === b
  return new Promise((resolve, reject) => {
    ;(function wait() {
      if (!options.comparator(fn(), value)) {
        setTimeout(wait, options.interval)
      } else {
        resolve()
      }
    })()
  })
}

const sleep = (milliseconds) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, milliseconds)
  })

const timeout = 180000(async () => {
  try {
    setTimeout(() => {
      log.info(`Setting default timeout to ${timeout}ms`)
      throw new Error('Timed out')
    }, timeout)
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    const pageLoading = page.goto('https://web3-test-torus.herokuapp.com')
    log.info('Opening web3-test page')
    await pageLoading
    log.info('web3-test page loaded')
    await sleep(5000)
    page.click('#ethereum-enable')
    log.info('Ethereum enable button clicked')
    let pageCount = 0
    await runUntilEvaluateEquals(() => {
      ;(async function () {
        pageCount = (await browser.pages()).length
      })()
      return pageCount
    }, 3)
    log.info('Popup opened')
    let browserPages = await browser.pages()
    const googleLoginPopup = browserPages.reduce((accumulator, current) => {
      if (current.url().includes('google')) {
        return current
      }
      return accumulator
    })
    await googleLoginPopup.waitForFunction('(document.querySelector("form content div div div div input")||{}).type === "email"')
    log.info('Google login popup email field loaded')
    await sleep(3000)
    const account_1 = account.slice(0, 3)
    const account_2 = account.slice(3, 6)
    const account_3 = account.slice(6, 9)
    const account_4 = account.slice(9)
    await googleLoginPopup.keyboard.type(account_1)
    await sleep(100)
    await googleLoginPopup.keyboard.type(account_2)
    await sleep(100)
    await googleLoginPopup.keyboard.type(account_3)
    await sleep(100)
    await googleLoginPopup.keyboard.type(account_4)
    await sleep(100)
    await googleLoginPopup.keyboard.press('Enter')
    log.info('Google login popup email entered')
    await googleLoginPopup.waitForFunction('(document.querySelector("form content div div div div input")||{}).type === "password"')
    log.info('Google login popup password field loaded')
    await sleep(3000)
    const password_1 = password.slice(0, 3)
    const password_2 = password.slice(3, 6)
    const password_3 = password.slice(6)
    await googleLoginPopup.keyboard.type(password_1)
    await sleep(100)
    await googleLoginPopup.keyboard.type(password_2)
    await sleep(100)
    await googleLoginPopup.keyboard.type(password_3)
    await sleep(100)
    googleLoginPopup.keyboard.press('Enter')
    log.info('Google login popup password entered')
    await page.waitForFunction(
      // eslint-disable-next-line max-len
      'window.web3.eth.accounts.length === 1'
    )
    page.click('#web3-personalSign')
    log.info('Popup opened')
    await sleep(1000)
    browserPages = await browser.pages()
    const torusPopup = browserPages.reduce((accumulator, current) => {
      if (current.url().includes('binance')) {
        return current
      }
      return accumulator
    })
    await sleep(1000)
    await torusPopup.waitForFunction(
      // eslint-disable-next-line max-len
      'document.getElementsByTagName("button").length >= 2'
    )
    await sleep(1000)
    await torusPopup.evaluate('document.getElementsByTagName("button")[1].click()')
    let alertAppeared = false
    let alertMessage = ''
    page.on('dialog', (dialog) => {
      alertMessage = dialog.message()
      alertAppeared = true
    })
    await runUntilEvaluateEquals(() => alertAppeared, true)
    if (!alertMessage.includes('OK.')) {
      throw new Error('Could not get back the right message')
    }
    log.info('Torus popup agree button pressed')
    log.info('E2E test passed')
    process.exit(0)
  } catch (error) {
    log.info(error)
    log.info('E2E test failed')
    process.exit(1)
  }
})()

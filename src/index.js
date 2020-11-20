const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');

module.exports = class Zapi {
    constructor(config){
        this.config = config
        this.browser = null
        this.page = null
        this.selectors = {
            CANVAS_QRCODE: 'canvas',
            QRCODE_DATA_REF: '._1yHR2',
            REGENERATE_QRCODE: 'div[class="_1PTz1"]',
            BTN_NEW_CHAT: 'div[title="Nova conversa"]',
            BTN_CLEAN_SEARCH_INPUT: 'button[class="_3Eocp"] span[data-icon="x-alt"]',
            INPUT_SEARCH_CHAT: 'div[class="_1awRl copyable-text selectable-text"]',
            INPUT_MSG: 'div[class="Srlyw"]',
            DIV_FIRST_CHAT: '._22mTQ',
            CHAT_HEADER: '.YEe1t',
            BTN_AUDIO_RECORD: '._3qpzV',
            BTN_WHATSAPP_API: '#action-button',
            BTN_WHATSAPP_USE_WEB: 'div[class="_8ibw"] a[class="_36or"]'
        }
    }

    async launch(){
        try {
            console.log('Loading...')
            this.browser = await puppeteer.launch(this.config);
            await this.newWhatsappPage()
            await this.waitUntilWhatsappLoad(60000)
            console.log('Whatsapp loaded!')
            return 1
        } catch(e) {
            return 0
        }
    }

    async newWhatsappPage(){
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');	
            await page.goto('https://web.whatsapp.com/', {waitUntil: 'load'});
            this.page = page
            
            await this.injectScripts()
            
            return 1
        } catch(e) {
            return 0
        }
    }

    async isPageClosed(){
        try {
            return this.page._closed
        } catch {
            return 0
        }
    }

    async closePage(){
        try {
            await this.page.close()
            return 1
        } catch (e){
            return 0
        }
    }

    async closeBrowser(){
        try {
            await this.browser.close()
            return 1
        } catch(e){
            return 0
        }
    }

    async getUserId(){
        try {
            const userId = await this.page.evaluate(() => {
                return localStorage.getItem('last-wid');
            })
            return userId
        } catch {
            return 0
        }
    }

    async logQRCode(){
        const data = await this.getQRCodeData()
        qrcode.generate(data, {small: true});
    }

    async screenShot(){
        try {
            await this.page.screenshot({ encoding: "base64" })
            return 1 
        } catch(e) {
            return 0 
        }
    }

    async isConnected(timeout){
        try {
            await this.page.waitForSelector(this.selectors.BTN_NEW_CHAT, {
                visible: true,
                timeout:timeout
            })
            return 1
        } catch(e) {
            return 0
        }
    }
    async waitForQRCode(timeout){
        
        try {
            await this.page.waitForSelector(this.selectors.CANVAS_QRCODE, {
                visible: true,
                timeout:timeout
            })
            return 1
        } catch(e) {
            return 0
        }
    }
    
    async whichPage(){
        try {

        } catch(e) {

        }
    }

    async waitUntilWhatsappLoad(timeout){
        try {
            await Promise.race([
                this.page.waitForSelector(this.selectors.CANVAS_QRCODE,{timeout:timeout}),
                this.page.waitForSelector(this.selectors.BTN_NEW_CHAT,{timeout:timeout})
            ])
            return 1
        } catch(e) {
            return 0
        }
    }

    async isInAuthPage(timeout){
        try {
            
            await this.page.waitForSelector(this.selectors.CANVAS_QRCODE,{
                visible: true,
                timeout: timeout,
            })
            return 1
        } catch(e){
            return 0
        }
    }

    async injectScripts(){
        try{
            await this.page.evaluate((selector)=>{
                
                function openDetails(){
                    try{
                        return document.querySelector(selector).click()
                    } catch {
                        return
                    }
                }
                
                const openDetailsLoop = setInterval(openDetails,100);
            },this.selectors.CHAT_HEADER)
            return 1
        } catch(e){
            return 0
        }
    }

    async openChat(phone){
        await this.waitUntilWhatsappLoad(10000)
        await this.page.type(this.selectors.INPUT_SEARCH_CHAT,phone)
        
        await this.page.waitForSelector(this.selectors.BTN_CLEAN_SEARCH_INPUT,{
            visible: true
        })
        
        await this.page.click(this.selectors.DIV_FIRST_CHAT)
    }
    
    async sendMessage(phone,message){
        try {
            await this.waitUntilWhatsappLoad(10000)
            
            try{
                await this.openChat(phone)
                await this.page.waitForSelector(this.selectors.BTN_AUDIO_RECORD,{
                    visible:true
                })
                
                await this.page.type(this.selectors.INPUT_MSG,message)
                await this.page.keyboard.press('Enter')
            } catch {
                const newChatlink = 'https://api.whatsapp.com/send?phone='+phone+'&text='+message
                
                await this.page.goto(newChatlink,{
                    waitUntil: 'load'
                })
                await this.page.waitForSelector(this.selectors.BTN_WHATSAPP_API)
                await this.page.click(this.selectors.BTN_WHATSAPP_API)
                
                await this.page.waitForSelector(this.selectors.BTN_WHATSAPP_USE_WEB)
                
                await this.page.evaluate(() => {
                    document.querySelector(this.selectors.BTN_WHATSAPP_USE_WEB).click();
                })
                await this.page.waitForSelector(this.selectors.BTN_AUDIO_RECORD,{
                    visible:true
                })
                await this.page.keyboard.press('Enter')
                await this.injectScripts()
            }
            return 1
        } catch(e) {
            return 0
        }
    }
    
    async getMessages(phone){
        try {
            await this.waitUntilWhatsappLoad(10000)
            await this.openChat(phone)

            const messages = await this.page.evaluate(() => {
                function getChatData(){
                    var messageArray = []
                    document.querySelectorAll('div[class="_2XJpe _7M8i6"]').forEach(message =>{
                        
                        try{
                            messageObj = {
                                type: message.parentElement.querySelector('span[data-icon]').getAttribute('data-icon').replace('tail-',''),
                                author: message.querySelector('span[aria-label]').getAttribute('aria-label').replace(':',''),
                                date: message.querySelector('span[class="_2JNr-"]').textContent,
                                content: {
                                message: message.querySelector('div[class="_1wlJG"]').textContent
                                }
                            };
                            messageArray.push(messageObj);
                        }catch{
                            //pass
                        }
                    });
                    return messageArray
                }
                return getChatData()
            })
            return messages

        } catch(e){
            console.log(e)
            return 0
        }
    }

    async getQRCodeBase64(){
        try {

            try {
                await this.page.click(this.selectors.REGENERATE_QRCODE);
            } catch {
                //pass
            }
    
            const base64QRCode = await this.page.evaluate((selector) => {
                return document.querySelector(selector).toDataURL()
            },this.selectors.CANVAS_QRCODE)
    
            return base64QRCode
        } catch(e) {
            return 0
        }

    }
    async getQRCodeData(){
        try {

            try {
                await this.page.click(this.selectors.REGENERATE_QRCODE);
            } catch {
                //pass
            }
    
            const qrCodeData = await this.page.evaluate((selector) => {
                return document.querySelector(selector).getAttribute('data-ref')
            },this.selectors.QRCODE_DATA_REF)
    
            return qrCodeData
        } catch(e) {
            return 0
        }

    }

}
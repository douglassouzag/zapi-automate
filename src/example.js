const Zapi = require('./index');

(async () => {
	const WPP = new Zapi({ 
		defaultViewport: null,
		headless: false, 
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', //Path to your chrome executable.
		userDataDir: './sessions/' + 3333 //Where your session will be saved and loaded. 
	})
	
	await WPP.launch()
    await WPP.waitUntilWhatsappLoad(60000)
    
    if(await WPP.isConnected(100)){
        console.log('Already connected!')
    } else {
        await WPP.logQRCode()
        if (await WPP.isConnected(30000)){
            console.log('Connected!')
        } else {
            console.log('Timeout!')
            return
        }
    }
    const userId = await WPP.getUserId()
    console.log('Connected as',userId)

    await WPP.openChat('5512981585106')

})();
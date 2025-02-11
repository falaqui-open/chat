var splashActive = true;
const TIME_TO_HIDE_SPLASH = 500;
const TIME_TO_CHECK_SPLASH_HIDE_AFTER_APP_READY = 100;
const TIME_TO_CHECK_SPLASH_FINISHED = 100;

function splashHideWhenReady()
{
    if(deviceIsReady == true)
    {
        splashScreenHide();
        return;
    }

    var itvSplashWaitReady = setInterval(function(){
        if(deviceIsReady == true)
        {
            clearInterval(itvSplashWaitReady);
            splashScreenHide();
        }
    }, TIME_TO_CHECK_SPLASH_HIDE_AFTER_APP_READY);
}

function splashScreenHide()
{
    setTimeout(function(){
        splashActive = false;
        $(`#screenSplash`).addClass(`hide`);                
    }, TIME_TO_HIDE_SPLASH);
}

function waitSplashFinish()
{
    return new Promise((resolve, reject) =>{
        if(splashActive == false)
        {
            resolve();
            return;
        }

        var itvWaitSplash = setInterval(function(){
            if(splashActive == false)
            {
                clearInterval(itvWaitSplash);
                resolve();
            }
        }, TIME_TO_CHECK_SPLASH_FINISHED);
    })
}
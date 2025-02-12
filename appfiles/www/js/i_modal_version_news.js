
$(function() {
    mountModalVersionNewsEvents();
});

function mountModalVersionNewsEvents()
{
    $("#modalVersionNews").modal({
        opacity: 0.7, //Opacity of the modal overlay.
        inDuration:	250, //Transition in duration in milliseconds.
        outDuration: 250, //Transition out duration in milliseconds.
        onOpenStart: function(modalElement){ 
            // Callback function called before modal is opened.
        }, 
        onOpenEnd: function(modalElement){ 
            // Callback function called after modal is opened.
            addModalToStack(modalElement);
        }, 
        onCloseStart: function(modalElement){ 
            // Callback function called before modal is closed.
        }, 
        onCloseEnd: function(modalElement){ 
            // Callback function called after modal is closed.
            removeModalFromStack(modalElement)
        }, 
        preventScrolling: true, //Prevent page from scrolling while modal is open.
        dismissible: false, //Allow modal to be dismissed by keyboard or overlay click.
        // startingTop: '4%', //Starting top offset
        // endingTop: '18%', //Ending top offset
    });

    $(`#versionNewsClose`).off(`click`);
    $(`#versionNewsClose`).on(`click`, function(){
        // Set as updated displayed news version
        writeLocalStorage('lastcheckednewsversion', build_version);
        $("#modalVersionNews").modal(`close`);
    });

}

async function initModalVersionNews()
{
    $("#modalVersionNews").modal(`open`);
}


async function fillModalVersionNewsList(dbRecords, versionNumber)
{
    $("#versionNewsList").html("");
    $("#versionNumber").html(versionNumber);
    for(const record of dbRecords) {
        $("#versionNewsList").append(`
            <div class="row">
                <div class="titleIcon col s1">
                    <img src="images/checked.png" height="20px">
                </div>
                <div class="title col s11">${record.title}</div>
            </div>
        `);
        $("#versionNewsList").append(`
            <div class="row">
                <div class="col s1"></div>
                <div class="col s11">${record.description}</div>
            </div>        
        `)
    }
}

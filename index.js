module.exports = function ItemHelper(mod) {

    let watch = false;
    let color = mod.settings.color;

    function chatLink(id) {
        let link=`<font color="${color.blue}"><ChatLinkAction param="1#####${id}">&lt;${id}&gt;</ChatLinkAction></font>`;

        return link;
    }

    function message(msg) {
        switch(mod.settings.text.type){
        case 'screen':
            mod.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
                message: msg,
                style: mod.settings.text.style
            });
            break;
        case 'console':
            mod.log(msg.replace(/(<([^>]+)>)/ig,""));
            break;
        default:
            mod.command.message(msg);
            break;
        }
    }

    function playSound(id){
        if (!id) id = mod.settings.sound.id

        mod.send("S_PLAY_SOUND", 1, { SoundID: id });
    }

    function help(arg) {
        switch(arg){
        case 'text':
            message(`<font color='${color.white}'>
            <br><font color='${color.yellow}'>type</font>: Sets where the messages are displayed:
            <br>- <font color='${color.blue}'>chat</font>  Prints in game chat.
            <br>- <font color='${color.blue}'>console</font>  Prints in toolbox console.
            <br>- <font color='${color.blue}'>screen</font>  Prints anywhere in your screen.
            <br><font color='${color.yellow}'>style</font>: Sets the message ID style. Only affects "screen"
            type.`)
            break;
        default:
            message(`<font color='${color.white}'>
            <br><font color='${color.yellow}'>item</font>: Toggles <font color='${color.blue}'>watch</font> mode. Hover a item or click a link
            to retrive its ID.
            <br><font color='${color.yellow}'>item nameof</font>: Retrieve item name by specifying a ID.
            <br><font color='${color.yellow}'>item link</font>: Generates a chat link by specifying a ID.
            <br><font color='${color.yellow}'>item text style/type</font>: Configure message style and type.<br>
            Run <font color='${color.blue}'>item help text</font> for more info.</font>`)
            break;
        }
    }

    // get item name from datacenter
    async function getItemName(id) {
        id = parseInt(id);

        let itemName;
        let results = await mod.queryData('/StrSheet_Item/String@id=?/', [id], true, false, ["id", "string"]);

        for (let result of results){
            itemName = result.attributes.string;
            message((itemName) ? `<font color='${color.white}'>${itemName}:</font> ` + chatLink(id) : chatLink(id) + " (No name)");
            if (mod.settings.sound.enabled) playSound();
        };
    }


    /* ================================================== */
    /* the hooks below are used only for the "watch" mode */
    /* ================================================== */

    // item in broker, merchant NPCs or linked in chat
    mod.hook('S_REPLY_NONDB_ITEM_INFO', '*', (event) => {
        if (!watch) return;

        try {
            getItemName(event.item);
        } catch(e) {
            message(`<font color="${color.red}>"Error!</font> Could not retrieve name.`)
        }
    });

    // item in inventory or bank
    mod.hook('S_SHOW_ITEM_TOOLTIP', '*', (event) => {
        if (!watch) return;

        try {
            getItemName(event.id);
        } catch(e) {
            message(`<font color="${color.red}>"Error!</font> Could not retrieve name.`)
        }
    });

    /* ================================================== */
    /*                     end                            */
    /* ================================================== */

    /* commands */
    mod.command.add(['item', 'i'], {
        '$default': () => {
            mod.command.message(`Invalid command. Run <font color='${color.yellow}'>item help</font> for more info.`);
        },
        // retrieve item ID by clicking or hovering a item
        '$none': () => {
            watch = !watch;
            message((watch) ? `<font color='${color.green}'>Watching...</font>` : `<font color='${color.yellow}'>Stopped.</font>`);
        },
        // retrieve item name by specifying a ID
        'nameof': (arg) => {
            getItemName(arg);
        },
        // links the item on chat
        'link': (arg) => {
            message(chatLink(arg));
        },
        'sound': (arg) => {
            if (arg == 'show') {
                playSound(mod.settings.sound.id);
                mod.command.message(`Current SFX set to <font color='${color.yellow}'>${mod.settings.sound.id}</font>.`)
                return;
            }

            arg = parseInt(arg)
            
            if (arg) {
                mod.settings.sound.id = arg
                playSound(arg);
                mod.command.message(`SFX set to <font color='${color.yellow}'>${arg}</font>.`)
            } else {
                mod.settings.sound.enabled = !mod.settings.sound.enabled 
                if (mod.settings.sound.enabled) playSound();
                mod.command.message(`SFX is now ${mod.settings.sound.enabled ? 'en' : 'dis'}abled.` )
            }
        },
        'text': (conf, arg) => {
            switch(conf) {
            case 'style': case 'Style':
                arg = parseInt(arg)
                if (Number.isNaN(arg)) return;

                mod.settings.text.style = arg
                mod.command.message(`Message style set to <font color='${color.yellow}'>${arg}</font>.`);
                break;
            case 'type':
                mod.settings.text.type = arg
                mod.command.message(`Message type set to <font color='${color.yellow}'>${arg}</font>.`);
                break;
            default:
                mod.command.message(`Invalid. Accepted parameters are <font color='${color.yellow}'>style</font> and <font color='${color.yellow}'>type</font>.`)
                break;
            }
        },
        'reload': () => {
            try {
                mod.manager.reload(mod.info.name);
                mod.command.message("<font color='${color.green}'>Reloaded!</font>");
            } catch (e) {
                mod.command.message("<font color='${color.red}'>Reload failed.</font> Please check Toolbox log for more info.");
            }
        },
        'help': (arg) => {
            help(arg);
        }
    });

    this.destructor = () => {
        mod.command.remove('item');
    };

    this.saveState = () => {};
    this.loadState = state => {};
}

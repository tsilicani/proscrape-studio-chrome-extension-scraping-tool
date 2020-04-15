<template>
    <v-app>
        <v-app-bar flat clipped-left dense :style="{background: background}">
            <v-app-bar-nav-icon @click="drawer = !drawer" color="primary" />
            <span class="title ml-3 mr-5 ciccio">ProScrape&nbsp;<span class="font-weight-light">Studio</span></span>
            <v-text-field v-model="url" outlined dense hide-details label="Url" append-icon="mdi-location-enter" clearable @click:append="go(url)" />
            <v-text-field v-model="selector" class="ml-2" outlined dense hide-details label="Xpath" clearable />
            <v-text-field v-model="selectorTestOutput" class="ml-2" label="Output" outlined dense hide-details />
        </v-app-bar>
        <v-navigation-drawer temporary v-model="drawer" app dark :style="{background: background}">
            <v-list dense>
                <v-list-item link>
                    <v-list-item-action>
                        <v-icon>settings</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>
                            Settings
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-divider dark class="my-4" />
                <v-list-item>
                    <v-list-item-title>Scripts</v-list-item-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="clear(); drawer=false">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                    <v-btn icon @click="$refs.uploader.click(); drawer=false">
                        <input type="file" @change="loadFromFile" ref="uploader" class="d-none">
                        <v-icon>mdi-file-upload-outline</v-icon>
                    </v-btn>
                    <v-btn icon @click="exportFile; drawer=false">
                        <v-icon>mdi-content-save</v-icon>
                    </v-btn>
                </v-list-item>
                <v-divider dark class="my-4" />
                <template v-for="item in scripts">
                    <v-list-item link>
                        <v-list-item-title @click="script=item; drawer=false">{{item.name?item.name:'Untitled'}}</v-list-item-title>
                        <v-spacer></v-spacer>
                        <v-btn icon @click="removeScript(item.id)">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-list-item>
                </template>
            </v-list>
        </v-navigation-drawer>
        <div class="resizable-container split">
            <div class="split__left">
                <div class="tab-name-container">
                    <div class="tab-name pa-2" @click="dialogRename=true">
                        <a class="white--text">{{name?name:'Untitled'}}</a>
                    </div>
                </div>
                <editor v-model="code" @init="editorInit" lang="javascript" theme="monokai" :options="aceOptions" width="100%" height="95%" />
            </div>
            <div class="split__bar"></div>
            <div class="split__right">
                <div class="tab-name-container">
                    <div class="tab-name pa-2">Output</div>
                </div>
                <editor v-model="output" @init="editorInit" lang="json" theme="monokai" width="100%" height="95%" />
            </div>
        </div>
        <v-overlay :value="overlay">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
        <v-dialog v-model="dialogRename" max-width="500px">
            <v-card :style="{background: background}">
                <v-card-title>
                    <span class="headline">Rename</span>
                </v-card-title>
                <v-card-text class="mt-2">
                    <v-form ref="form">
                        <v-text-field v-model="name" label="Name" outlined dense hide-details />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialogRename=false">Ok</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <div id="tab" v-html="html" class="d-none"></div>
    </v-app>
</template>
<script>
const browser = require("webextension-polyfill")
const FileSaver = require('file-saver')
import { v4 as uuidv4 } from 'uuid'

const demo =
    `console.log('ciao')`

export default {
    components: {
        editor: require('vue2-ace-editor')
    },
    data: () => ({
        aceOptions: {
            fontSize: 12,
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
        },
        overlay: false,
        drawer: false,
        dialogRename: false,
        background: '#272822',
        html: '',
        selectorTestOutput: '',
        output: '',
        get url() {
            return localStorage.getItem('url') || ''
        },
        set url(payload) {
            payload ? localStorage.setItem('url', payload) : localStorage.setItem('url', '')
        },
        get tabId() {
            return parseInt(localStorage.getItem('tabId') || '')
        },
        set tabId(payload) {
            payload ? localStorage.setItem('tabId', payload) : localStorage.setItem('tabId', '')
        },
        get selector() {
            return localStorage.getItem('selector') || ''
        },
        set selector(payload) {
            payload ? localStorage.setItem('selector', payload) : localStorage.setItem('selector', '')
        },
        get code() {
            return localStorage.getItem('code') || ''
        },
        set code(payload) {
            payload ? localStorage.setItem('code', payload) : localStorage.setItem('code', '')
        },
        get id() {
            return localStorage.getItem('id') || ''
        },
        set id(payload) {
            payload ? localStorage.setItem('id', payload) : localStorage.setItem('id', '')
        },
        get name() {
            return localStorage.getItem('name') || ''
        },
        set name(payload) {
            payload ? localStorage.setItem('name', payload) : localStorage.setItem('name', '')
        },
        scripts: []
    }),
    computed: {
        script: {
            get() {
                return { code: this.code, name: this.name, id: this.id }
            },
            set(script) {
                this.id = script.id
                this.name = script.name
                this.code = script.code
            }
        },
        selectorTestParams: {
            get() {
                return [this.html, this.selector]
            }
        },
    },
    watch: {
        script(val) {
            this.save()
        },
        selectorTestParams(val) {
            this.selectorTestOutput = this.extract(this.selector)
        },
    },
    methods: {
        sync() {
            chrome.storage.sync.set({ scripts: this.scripts })
        },
        save() {
            if (this.name || this.code) {
                this.id = this.id ? this.id : uuidv4()
                this.scripts = this.scripts.filter(script => script.id != this.id)
                this.scripts.push({ name: this.name, code: this.code, id: this.id })
                this.sync()
            }
        },
        removeScript(id) {
            this.scripts = this.scripts.filter(script => script.id != id)
            this.sync()
        },
        exportFile() {
            const blob = new Blob([JSON.stringify(this.scripts)], { type: "text/plain;charset=utf-8" });
            FileSaver(blob, "pro-scrape-backup.json")
        },
        loadFromFile(ev) {
            const file = ev.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                this.scripts = JSON.parse(reader.result)
            }
            reader.readAsText(file)
        },
        editorInit: function() {
            require('brace/ext/language_tools') //language extension prerequisite...
            require('brace/mode/javascript') //language
            require('brace/mode/json') //language
            require('brace/theme/monokai')
            require('brace/snippets/javascript') //snippet
        },
        clear() {
            this.id = ''
            this.name = ''
            this.code = demo
        },
        go(url) {
            const setHtml = (html) => { this.html = html }
            return new Promise(resolve => {
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    if (this.tabId && tabs.filter(tab => tab.id == this.tabId).length) {
                        chrome.tabs.update(this.tabId, { url: url, active: false }, async tab => {
                            this.url = url
                            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                if (info.status === 'complete' && tabId === tab.id) {
                                    chrome.tabs.onUpdated.removeListener(listener)
                                    chrome.tabs.executeScript(tab.id, {
                                        "code": "const result = document.body.innerHTML; result;"
                                    }, async result => {
                                        setHtml(result ? result[0].split('src="').join('srx="') : '')
                                        resolve(tab)
                                    })
                                }
                            })
                        })
                    } else { // create new
                        return new Promise(resolve => {
                            chrome.tabs.create({ url: url, active: false }, async tab => {
                                this.url = url
                                this.tabId = tab.id
                                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                    if (info.status === 'complete' && tabId === tab.id) {
                                        chrome.tabs.onUpdated.removeListener(listener)
                                        chrome.tabs.executeScript(tab.id, {
                                            "code": "const result = document.body.innerHTML; result;"
                                        }, async result => {
                                            setHtml(result ? result[0].split('src="').join('srx="') : '')
                                            resolve(tab)
                                        })
                                    }
                                })
                            })
                        })
                    }
                })
            })
        },
        destroyTab() {
            chrome.tabs.remove(this.tabId)
            this.tabId = ''
        },
        getTabInfo() {
            const tabId = this.tabId
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                return tabs.filter((tab) => { return tab.id == parseInt(tabId) })
            })
        },
        extract(xpath) {
            this.testxml()
            // try {
            //     const selector = `//*[@id='tab']${xpath}`
            //     console.log(selector)
            //     console.log(document.getElementById('tab'))
            //     console.log(document.readyState)
            //     const result = document.evaluate(selector, document, null, XPathResult.STRING_TYPE, null)
            //     console.log(result.stringValue)
            //     setTimeout(() => {
            //         const result2 = document.evaluate(selector, document, null, XPathResult.STRING_TYPE, null)
            //         console.log(result2.stringValue)
            //     }, 100)
            //     return result.stringValue
            // } catch {
            //     console.log('error')
            //     return ''
            // }
        },
        testxml() {
            const xpath = this.selector
            const selector = `//*[@id='tab']${xpath}`
            let parser = new DOMParser()
            let doc = parser.parseFromString(this.html, "text/html")
            console.log(doc)
            const result2 = doc.evaluate('//h3', doc, null, XPathResult.STRING_TYPE, null)
            console.log(result2.stringValue)
            // setTimeout(() => {

            // }, 2000)


        },
        evaluate() {
            const sleep = (seconds) => { return new Promise((resolve) => setTimeout(resolve, seconds * 1000)) }
            const go = (url) => { this.go(url) }
            const extract = (xpath) => this.extract(xpath)
            const click = (xpath) => { this.clickOn(xpath) }
            const tabInfo = () => { return this.getTabInfo() }
            eval(this.code)
        },
        clickOn(xpath) {
            const code = `const xPathRes = document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); xPathRes.singleNodeValue.click();`
            chrome.tabs.executeScript(this.tabId, { "code": code }, this.getTabInfo)
        },
    },
    beforeCreate() {
        this.overlay = true
        chrome.storage.sync.get(['scripts'], result => {
            if (result['scripts']) {
                this.scripts = result['scripts']
            }
            this.overlay = false
        })
    },
    mounted() {
        window.addEventListener('beforeunload', this.destroyTab)
        const self = this
        /* key bindings */
        document.onkeydown = function(e) {
            e = e || window.event; //Get event
            if (e.ctrlKey) {
                var c = e.which || e.keyCode; //Get key code
                switch (c) {
                    case 66: // b
                        self.evaluate()
                        break
                }
            }
        }
        /* resize */
        const bar = document.querySelector('.split__bar');
        const left = document.querySelector('.split__left');
        let mouse_is_down = false;
        bar.addEventListener('mousedown', (e) => {
            mouse_is_down = true;
        })
        document.addEventListener('mousemove', (e) => {
            if (!mouse_is_down) return;

            left.style.width = `${e.clientX}px`;
        })
        document.addEventListener('mouseup', () => {
            mouse_is_down = false;
        })
    }
}
</script>
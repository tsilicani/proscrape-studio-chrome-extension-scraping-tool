<template>
    <v-app>
        <v-app-bar flat clipped-left dense :style="{background: background}">
            <v-app-bar-nav-icon @click="drawer = !drawer" color="primary" />
            <span class="title ml-3 mr-5 ciccio">ProScrape&nbsp;<span class="font-weight-light">Studio</span></span>
            <v-text-field v-model="url" outlined dense hide-details label="Url" append-icon="mdi-location-enter" clearable @click:append="go(url)" @mouseover="editUrl = true" @mouseleave="editUrl = false" />
            <v-text-field v-model="selector" class="ml-2" outlined dense hide-details label="Xpath" clearable />
            <v-text-field v-model="selectorTestOutput" class="ml-2" :label="selectorTestOutput? 'Output' : 'No Output'" outlined dense hide-details :disabled="true" />
            <v-tooltip v-model="showOutput" bottom>
                <template v-slot:activator="{ on }">
                    <v-btn color="primary" icon v-on="on" @click="showOutput = !showOutput">
                        <v-icon>mdi-arrow-down-drop-circle-outline</v-icon>
                    </v-btn>
                </template>
                <span>{{selectorTestOutput ? selectorTestOutput: 'No Output'}}</span>
            </v-tooltip>
        </v-app-bar>
        <v-navigation-drawer temporary v-model="drawer" app dark :style="{background: background}">
            <v-list dense>
                <!-- <v-list-item link>
                    <v-list-item-action>
                        <v-icon>settings</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>
                            Settings
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-divider dark class="my-4" /> -->
                <v-list-item>
                    <v-list-item-title>Projects</v-list-item-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="clear(); drawer=false">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                    <v-btn icon @click="$refs.uploader.click(); drawer=false">
                        <input type="file" @change="loadFromFile" ref="uploader" class="d-none">
                        <v-icon>mdi-file-upload-outline</v-icon>
                    </v-btn>
                    <v-btn icon @click="exportScripts(); drawer=false">
                        <v-icon>mdi-content-save</v-icon>
                    </v-btn>
                    <v-btn icon @click="exportData(); drawer=false">
                        <v-icon>mdi-database-export</v-icon>
                    </v-btn>
                </v-list-item>
                <v-divider dark class="my-4" />
                <template v-for="item in scripts">
                    <v-list-item link>
                        <v-list-item-title @click="script=item; drawer=false">{{item.name?item.name:'Untitled'}}</v-list-item-title>
                        <v-spacer></v-spacer>
                        <v-btn icon @click="removeProject(item.id)">
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
                <editor v-model="code" @init="editorInit" lang="javascript" theme="monokai" :options="aceOptions" width="100%" />
            </div>
            <div class="split__bar"></div>
            <div class="split__right">
                <div class="tab-name-container">
                    <div class="tab-name pa-2">Output</div>
                </div>
                <editor v-model="output" @init="editorInit" lang="json" theme="monokai" width="100%" />
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
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-text-field v-model="name" label="Name" outlined dense :rules="[nameExists]" hint="The name must be unique." />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialogRename=false">Ok</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>
<script>
const browser = require("webextension-polyfill")
const beautify = require('js-beautify').js
const FileSaver = require('file-saver')
import { v4 as uuidv4 } from 'uuid'

String.prototype.allTrim = String.prototype.allTrim ||
    function() {
        return this.replace(/\s+/g, ' ')
            .replace(/^\s+|\s+$/, '')
            .trim();
    };

const demo =
    `/*
const tabLaunched = await go('https://example.org')
await click(xpath)
await insert(xpath, string)
await sleep(seconds)
const string = await extract('//h1')
out({'string': string})
await inject("console.log('ciao)")
*/`

let tabDoc

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
            useWorker: false
        },
        valid: false,
        showOutput: false,
        overlay: false,
        drawer: false,
        dialogRename: false,
        background: '#272822',
        fetchCount: 0,
        selectorTestOutput: '',
        codeIsNew: undefined,
        editUrl: false,
        output: '{}',
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
        scripts: [],
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
                return [this.fetchCount, this.selector]
            }
        }
    },
    watch: {
        script() {
            if (this.codeIsNew) {
                this.codeIsNew = false
            } else {
                this.save()
            }
        },
        selectorTestParams() {
            if (this.tabId) { this.extract(this.selector) }
        },
        output() {
            chrome.storage.local.set({
                [this.id]: this.output
            })
        },
        id() {
            chrome.storage.local.get([this.id], (result) => {
                this.output = Object.keys(result).length ? result[this.id] : '{}'
            })
        },
    },
    methods: {
        nameExists(name) {
            return this.scripts.filter(script => script.name == name).length == 1 || 'This name already exists.'
        },
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
        removeProject(id) {
            if (this.id == id) {
                this.clear()
            }
            this.scripts = this.scripts.filter(script => script.id != id)
            this.script = this.script
            this.sync()
            chrome.storage.local.remove([id])
        },
        getDate() {
            const t = new Date()
            const hr = ("0" + t.getHours()).slice(-2);
            const min = ("0" + t.getMinutes()).slice(-2);
            const sec = ("0" + t.getSeconds()).slice(-2);
            const month = t.getMonth() + 1;
            return t.getFullYear() + "-" + month + "-" + t.getDate() + "-" + hr + "-" + min + "-" + sec
        },
        exportScripts() {
            const blob = new Blob([JSON.stringify(this.scripts)], { type: "text/plain;charset=utf-8" });
            FileSaver(blob, `ProScrape scripts backup ${this.getDate()}.json`)
        },
        exportData() {
            const blob = new Blob([this.output], { type: "text/plain;charset=utf-8" });
            FileSaver(blob, `ProScrape data backup ${this.name ? this.name : 'Untitled'} ${this.id} ${this.getDate()}.json`)
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
            this.codeIsNew = true
            this.id = ''
            this.name = ''
            this.code = demo
        },
        go(url) {
            console.log(url)
            const self = this
            return new Promise(resolve => {
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    if (self.tabId && tabs.filter(tab => tab.id == self.tabId).length) {
                        chrome.tabs.update(self.tabId, { url: url, active: true }, async tab => {
                            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                if (tabId === tab.id) {
                                    if (info.status === 'complete') {
                                        chrome.tabs.onUpdated.removeListener(listener)
                                        self.injectJsFile()
                                            .then(() => {
                                                chrome.tabs.executeScript(self.tabId, {
                                                    "code": "document.documentElement.innerHTML;"
                                                }, async result => {
                                                    const htmlString = result ? result[0] : ''
                                                    const parser = new DOMParser()
                                                    tabDoc = parser.parseFromString(htmlString, "text/html")
                                                    self.fetchCount++
                                                    self.setActive('main')
                                                    resolve(tab)
                                                })
                                            })
                                    } else if (info.status === 'loading') {
                                        self.url = info.url
                                    }
                                }
                            })
                        })
                    } else { // create new
                        chrome.tabs.create({ url: url, active: true }, async tab => {
                            self.tabId = tab.id
                            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                if (tabId === tab.id) {
                                    if (info.status === 'complete' && tabId === tab.id) {
                                        chrome.tabs.onUpdated.removeListener(listener)
                                        self.injectJsFile()
                                            .then(() => {
                                                chrome.tabs.executeScript(self.tabId, {
                                                    "code": "document.documentElement.innerHTML;"
                                                }, async result => {
                                                    const htmlString = result ? result[0] : ''
                                                    const parser = new DOMParser()
                                                    tabDoc = parser.parseFromString(htmlString, "text/html")
                                                    self.fetchCount++
                                                    self.setActive('main')
                                                    resolve(tab)
                                                })
                                            })
                                    } else if (info.status === 'loading') {
                                        self.url = info.url
                                    }
                                }
                            })
                        })
                    }
                })
            })
        },
        setActive(tabAlias) {
            console.assert(tabAlias == 'main' || tabAlias == 'tab', { tabAlias: tabAlias, errorMsg: 'Invalid argument.' })
            const self = this
            const filterFunc = tabAlias == 'main' ? (tab) => { return tab.url == window.location.href } : (tab) => { return tab.id == self.tabId }
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const tab = tabs.filter(filterFunc)
                if (tab) {
                    setTimeout(() => { chrome.tabs.update(tab[0].id, { active: true }) }, 1000)
                } else {
                    console.log('No tab found.')
                }
            })
        },
        destroyTab() {
            chrome.tabs.remove(this.tabId)
            this.tabId = ''
        },
        getTabInfo() {
            const self = this
            return new Promise(resolve => {
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    resolve(tabs.filter((tab) => { return tab.id == self.tabId }))
                })
            })
        },
        extract(xpath) {
            const self = this
            return new Promise((resolve, reject) => {
                chrome.tabs.executeScript(self.tabId, {
                    "code": "document.documentElement.innerHTML;"
                }, async result => {
                    const htmlString = result ? result[0] : ''
                    const parser = new DOMParser()
                    const doc = parser.parseFromString(htmlString, "text/html")
                    let stringExtracted = ''
                    if (xpath) {
                        try {
                            const extracted = doc.evaluate(xpath, doc, null, XPathResult.STRING_TYPE, null)
                            stringExtracted = extracted.stringValue.allTrim()
                        } catch (e) {
                            reject(e)
                        }
                    }
                    if (self.selector == xpath) { self.selectorTestOutput = stringExtracted }
                    resolve(stringExtracted)
                })
            })
        },
        extractFromCopy(xpath) {
            const extracted = tabDoc.evaluate(xpath, tabDoc, null, XPathResult.STRING_TYPE, null)
            return extracted.stringValue.allTrim()
        },
        extractList(xpath) {
            const self = this
            return new Promise((resolve, reject) => {
                chrome.tabs.executeScript(self.tabId, {
                    "code": "document.documentElement.innerHTML;"
                }, async result => {
                    const htmlString = result ? result[0] : ''
                    const parser = new DOMParser()
                    const doc = parser.parseFromString(htmlString, "text/html")
                    const res = []
                    if (xpath) {
                        try {
                            var nodesSnapshot = document.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
                                res.push(nodesSnapshot.snapshotItem(i).textContent.allTrim())
                            }
                            resolve(res)
                        } catch (e) {
                            reject(e)
                        }
                    }
                })
            })
        },
        extractListFromCopy(xpath) {
            const res = []
            const extracted = tabDoc.evaluate(xpath, tabDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
            for (var i = 0; i < extracted.snapshotLength; i++) {
                res.push(extracted.snapshotItem(i).textContent.allTrim())
            }
            return res
        },
        clickOn(xpath, isLink) {
            this.setActive('tab')
            const self = this
            const code = `(() => {
                try {
                    document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click();
                    return true;
                } catch {
                    return false;
                }
            })();`
            let timeout = false
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    timeout = true
                }, 10 * 1000)
                var interval = setInterval(() => {
                    if (timeout) {
                        clearInterval(interval)
                        reject(new Error('Timeout, verify the xpath'))
                    }
                    chrome.tabs.executeScript(self.tabId, {
                        code: code
                    }, (result) => {
                        if (result[0]) {
                            clearInterval(interval)
                            if (isLink) {
                                setTimeout(() => {
                                    reject(new Error('Timeout, verify the connection.'))
                                    self.setActive('main')
                                }, 10 * 1000)
                                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                    if (tabId == self.tabId) {
                                        if (info.status === 'complete') {
                                            chrome.tabs.onUpdated.removeListener(listener)
                                            self.fetchCount++
                                            self.injectJsFile()
                                                .then(() => {
                                                    self.setActive('main')
                                                    resolve(result)
                                                })
                                        } else if (info.status === 'loading') {
                                            self.url = info.url
                                        }
                                    }
                                })
                            } else {
                                self.setActive('main')
                                resolve(result)
                            }
                        }
                    })
                }, 100)
            })
        },
        insertOn(xpath, value, isLink) {
            this.setActive('tab')
            const self = this
            const code = `(() => {
                try {
                    document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
                    document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value = '${value}'
                    return true;
                } catch {
                    return false;
                }
            })();`
            let timeout = false
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    timeout = true
                }, 10 * 1000)
                var interval = setInterval(() => {
                    if (timeout) {
                        clearInterval(interval)
                        reject(new Error('Timeout, verify the xpath'))
                    }
                    chrome.tabs.executeScript(self.tabId, {
                        code: code
                    }, (result) => {
                        if (result[0]) {
                            clearInterval(interval)
                            if (isLink) {
                                setTimeout(() => {
                                    reject(new Error('Timeout, verify the connection.'))
                                    self.setActive('main')
                                }, 10 * 1000)
                                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                                    if (tabId == self.tabId) {
                                        if (info.status === 'complete') {
                                            chrome.tabs.onUpdated.removeListener(listener)
                                            self.fetchCount++
                                            self.injectJsFile()
                                                .then(() => {
                                                    self.setActive('main')
                                                    resolve(result)
                                                })
                                        } else if (info.status === 'loading') {
                                            self.url = info.url
                                        }
                                    }
                                })
                            } else {
                                self.setActive('main')
                                resolve(result)
                            }
                        }
                    })
                }, 100)
            })
        },
        sendMessage(message) {
            return new Promise(resolve => {
                chrome.tabs.sendMessage(this.tabId, message, undefined, (response) => {
                    console.log(response)
                })
            })
        },
        inject(code) {
            this.setActive('tab')
            const self = this
            return new Promise(resolve => {
                chrome.tabs.executeScript(self.tabId, {
                    "code": code
                }, async result => {
                    resolve(result)
                })
            })
        },
        injectJsFile() {
            const self = this
            return new Promise(resolve => {
                chrome.tabs.executeScript(self.tabId, {
                    "file": 'inject.js'
                }, async result => {
                    resolve(result)
                })
            })
        },
        watchTab() {
            const self = this
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                console.log(tabId, info)
                if (tabId == self.tabId) {
                    if (info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener)
                        self.fetchCount++
                        self.injectJsFile()
                    } else if (info.status === 'loading') {
                        self.url = info.url
                    }
                }
            })
        },
        removeCookies(domain) {
            function extrapolateUrlFromCookie(cookie) {
                var prefix = cookie.secure ? "https://" : "http://";
                if (cookie.domain.charAt(0) == ".")
                    prefix += "www";

                return prefix + cookie.domain + cookie.path;
            }
            return new Promise(resolve => {
                chrome.windows.getCurrent((result) => {
                    if (result.incognito) {
                        chrome.cookies.getAll({}, function(cookies) {
                            cookies.forEach(function(cookie, index) {
                                chrome.cookies.remove({ url: extrapolateUrlFromCookie(cookie), name: cookie.name });
                            })
                            resolve(true)
                        })
                    } else {
                        resolve(true)
                    }
                })
            })
        },
        out(val) {
            this.output = val
        },
        async evaluate() {
            const range = (start, stop, step = 1) => Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
            const pick = (array) => { return array[Math.floor(Math.random() * array.length)]; }
            const sleep = (seconds) => { return new Promise((resolve) => setTimeout(resolve, seconds * 1000)) }
            const go = this.go
            const inject = this.inject
            const extract = this.extractFromCopy
            const extractList = this.extractListFromCopy
            const click = this.clickOn
            const insert = this.insertOn
            const out = (o) => { this.output = JSON.stringify({ ...JSON.parse(this.output ? this.output : '{}'), ...o }, undefined, 4) }
            const reset = () => { this.output = '{}' }
            const already = (key) => {
                return Object.keys(JSON.parse(this.output ? this.output : '{}')).filter(item => item == key).length
            }
            this.removeCookies()
                .then(() => {
                    eval(`async function main(){${this.code} } main()`)
                })
        }
    },
    beforeCreate() {
        const self = this
        self.overlay = true
        chrome.storage.sync.get(['scripts'], result => {
            if (result['scripts']) {
                self.scripts = result['scripts']
                chrome.storage.local.get([this.id], (result) => {
                    this.output = Object.keys(result).length ? result[this.id] : '{}'
                })
            }
            self.overlay = false
        });
        const code = `(() => {
            let el = document.getElementById('e8s9c1uam4my6s4k7u7k')
            if (el) {
                return Boolean(el.outerHTML)
            } else {
                return false
            }
        })();`
        setInterval(() => {
            if (self.tabId) {
                self.getTabInfo().then((info) => {
                    if (info.length) {
                        if (!self.editUrl) { self.url = info[0].url ? info[0].url : undefined }
                        chrome.tabs.executeScript(self.tabId, {
                            code: code
                        }, result => {
                            if (!result[0]) {
                                self.injectJsFile()
                            }
                        })
                    } else {
                        self.tabId = undefined
                        self.url = undefined
                    }
                })
            }
        }, 1000)
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
                    case 114: // f3
                        self.code = beautify(self.code, { indent_size: 4, space_in_empty_paren: true })
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
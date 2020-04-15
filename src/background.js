global.browser = require('webextension-polyfill')

var tabExt = null

chrome.tabs.query({ url: chrome.extension.getURL("index.html") }, function(tabs) {
    tabs.forEach(function(element, index) {
        tabExt = element.id
    })
})

const openExt = function() {
    if (tabExt != null) {
        chrome.tabs.update(tabExt.id, { selected: true })
        chrome.windows.update(tabExt.windowId, { focused: true })
        return false
    }
    chrome.tabs.create({ url: chrome.extension.getURL("index.html") }, function(tab) {
        tabExt = tab
        var onRemoved_callback = function(tabId) {
            if (tabId == tabExt.id) {
                tabExt = null
                chrome.tabs.onRemoved.removeListener(onRemoved_callback)
            }
        }
        chrome.tabs.onRemoved.addListener(onRemoved_callback)
    })
}

chrome.browserAction.onClicked.addListener(openExt)


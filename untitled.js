const code = (() => {
                try {
                    let timeout = false
                    setTimeout(() => {
                        timeout = true
                    }, 10 * 1000)
                    const interval = setInterval(() => {
                        if (timeout) {
                            clearInterval(interval)
                        } else {
                            const el = document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
                            if(el) {
                                el.value = '${value}'
                            }
                        }
                    }, 100)
                    return true;
                } catch {
                    return false;
                }
            })();
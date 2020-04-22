window.addEventListener('beforeunload', () => { localStorage.clear(); })
const e8s9c1uam4my6s4k7u7kreadyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {

        clearInterval(e8s9c1uam4my6s4k7u7kreadyStateCheckInterval);

        if (!document.getElementById('e8s9c1uam4my6s4k7u7k')) {

            const containerStyle = `all:initial;position:fixed;top:0;left:0;right:0;background-color:white;border:1px solid grey;z-index: 10000000000;`
            const textareaStyle = `all:initial;width:100%;border-top:1px solid grey;padding: 1px 2px 1px 2px;`
            const xpathStyle = `padding: 2px;`
            document.body.innerHTML += `
            <div id="e8s9c1uam4my6s4k7u7k" style="${containerStyle}">
                <div>
                    <div id="a8s9c1uam4my6s4k7u7k" data-info="" style="${xpathStyle}"></div>
                    <textarea id="c8s9c1uam4my6s4k7u7k" rows="4" style="${textareaStyle}"></textarea>
                </div>
            </div>`.trim()

            document.onmouseover = function(event) {
                function getPathTo(element) {
                    if (element.id !== '')
                        return `//*[@id="${element.id}"]`

                    if (element === document.body)
                        return 'html/' + element.tagName.toLowerCase();

                    var ix = 0;
                    var siblings = element.parentNode.childNodes;
                    for (var i = 0; i < siblings.length; i++) {
                        var sibling = siblings[i];

                        if (sibling === element) return getPathTo(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';

                        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                            ix++;
                        }
                    }
                }
                if (event === undefined) event = window.event; // IE hack
                var target = 'target' in event ? event.target : event.srcElement; // another IE hack

                var root = document.compatMode === 'CSS1Compat' ? document.documentElement : document.body;
                let info = target.innerText.replace(/(\r\n|\n|\r)/gm, " ").trim()
                info = info.length <= 50 ? info : info.substring(0, 50) + '...';
                document.getElementById("a8s9c1uam4my6s4k7u7k").setAttribute('data-info', info)
                document.getElementById("a8s9c1uam4my6s4k7u7k").innerText = getPathTo(target)
            }

            document.onkeydown = function(e) {
                e = e || window.event; //Get event
                if (e.ctrlKey) {
                    var c = e.which || e.keyCode; //Get key code
                    switch (c) {
                        case 88: // x
                            /*copy to clipboard */
                            const xpath = document.getElementById("e8s9c1uam4my6s4k7u7k").innerText;
                            const info = document.getElementById("a8s9c1uam4my6s4k7u7k").getAttributeNode("data-info").value
                            var dummy = document.createElement("textarea");
                            document.body.appendChild(dummy);
                            dummy.value = xpath
                            dummy.select();
                            document.execCommand("copy");
                            document.body.removeChild(dummy);
                            /*insert to notes */
                            document.getElementById("c8s9c1uam4my6s4k7u7k").value += info + ' : ' + xpath + '\n'
                            /* flash */
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style.backgroundColor = 'red';
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style.color = 'white';
                            setTimeout(() => {
                                document.getElementById("e8s9c1uam4my6s4k7u7k").style.backgroundColor = 'white';
                                document.getElementById("e8s9c1uam4my6s4k7u7k").style.color = 'initial';
                            }, 200);
                            break
                        case 38: // up
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style['bottom'] = 'initial';
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style['top'] = '0';
                            break
                        case 40: // down
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style['bottom'] = '0';
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style['top'] = 'initial';
                            break
                    }
                }
            }
        }
    }
}, 10);
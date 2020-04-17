e8s9c1uam4my6s4k7u7kreadyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
        clearInterval(e8s9c1uam4my6s4k7u7kreadyStateCheckInterval);
        if (!document.getElementById('e8s9c1uam4my6s4k7u7k')) {
            document.body.innerHTML += '<yyjhpz39vgwujkvhijx1 id="e8s9c1uam4my6s4k7u7k"></yyjhpz39vgwujkvhijx1>'
        }

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
            document.getElementById("e8s9c1uam4my6s4k7u7k").innerText = getPathTo(target);
        }

        document.onkeydown = function(e) {
            e = e || window.event; //Get event
            if (e.ctrlKey) {
                var c = e.which || e.keyCode; //Get key code
                switch (c) {
                    case 88: // x
                        var dummy = document.createElement("textarea");
                        document.body.appendChild(dummy);
                        dummy.value = document.getElementById("e8s9c1uam4my6s4k7u7k").innerText;
                        dummy.select();
                        document.execCommand("copy");
                        document.body.removeChild(dummy);
                        document.getElementById("e8s9c1uam4my6s4k7u7k").style.backgroundColor = 'red';
                        document.getElementById("e8s9c1uam4my6s4k7u7k").style.color = 'white';
                        setTimeout(() => {
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style.backgroundColor = 'white';
                            document.getElementById("e8s9c1uam4my6s4k7u7k").style.color = 'initial';
                        }, 200);
                        break
                }
            }
        }
        e8s9c1uam4my6s4k7u7k_state = 'injected'
    }
}, 10);
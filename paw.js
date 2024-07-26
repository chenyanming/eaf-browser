// document.addEventListener('keydown', async function(e) {
//     if (e.key === "s") {
//         console.log("hello world");
//         console.log("'s' key was pressed");
//         send_to_paw();
//     }
// });
console.log("Hello from paw.js");


function paw_annotation_mode(words) {

    // document.addEventListener('mouseup', async function(e) {
    //     var selection = window.getSelection().toString().trim();
    //     if (selection.length > 0) { // If some text is selected
    //         console.log('Selected text: ' + selection);
    //         window.pyobject.paw_view_note(paw_new_entry());
    //     }
    // }, true);


    setTimeout(function() {
        if (typeof jQuery !== 'undefined') {
            monitor_and_close_premium_popup();
            enalbe_clickable_word();
            init(words);
        }
        if (typeof QWebChannel !== 'undefined') {
            new QWebChannel(qt.webChannelTransport, channel => {
                window.pyobject = channel.objects.pyobject;
            });
        }
    }, 50);


}

// function send_to_paw(selectedNode) {
//     var selection;
//     if (selectedNode !== undefined) {
//         selection = selectedNode.textContent;
//     } else {
//         selection = window.getSelection().toString();
//     }
//     console.log("send_to_paw", selection);
//     if (selection.length > 0 && paw_annotation_mode_mouse) {
//         var url = encodeURIComponent(window.location.href);
//         var title = encodeURIComponent(document.title || "[untitled page]");
//         var body = encodeURIComponent(selection);
//         var parent;
//         if (window.location.hostname === 'www.lingq.com')  {
//             parent = selectedNode.parentNode;
//         } else {
//             var range = window.getSelection().getRangeAt(0);
//             parent = range.commonAncestorContainer.parentNode;
//         }

//         var note = encodeURIComponent(parent.textContent || "");
//         location.href = 'org-protocol://paw?template=w&url=' + url + '&title=' + title + '&note=' + note + '&body=' + body;
//     }
// }

function paw_new_entry(selectedNode) {
    console.log("paw_new_entry", selectedNode);
    var selection;
    if (selectedNode !== undefined) {
        // get the passed node textContent directly
        selection = selectedNode.textContent;
    } else {
        // get the selected node textContent
        selection = window.getSelection().toString();
    }
    if (selection.length > 0) {
        var url = window.location.href;
        var title = document.title || "[untitled page]";
        var body = selection;
        var parent;
        if (selectedNode !== undefined) {
            // use the passed node's parentNode directly
            parent = selectedNode.parentNode;
        } else {
            // get the selected node's parentNode
            parent = window.getSelection().getRangeAt(0).commonAncestorContainer.parentNode;
        }

        // get a element node first
        while (parent.nodeType !== Node.ELEMENT_NODE) {
            parent = parent.parentNode;
        }

        // skip clicabble-word and get until p tag
        while (parent.className === 'clickable-word' || parent.tagName !== 'P') {
            parent = parent.parentNode;
        }

        var note = parent.textContent || "";
        var data = {
            "url": url,
            "title": title,
            "note": note,
            "body": body
        };

        return data;
    } else {
        return "";
    }
}

var s = document.createElement("script");
s.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js";
s.onload = function(e){ /* now that its loaded, do something */ };
document.head.appendChild(s);

// Your CSS as text
var styles = `
    .xqdd_highlight_disable {

    }

    .xqdd_highlight_new_word {
        background-color: #ffe895;
    }


    .xqdd_bubble {
        background-color: #FFE4C4;
        flex-direction: column;
        width: 200px;
        align-items: center;
        position: fixed;
        display: none;
        z-index: 1000000;
    }
    .xqdd_bubble_word{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        word-break: break-all;
    }

    .xqdd_bubble_word .xqdd_bubble_trans {
        width: auto;
        height: auto;
    }

    .xqdd_bubble_delete {
        position: absolute;
        color: rgba(255, 255, 255, 0.6);
        right: 2px;
        top: 0;
        cursor: pointer;
    }

    .xqdd_bubble_delete:hover {
        background-color: #e81123;
        color: white;
    }
`;

var styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

var initSettings = {
    toggle: true,
    ttsToggle: true,
    ttsVoices: {
        lang: "en",
    },
    highlightBackground: "#FFFF0010",
    highlightText: "",
    bubbleBackground: "#FFE4C4",
    bubbleText: "",
    syncTime: 0,
    //生词本类型，0有道,1欧路
    dictionaryType: 0,
    autoSync: true,
    cookie: false,
};


//生词本
var newWords;
//当前要显示的节点
var currNode;
//鼠标节点（实时）
var mouseNode;
//已经显示了的节点
var showedNode;
//是否允许隐藏气泡
var isAllowHideBubble = true;
//气泡显示/隐藏延迟时间(ms)
var delayed = 100;
//生词信息列表
var currWord;
var currWordData;


/**
 * 初始化
 */
function init(words) {
    //从localstorege获取生词列表，高亮所有匹配的节点
    // var before = new Date().getTime()
    // newWords = {
    //     wordInfos: {
    //         police: {
    //             word: "police",
    //             phonetic: "[halo]",
    //             trans: "你好",
    //         }
    //     }

    // };
    newWords = words;
    // console.log(newWords);

    // renable the new word css if it exists
    $(`xqdd_highlight_new_word`).attr("class", "xqdd_highlight_new_word");

    highlight(textNodesUnder(document.body));
    //console.log("解析总耗时：" + (new Date().getTime() - before) + " ms")
    console.log("Highlight done");

    //在插入节点时修改
    document.addEventListener("DOMNodeInserted", onNodeInserted, false);
    setStyle(initSettings);

    console.log("setStyle done");

    //创建鼠标悬浮气泡
    createBubble();
    console.log("createBubble done");


}

/*
 * Hide the word
 */
function paw_delete_word(word) {
    //取消高亮删除的单词
    $(`xqdd_highlight_new_word[word='${word}']`).attr("class", "xqdd_highlight_disable");
}


/**
 * Disable paw-annotation-mode
 */
function paw_annotation_mode_disable() {

    // Disable sentence item click listener
    disable_clickable_word();

    //取消所有高亮
    console.log('disable paw-annotation-mode');
    $(`xqdd_highlight_new_word`).attr("class", "xqdd_highlight_disable");
}

/**
 * 创建鼠标悬浮气泡
 */
function createBubble() {
    //创建添加到body中
    var div = $("<div>").attr("class", "xqdd_bubble");
    var deleteButton = $("<span>")
        .attr("class", "xqdd_bubble_delete")
        .text("✖")
        .click(() => {
            if (window.confirm("确认删除单词？（若已登录云端，云端单词会同时删除）")) {
                // chrome.runtime.sendMessage({type: "delete", wordData: currWordData}, function (msg) {
                //     //取消高亮删除的单词
                //     $(`xqdd_highlight_new_word[word='${currWordData.word}']`).attr("class", "xqdd_highlight_disable")
                //     if (msg) {
                //         // alert(msg)
                //     }
                // })
            }
        });
    var word = $("<span>").attr("class", "xqdd_bubble_word");
    var trans = $("<span>").attr("class", "xqdd_bubble_trans");
    div.append(deleteButton).append(word).append(trans);
    $(document.body).append(div);

    //添加鼠标进入离开事件
    div.on("mouseleave", function (e) {
        hideBubbleDelayed();
    });
    div.on("mouseenter", function (e) {
        isAllowHideBubble = false;
    });

    //监听鼠标位置
    document.addEventListener("mousemove", handleMouseMove, false);
    // document.addEventListener("mousedown", hideBubble(), false)

    //监听窗口滚动
    window.addEventListener("scroll", function () {
        isAllowHideBubble = true;
        hideBubble();
    });
}

/**
 * 显示气泡
 */
function showBubble() {
    if (!!currNode) {
        var bubble = $(".xqdd_bubble");
        if (showedNode != currNode || bubble.css("display") != "flex") {
            var nodeRect = currNode.getBoundingClientRect();
            var word = $(currNode).text();
            var wordInfo = newWords.wordInfos[word.toLowerCase()];
            $(".xqdd_bubble_word").html((wordInfo.link ? wordInfo.link : wordInfo.word) + "  " + `<span>${wordInfo["phonetic"]}</span>`);
            $(".xqdd_bubble_trans").html(wordInfo["trans"]);
            currWord = wordInfo["word"];
            currWordData = wordInfo;
            bubble
                .css("top", nodeRect.bottom + 'px')
                .css("left", Math.max(5, Math.floor((nodeRect.left + nodeRect.right) / 2) - 100) + 'px')
                .css("display", 'flex');
            // chrome.runtime.sendMessage({type: "tts", word});
            showedNode = currNode;
        }
    }
}

/**
 * 处理鼠标移动
 * @param e
 */
function handleMouseMove(e) {
    //获取鼠标所在节点
    mouseNode = document.elementFromPoint(e.clientX, e.clientY);
    if (!mouseNode) {
        hideBubbleDelayed(mouseNode);
        return;
    }
    var classAttr = "";
    try {
        classAttr = mouseNode.getAttribute("class");
    } catch (exc) {
        hideBubbleDelayed(mouseNode);
        return;
    }
    if (!classAttr || !classAttr.startsWith("xqdd_")) {
        hideBubbleDelayed(mouseNode);
        return;
    }
    isAllowHideBubble = false;
    if (!classAttr.startsWith("xqdd_highlight_new_word")) {
        return;
    }
    currNode = mouseNode;
    //延迟显示（防止鼠标一闪而过的情况）
    setTimeout(function () {
        //是本节点
        if (currNode == mouseNode) {
            showBubble();
        }
        //非本节点
        else if ($(mouseNode).attr("class") && !$(mouseNode).attr("class").startsWith("xqdd_")) {
            isAllowHideBubble = true;
        }
    }, delayed);
}

/**
 * 延迟隐藏气泡
 */
function hideBubbleDelayed(mouseNode) {
    if (!isAllowHideBubble) {
        if (mouseNode) {
            if ($(mouseNode).parents(".xqdd_bubble").length > 0) {
                return;
            }
        }
        isAllowHideBubble = true;
        setTimeout(function () {
            hideBubble();
        }, delayed);
    }
}


/**
 * 隐藏气泡
 */
function hideBubble() {
    if (isAllowHideBubble) {
        $(".xqdd_bubble").css("display", "none");
    }
}

/**
 *
 * @param nodes 高亮所有节点
 *
 */
function highlight(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var text = node.textContent;
        if (text.trim() == "") {
            continue;
        }
        //处理单个节点
        //新节点的内容
        var newNodeChildrens = highlightNode(text);
        var parent_node = node.parentNode;
        //替换新节点
        if (newNodeChildrens === undefined || newNodeChildrens.length == 0) {
            continue;
        } else {
            console.log(newNodeChildrens);
        }
        //处理a标签显示异常
        if (parent_node.tagName.toLowerCase() == "a") {
            parent_node.style.display = "inline-block";
            parent_node.style.margin = "auto";
        }
        for (var j = 0; j < newNodeChildrens.length; j++) {
            parent_node.insertBefore(newNodeChildrens[j], node);
        }
        parent_node.removeChild(node);
    }


}

/**
 * 高亮单个节点
 * @param text
 */
function highlightNode(texts) {
    // console.log("highlightNode");
    // return [$("<span>").css("background", "red").text(texts)[0]]
    //将句子解析成待检测单词列表
    var words = [];
    //使用indexof
    //  var tempTexts = texts
    // while (tempTexts.length > 0) {
    //     tempTexts = tempTexts.trim()
    //     var pos = tempTexts.indexOf(" ")
    //     if (pos < 0) {
    //         words.push(tempTexts)
    //         break
    //     } else {
    //         words.push(tempTexts.slice(0, pos))
    //         tempTexts = tempTexts.slice(pos)
    //     }
    // }

    var tempTexts = [];
    if (window.location.hostname === 'www.lingq.com') {
        // 使用split, by space
        texts.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        tempTexts = texts.split(/\s/);
    } else {
        // By word, more accurate, can handle nhk
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
        const segmenter = new Intl.Segmenter([], { granularity: 'word' });
        const segmentedText = segmenter.segment(texts);
        tempTexts = [...segmentedText].filter(s => s.isWordLike).map(s => s.segment);
    }
    // console.log(tempTexts)
    for (i in tempTexts) {
        var tempText = tempTexts[i].trim();
        if (tempText != "") {
            words.push(tempText);
        }
    }

    if (words.length >= 1) {
        //处理后结果
        var newNodeChildrens = [];
        //剩下未处理的字符串
        var remainTexts = texts;
        //已处理部分字符串
        var checkedText = "";
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            //当前所处位置
            var currPos = remainTexts.indexOf(word);
            //匹配单词
            // if (newWords.indexOf(word.toLowerCase()) !== -1) {
            // console.log(newWords);
            if (newWords && newWords.wordInfos && newWords.wordInfos.hasOwnProperty(word.toLowerCase())) {
                // console.log(newWords.wordInfos);
                //匹配成功
                //添加已处理部分到节点
                if (checkedText != "") {
                    newNodeChildrens.push(document.createTextNode(checkedText));
                    checkedText = "";
                }
                if (currPos == 0) {
                    // wordxx类型
                    newNodeChildrens.push(hightlightText(word));
                } else {
                    //xxwordxx类型
                    // var preText = remainTexts.slice(0, currPos)
                    // if (i == 0 && preText.trim() == " ") {
                    //     //处理<xx> <xxx>之间的空格问题
                    //     newNodeChildrens.push($("<span>").text(preText)[0])
                    // } else {
                    newNodeChildrens.push(document.createTextNode(remainTexts.slice(0, currPos)));
                    // }
                    newNodeChildrens.push(hightlightText(word));
                }
                // chrome.runtime.sendMessage({type: "count", word})
            } else {
                //匹配失败，追加到已处理字符串
                checkedText += remainTexts.slice(0, currPos + word.length);
            }
            //删除已处理的字符(到当前单词的位置)
            remainTexts = remainTexts.slice(currPos + word.length);
        }
        //处理最末尾
        if (newNodeChildrens.length != 0) {
            if (checkedText != "") {
                newNodeChildrens.push(document.createTextNode(checkedText));
            }
            newNodeChildrens.push(document.createTextNode(remainTexts));
        }
    }
    return newNodeChildrens;
}


/**
 * 高亮单个单词
 * @param text
 * @returns {*}
 */
function hightlightText(text) {
    // console.log("hightlightText");
    //注意jqury对象转为dom对象使用[0]或者.get(0)
    return $("<xqdd_highlight_new_word>")
        .attr("word", text.toLowerCase())
        .attr("class", "xqdd_highlight_new_word")
        .text(text)[0];
}


/**
 * 过滤所有文本节点
 * @param el
 * @returns {Array}
 */
function textNodesUnder(el) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
    var n, a = [],
        walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, mygoodfilter, false);
    while (n = walk.nextNode()) {
        a.push(n);
    }
    return a;
}


/**
 * 节点过滤器
 * @param node
 * @returns {number}
 */
function mygoodfilter(node) {
    var good_tags_list = [
        "PRE",
        "A",
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "B",
        "SMALL",
        "STRONG",
        "Q",
        "DIV",
        "SPAN",
        "LI",
        "TD",
        "OPTION",
        "I",
        "BUTTON",
        "UL",
        "CODE",
        "EM",
        "TH",
        "CITE",
        "RUBY" // nhk.com
    ];
    if (good_tags_list.indexOf(node.parentNode.tagName) !== -1) {
        return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
}

/**
 * 节点插入时判断高亮
 * @param event
 */
function onNodeInserted(event) {
    var inobj = event.target;
    if (!inobj)
        return;
    if ($(inobj).parents(".xqdd_bubble").length > 0) {
        return;
    }
    var classattr = null;
    if (typeof inobj.getAttribute !== 'function') {
        return;
    }
    try {
        classattr = inobj.getAttribute('class');
    } catch (e) {
        return;
    }
    if (!classattr || !classattr.startsWith("xqdd")) {
        highlight(textNodesUnder(inobj));
    }
}


function setStyle(result) {
    let highlightCss = ".xqdd_highlight_new_word {background-color: " + result.highlightBackground + ";";
    let bubbleCss = ".xqdd_bubble {background-color: " + result.bubbleBackground + ";";
    if (result.highlightText.trim() !== "") {
        highlightCss += "color:" + result.highlightText + ";";
        bubbleCss += "color:" + result.bubbleText + ";";
    }
    highlightCss += "}";
    bubbleCss += "}";
    // chrome.tabs.insertCSS(null, {code: highlightCss + bubbleCss});
}

/**
 * LingQ specific functions
 *
 */

/**
 * Close lingq Go Premium button
 */
function monitor_and_close_premium_popup () {
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                var modalContainer = $(".modal-container");
                if (modalContainer.length > 0) {
                    if (modalContainer.find(".button.is-white.is-rounded.has-icon.is-small")[0] !== undefined) {
                        $(".modal-container").find(".button.is-white.is-rounded.has-icon.is-small")[0].click();
                    }
                }
                var readerWidget = $(".reader-widget");
                if (readerWidget.length > 0) {
                    if (readerWidget.find(".button.widget-close-trigger")[0] !== undefined) {
                        $(".reader-widget").find(".button.widget-close-trigger")[0].click();
                    }
                }

            }
        });
    });
    var config = { attributes: true, childList: true, subtree: true };
    observer.observe(document.body, config);
}

var lingqIsSelectedObserver; // Define in a scope accessible by both functions
/**
 * when single click the sentence item, send to paw
 */
function enalbe_clickable_word() {
    // let script = document.createElement('script');
    // script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
    // script.type = 'text/javascript';
    // document.getElementsByTagName('head')[0].appendChild(script);
    if (window.location.hostname === 'www3.nhk.or.jp') {
        $("span").filter(function() {
            return this.className.match(/color\w/);
        }).addClass("clickable-word");

    } else if (window.location.hostname === 'www.lingq.com') {
        lingqIsSelectedObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    var targetElement = mutation.target;
                    if (targetElement.tagName.toLowerCase() === 'span' && targetElement.classList.contains('is-selected')) {
                        // console.log(targetElement);
                        window.pyobject.paw_view_note(paw_new_entry(targetElement));
                    }
                }
            });
        });
        lingqIsSelectedObserver.observe(document.body, { attributes: true, subtree: true });
    } else {
        $("p").each(function() {
            let paragraphText = $(this).text();
            let segmenter = new Intl.Segmenter([], { granularity: 'word' });
            let segmentedResult = segmenter.segment(paragraphText);
            let wrappedText = "";
            for(let {segment} of segmentedResult) {
                if (segment.trim() !== "") { // Exclude spaces
                    wrappedText += `<span class='clickable-word'>${segment}</span>`;
                } else {
                    wrappedText += segment;
                }
            }
            $(this).html(wrappedText);

        });
    }

    $('.clickable-word').click(function() {
        var selection = window.getSelection(),
            range = document.createRange();
        range.selectNodeContents(this);
        selection.removeAllRanges();
        selection.addRange(range);
        window.pyobject.paw_view_note(paw_new_entry());
    });

    $(".clickable-word").on({
        mouseover: function() {
            $(this).css("text-decoration", "underline");
        },
        mouseout: function() {
            $(this).css("text-decoration", "none");
        }
    });
}

function disable_clickable_word() {
    $(".clickable-word").off("click mouseover mouseout").css("background-color", "");
    if (lingqIsSelectedObserver) {
        lingqIsSelectedObserver.disconnect();
    }
}

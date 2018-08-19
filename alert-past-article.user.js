// ==UserScript==
// @name         Alert Past Article
// @namespace    https://github.com/klim0824/
// @version      0.1
// @description  Alert if a displayed Japanese article is published or modified more than 30 days ago.
// @author       klim
// @match        https://www.asahi.com/articles/*
// @match        https://www.nikkei.com/article/*
// @match        https://www.jiji.com/jc/article?k=*
// @match        https://www.lifehacker.jp/*
// @grant        none
// @noframes
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js
// ==/UserScript==

(function () {
    'use strict';

    const convertIsoToTimestamp = (iso) => {
        return moment(iso).unix();
    };
    const combinedRegex = (patterns,option='') => {
        return new RegExp('(' + patterns.join(')|(') + ')', option);
    };

    const getJsonLd = () => {
        const selector = 'script[type="application/ld+json"]';
        const nodesInJsonLd = document.querySelectorAll(selector);

        let jsonLd;
        for (const node of nodesInJsonLd.values()) {
            const parsedJsonLd = JSON.parse(node.innerText);
            console.log(parsedJsonLd);
            const patterns = [ "NewsArticle", "Article" ];
            if (combinedRegex(patterns, 'gi').test(parsedJsonLd["@type"])) {
                jsonLd = parsedJsonLd;
                break;
            }
        }
        if (jsonLd) {
            return jsonLd;
        }
    };

    const selectNewerDate = () => {
        let modifiedDate;
        let publishedDate;
        if (!getJsonLd()) {
            return false;
        }
        else {
            modifiedDate = convertIsoToTimestamp(getJsonLd().dateModified);
            publishedDate = convertIsoToTimestamp(getJsonLd().datePublished);
        }

        if (!modifiedDate && !publishedDate) {
            return false;
        }
        else if (!modifiedDate) {
            return publishedDate;
        }
        else if (!publishedDate) {
            return modifiedDate;
        }
        else {
            return Math.max(modifiedDate, publishedDate);
        }
    };

    const compareDateWithPresentTime = (timestampInArticle, days) => {
        const presentTime = moment();
        let articleTime;
        if (timestampInArticle) {
            articleTime = moment.unix(timestampInArticle);
        }
        if (articleTime) {
            return presentTime.diff(articleTime, 'days') > days;
        }
    };

    const isAnniversary = () => {
        const patterns = [ "今日は何の日", "年の今日", "【アーカイブ】" ];
        return combinedRegex(patterns, 'gi').test(document.title);
    };

    if (isAnniversary()) {
        alert("過去の出来事に関する記事かもしれません。");
        return;
    }

    if (compareDateWithPresentTime(selectNewerDate(), 30)) {
        alert("過去記事の可能性があります！日付を要チェック！")
    } else {
        console.log("recently or not detected");
    }

})();
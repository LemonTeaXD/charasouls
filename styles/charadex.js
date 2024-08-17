/* ==================================================================== */
/* Debug
=======================================================================  /

    This is for me to help you!
    

======================================================================= */
const cheeDebug = {

}




/* ==================================================================== */
/* Load Header and Footer
======================================================================= */
$(function () {
    $(".load-html").each(function () { $(this).load(this.dataset.source) });
});



/* ==================================================================== */
/* URLs
=======================================================================  /

    You can use this method to grab these URLs at any time

    console.log(createUrl.fullUrl);
    console.log(createUrl.addParams(createUrl.pageUrl, {'design': 'CHA0001'}));
    
======================================================================= */
    
    const createUrl = {

        fullUrl: new URL(window.location.href).href,
        params: new URLSearchParams(window.location.search),

        set pageUrl(page) {
            return `${this.fullUrl.replace(/\/[^\/]+$/, "")}/${page}`;
        },

        get noParams() {
            return this.fullUrl.split('?')[0];
        },

        addParams(url, obj) {

            // Make the object into some cute params
            let params = '';
            for (let k in obj) params += `&${scrub(k)}=${scrub(obj[k])}`;

            //If the URL doesn't have parameters, we need to
            // changed the first & into a ? so the parameters work
            if (!url.includes('?')) params = '?' + params.substring(1);

            return url + params;

        }

    }



/* ==================================================================== */
/* Get Sheet Data
=======================================================================  /

    
    

======================================================================= */

    const fetchSheet = async (opt) => {

        // Some checks
        if (!opt.sheetID) return alert('Sheet ID not added.');
        if (!opt.sheetPage) return alert('There is no sheet page.');

        // Build the sheet link and fetch the data
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${opt.sheetID}/gviz/tq?tqx=out:json&headers=1&tq=WHERE A IS NOT NULL&sheet=${opt.sheetPage}`;

        // Try to fetch the data
        const sheetData = await fetch(sheetUrl).then((response) => {
            if (response.ok) return response.text();
            Promise.reject(response);
        }).catch((e) => {
            if (e) return false;
        });

        // If there's data, return it
        if (sheetData || !['[]', '{}'].includes(sheetData)) return scrubData(sheetData, opt);

        // Else let them know something's wrong
        alert('No sheet information was found. Please make sure your sheet is public.');
        return false;

    };


    const scrubData = (data, opt) => {

        // Parse through it and remove the nasty bits
        const parsedJSON = JSON.parse(data.substring(47).slice(0, -2));

        // Grab column headers
        const col = [];
        if (parsedJSON.table.cols[0].label) {
            parsedJSON.table.cols.forEach((headers) => { if (headers.label) col.push(scrub(headers.label)); });
        }

        // Scrubs columns and puts them in a readable object
        const scrubbedData = [];
        parsedJSON.table.rows.forEach((info, num) => {
            const row = {};
            const isBoolean = val => 'boolean' === typeof val;
            col.forEach((ele, ind) => {
                row[ele] = info.c[ind] != null ? info.c[ind].f != null && !isBoolean(info.c[ind].v) ? info.c[ind].f : info.c[ind].v != null ? info.c[ind].v : "" : "";
            });
            scrubbedData.push(row);
        });

        // Get rid of anything that needs to be hidden
        let publicData = scrubbedData.filter((i) => {
            return i['hide'] !== true;
        });

        // Add the card link
        if (opt.fullDex && opt.pageKey) {
            for (var i in publicData) {
                publicData[i].cardlink = createUrl.addParams(createUrl.noParams,{[opt.pageKey]:publicData[i][opt.pageKey]});
            }
        }

        return publicData;

    }



/* ================================================================ */
/* QOL Funcs
/* ================================================================ */

    // Just makes everything easier to compare
    const scrub = (key) => {
        return !key ? key : key.toString().toLowerCase().replace(/\s/g, "");
    };

    // Makes your params into options
    const addFilterOptions = (opt) => {
        let select = [];
        opt.forEach((v) => {select.push($("<option></option>").val(scrub(v)).html(v))});
        return select;
    };


    const keyValCheck = (k, v) => {
        return scrub(k) === scrub(v);
    }

    const addAll = (key) => {
        key.unshift("All")
        return key;
    };

    const loadPage = () => {
        $('#loading').hide();
        $('.softload').addClass('active');
    };



/* ================================================================ */
/* Create ListJS Keys
/* If your keys has image or link in the name, it'll make them
/* into a special key so you dont have to
/* ================================================================ */
    
    let createListKeys = (arr, card = false) => {

        let itemArray = card ? Object.keys(arr) : Object.keys(arr[0]);
        let itemArrayLength = itemArray.length;

        let newArray = [];
        for (let i = 0; i < itemArrayLength; i++) {
            if (itemArray[i].includes('image')) {
                newArray[itemArray.indexOf(itemArray[i])] = { name: itemArray[i], attr: 'src' };
            } else if (itemArray[i].includes('link')) {
                newArray[itemArray.indexOf(itemArray[i])] = { name: itemArray[i], attr: 'href' }
            } else {
                newArray[i] = itemArray[i];
            };
        }

        return newArray;

    };



/* ================================================================ */
/* Create ListJS Options
/* Because we don't want to repeat them everytime
/* ================================================================ */

    const createListOptions = (opt, card = false) => {

        let options = {
            item: card ? opt.listItemSingle : opt.listItemGallery,
            valueNames: createListKeys(card ? opt.card : opt.arr),
        }

        if (card && opt.search) {
            options.searchColumns = opt.searchFilterParams;
        }

        if (card && opt.pagination) {
            options.page = opt.itemAmount;
            options.pagination = [{
                innerWindow: 1,
                left: 1,
                right: 1,
                item: `<li class='page-item'><a class='page page-link'></a></li>`,
                paginationClass: 'pagination-top',
            }];
        }

        return options;

    }


/* ================================================================ */
/* Pagination
/* ================================================================ */

    const createPagination = (opt) => {

        if (!opt.pagination) return;

        $('.btn-next').on('click', () => {$('.pagination .active').next().children('a')[0].click()})
        $('.btn-prev').on('click', () => {$('.pagination .active').prev().children('a')[0].click()})

        if (opt.arr.length > opt.itemAmount) $('#charadex-pagination').show()

    }



/* ================================================================ */
/* Faux Folders Creator
/* ================================================================ */

    const createFauxFolders = (opt) => {

        if (!opt.fauxFolders) return;

        // Pull our keys and array
        let key = Object.keys(opt.fauxFoldersCol)[0];
        let arr = opt.fauxFoldersCol[key];
        key = scrub(key); // we're gonna go ahead and scrub it now
        
        // Create the buttons
        let buttons = [];
        arr.forEach((i) => {
            let butCol = $('#charadex-filter-buttons').clone();
            butCol.find('.btn').text(i).attr("href", createUrl.addParams(createUrl.noParams,{[key]:i}));
            buttons.push(butCol);
        });

        // Append them to the row and show them 
        $('#filter-buttons .row').append(buttons);
        $('#filter-buttons').show();

    };


    
/* ================================================================ */
/* Custom Filter
/* ================================================================ */

    const createfilterSelections = (opt) => {

        if (!opt.filters) return;

        let filters = opt.filterOptions;
        let newFilters = [];
        for (let k in filters) {
            let filCol = $("#filter").parent().clone();
            filCol.find('label').text(k);
            filCol.find('#filter')
            .addClass(`gallery-filter`)
            .attr('name', scrub(k))
            .append(addFilterOptions(opt.filterOptions[k]));
            newFilters.push(filCol);
        }

        $("#charadex-filters").find(".row").prepend(newFilters);
        $(".gallery-filter").parent().show();

        // Attempt to filter the array
        $('.gallery-filter').each(function () {
            $(this).on('change', function () {
                if ($(this).val()) {
                    opt.params.set($(this).attr('name'), $(this).val());
                    window.location.search = opt.params;
                }
            });
        });

        let filter = Object.fromEntries(opt.params);
        for (var k in filter) {
            $(`.gallery-filter[name='${k}']`).val(filter[k]).prop('selected', true);
        }

    }
    


/* ================================================================ */
/* Search Filter
/* Since the search is a built in function for List.JS it's
/* gon b a lil funkii
/* ================================================================ */

    let createSearch = (dex, opt) => {

        if (!opt.search) return;

        let arr = opt.searchParams.map(function(v){return scrub(v)});

        if (opt.searchParams && opt.searchParams.length > 1) {
            $('#search-filter').append(addFilterOptions(opt.searchParams));
            $('#search-filter').parent().show();
            $('#search').addClass('filtered');
        }

        $('#search').on('keyup', () => {
            let selection = $("#search-filter option:selected").val();
            let searchString = $('#search').val();
            if (selection && selection != 'all') {
                dex.search(searchString, [selection]);
            } else {
                dex.search(searchString, arr);
            }
        });

        $('#charadex-filters').show();

    };



/* ================================================================ */
/* Filter Gallery
/* ================================================================ */

    let filterGallery = (opt) => {
        
        let filters = Object.fromEntries(opt.params);

        let arr = opt.arr.filter((i) => {
            for (let k in filters) if (scrub(i[k]) === undefined || scrub(i[k]) != filters[k]) return false;
            return true;
        });

        return arr.length ? arr : opt.arr;

    }



/* ================================================================ */
/* Prev and Next Links
/* ================================================================ */

    const prevNextLinks = (opt) => {
    
        if ($("#entryPrev").length == 0) return;
    
        let key = opt.pageKey;
        let arr = opt.arr;
        let index = arr.map(function (i) {return i[key]}).indexOf(opt.arr[0][key]);

        let leftItem = arr[index - 1] ? arr[index - 1][key] : false;
        let rightItem = arr[index + 1] ? arr[index + 1][key] : false;
  
        // Prev
        if (leftItem) {
            $("#entryPrev").attr("href", createUrl.addParams(createUrl.noParams, {[key]:leftItem}));
            $("#entryPrev span").text(leftItem);
        } else {
            $("#entryPrev").hide();
        }
    
        // Next
        if (rightItem) {
            $("#entryNext").attr("href", createUrl.addParams(createUrl.noParams, {[key]:rightItem}));
            $("#entryNext span").text(rightItem);
        } else {
            $("#entryNext").hide();
        }
    
        // Back to masterlist (keeps species parameter)
        $('#prevNext').show();
    
    };



/* ================================================================ */
/* Create gallery or card based on preferences
/* They'll also return all your info in case you need to 
/* use it later
/* ================================================================ */

    const createGallery = (opt) => {

        // Create our parameter searches
        createFauxFolders(opt);
        createfilterSelections(opt);

        // Filter the gallery based on those
        opt.arr = filterGallery(opt);

        // Create our pagination
        createPagination(opt);

        // Initiallize the dex
        let dex = new List(opt.listContainer, createListOptions(opt), opt.arr);

        // Make the search nyoom
        createSearch(dex, opt);

        // Return everything
        return opt;
    
    }

    
    const createCard = (opt) => {

        // Render the prev/next links on profiles
        prevNextLinks(opt);

        // We want to assign to a card instead of overwriting
        // everything bc we are good boys
        opt.card = opt.arr.filter((i) => scrub(i[opt.pageKey]) === scrub(opt.params.get(opt.pageKey)));

        // List.js options
        let itemOptions = {
            valueNames: createListKeys(opt.card, true),
            item: 'charadex-card',
        };

        // Render card
        let dex = new List(
            opt.listContainer, 
            createListOptions(opt, true), 
            opt.card
        );

        // Return everything
        return opt;

    }



/* ================================================================ */
/* Get a card's log
/* ================================================================ */

    let getLog = (log, item, key = 'id') => {
        if ($("#log-table").length != 0) {

            let logArr = [];
            log.forEach((i) => {
                if (i[key].toLowerCase() === item[key].toLowerCase()) {
                    let newLog = {
                        timestamp: i.timestamp,
                        reason: i.reason,
                    };
                    logArr.push(newLog);
                };
            });

            // Create Rows
            let rows = [];
            logArr.forEach((i) => {
                let HTML = $("#log-entry").clone();
                HTML.find(".timestamp").html(i.timestamp);
                HTML.find(".reason").html(i.reason);
                rows.push(HTML);
            });

            $("#log-table").html(rows);

        }
    }
    
    
    
/* ==================================================================== */
/* Masterlist Only
======================================================================= */

    const charadex = async (v) => {

        // Grab our options
        const opt = charadexOptions.syncOptions(v);
        opt.params = createUrl.params;
    
        // Grab the information, if none, stop everything
        let sheetArr = await fetchSheet(opt);
        if (!sheetArr) return;
    
        // Now we're going to add the Array to our options so 
        // we can access data way easier
        opt.arr = sheetArr;
    
        // Build based on the page info
        if (!opt.params.has(opt.pageKey)) {
            let gallery = createGallery(opt)
        } else { 
            let card = createCard(opt);
        }
    
    };

    
/* ==================================================================== */
/* Masterlist Only
======================================================================= */
const masterlist = async (v) => {

    // Grab our options
    const opt = charadexOptions.syncOptions(v);
    opt.params = createUrl.params;

    // Grab the information, if none, stop everything
    let sheetArr = await fetchSheet(opt);
    if (!sheetArr) return;

    // Now we're going to add the Array to our options so 
    // we can access data way easier
    opt.arr = sheetArr;

    // If it's a gallery, build the gallery
    if (!opt.params.has(opt.pageKey)) {

        let gallery = createGallery(opt)

    } else { 
        
        let card = createCard(opt);

    }

};


/* ==================================================================== */
/* Inventories
======================================================================= */
const inventory = async (options) => {

    // Sort through options
    const charadexInfo = optionSorter(options);

    // Grab the sheet
    let sheetArray = await fetchSheet(charadexInfo.sheetPage);

    // Grab all our url info
    let cardKey = Object.keys(sheetArray[0])[0];
    let preParam = `?${cardKey}=`;

    // Put in alphabetical order
    sheetArray.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));

    // Add card links to the remaining array
    for (var i in sheetArray) { sheetArray[i].cardlink = pageUrl + preParam + sheetArray[i][cardKey]; }

    // Decide if the url points to profile or entire gallery
    if (urlParams.has(cardKey)) {

        // Fetch item info from the item sheet
        let itemSheetArr = await fetchSheet(charadexInfo.itemSheetPage);
        let itemCardKey = Object.keys(itemSheetArr[0])[0];

        // List.js options
        let itemOptions = {
            valueNames: createListKeys(sheetArray),
            item: 'charadex-card',
        };

        // Filter out the right card
        let singleCard = sheetArray.filter((i) => i[cardKey].includes(urlParams.get(cardKey)))[0];

        // Merge the user's inventory with the item sheet
        // Also remove any items they dont have atm
        let inventoryItemArr = [];
        itemSheetArr.forEach((i) => {
            for (var c in singleCard) {
                if (c === keyCreator(i.item) && ((singleCard[keyCreator(i.item)] !== "0" && singleCard[keyCreator(i.item)] !== ""))) {
                    let inventoryItems = {
                        type: i.type,
                        item: i.item,
                        image: i.image,
                        itemlink: folderURL + "/items.html?" + itemCardKey + "=" + i.item,
                        amount: singleCard[keyCreator(i.item)],
                    };
                    inventoryItemArr.push(inventoryItems);
                };
            }
        });

        // Sort items by type if applicable
        if (charadexInfo.sortTypes) {
            inventoryItemArr.sort(function (a, b) {
                return charadexInfo.sortTypes.indexOf(a.type) - charadexInfo.sortTypes.indexOf(b.type);
            });
        };

        // Group by the item type
        let orderItems = Object.groupBy(inventoryItemArr, ({ type }) => type);

        // Create Rows
        let rows = [];
        for (var i in orderItems) {

            // Get the headers and cols
            let cols = [];
            orderItems[i].forEach((v) => {
                let HTML = $("#item-list-col").clone();
                HTML.find(".item-img").attr('src', v.image);
                HTML.find(".itemlink").attr('href', v.itemlink);
                HTML.find(".item").html(v.item);
                HTML.find(".amount").html(v.amount);
                cols.push(HTML);
            });

            // Smack everything together
            let rowHTML = $("#item-list-section").clone().html([
                $("#item-list-header").clone().html(i),
                $("#item-list-row").clone().html(cols)
            ]);

            rows.push(rowHTML);

        };

        // Make items show up
        $("#item-list").html(rows);

        // Grab the log sheet and render log
        let logArray = await fetchSheet(charadexInfo.logSheetPage);
        getLog(logArray, singleCard, "username");

        // Render card
        let charadexItem = new List("charadex-gallery", itemOptions, singleCard);


    } else {

        // Show pagination
        createPagination(sheetArray, charadexInfo.itemAmount);

        // Create the Gallery
        let galleryOptions = {
            item: 'charadex-entries',
            valueNames: createListKeys(sheetArray),
            searchColumns: [cardKey],
            page: charadexInfo.itemAmount,
            pagination: [{
                innerWindow: 1,
                left: 1,
                right: 1,
                item: `<li class='page-item'><a class='page page-link'></a></li>`,
                paginationClass: 'pagination-top',
            }],
        };

        // Render Gallery
        let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

        // Make filters workie
        createSearch(charadex, [cardKey]);


    }

};


/* ==================================================================== */
/* This is just to fill out some of the front page automatically
/* You're free to delete and create something yourself!
======================================================================= */
const frontPage = (options) => {

    const charadexInfo = optionSorter(options);

    // Events
    let addEvents = async () => {
        if ($("#prompt-gallery").length != 0) {
            if (charadexInfo.numOfPrompts != 0) {

                // Grab dah sheet
                let events = await fetchSheet(charadexInfo.promptSheetPage);
                let cardKey = Object.keys(events[0])[0];

                // Sort by End Date
                let newestEvents = events.sort(function (a, b) {
                    var c = new Date(a.enddate);
                    var d = new Date(b.enddate);
                    return d - c;
                });

                // Show x Amount on Index
                let indexEvents = newestEvents.slice(0, charadexInfo.numOfPrompts);

                // Add card link
                for (var i in indexEvents) { indexEvents[i].cardlink = folderURL + "prompts.html?" + cardKey + "=" + indexEvents[i][cardKey]; }

                // Nyoom
                let galleryOptions = {
                    item: 'prompt-item',
                    valueNames: createListKeys(indexEvents),
                };

                // Render Gallery
                let charadex = new List('prompt-gallery', galleryOptions, indexEvents);

            } else {
                $("#prompt-gallery").hide();
            }
        }
    }; addEvents();

    // Staff
    let addStaff = async () => {
        if ($("#staff-gallery").length != 0) {
            if (charadexInfo.numOfStaff != 0) {

                // Grab dah sheet
                let mods = await fetchSheet(charadexInfo.staffSheetPage);

                // Show x Amount on Index
                let indexMods = mods.slice(0, charadexInfo.numOfStaff);

                // Nyoom
                let galleryOptions = {
                    item: 'staff-item',
                    valueNames: createListKeys(indexMods),
                };

                // Render Gallery
                let charadex = new List('staff-gallery', galleryOptions, indexMods);

            } else {
                $("#staff-gallery").hide();
            }
        }
    }; addStaff();

    // Designs
    let addDesigns = async () => {
        if ($("#design-gallery").length != 0) {
            if (charadexInfo.numOfDesigns != 0) {

                // Grab dah sheet
                let designs = await fetchSheet(charadexInfo.masterlistSheetPage);

                // Filter out any MYO slots, reverse and pull the first 4
                let selectDesigns = designs.filter((i) => { return i.designtype != 'MYO Slot' }).reverse().slice(0, charadexInfo.numOfDesigns);

                // Add cardlink
                let cardKey = Object.keys(selectDesigns[0])[0];
                for (var i in selectDesigns) { selectDesigns[i].cardlink = folderURL + "masterlist.html?" + cardKey + "=" + selectDesigns[i][cardKey]; }

                // Nyoom
                let galleryOptions = {
                    item: 'design-item',
                    valueNames: createListKeys(selectDesigns),
                };

                // Render Gallery
                let charadex = new List('design-gallery', galleryOptions, selectDesigns);

            } else {
                $("#design-gallery").hide();
            }
        }
    }; addDesigns();

};


/* ==================================================================== */
/* Softload pages
======================================================================= */
$(window).on('pageshow', function () { loadPage() });